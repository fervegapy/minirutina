import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import { supabase } from "@/lib/supabase";
import { loadImages } from "@/lib/pdfImages";
import type { Genero } from "@/lib/iconAssets";
import TableroPDF from "@/components/pdf/TableroPDF";
import RecompensaPDF from "@/components/pdf/RecompensaPDF";
import type {
  PersonalizacionRutinas,
  PersonalizacionRecompensas,
} from "@/types/pedido";

const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({ family: "Figtree", src: `${fontsDir}/Figtree-Bold.woff`, fontWeight: 700 });
Font.register({ family: "Nunito", fonts: [
  { src: `${fontsDir}/Nunito-Regular.woff`,   fontWeight: 400 },
  { src: `${fontsDir}/Nunito-Bold.woff`,      fontWeight: 700 },
  { src: `${fontsDir}/Nunito-ExtraBold.woff`, fontWeight: 800 },
]});

// KG Primary Penmanship: place KGPrimaryPenmanship.ttf in public/fonts/ to activate
import fs from "fs";
const kgPath = `${fontsDir}/KGPrimaryPenmanship.ttf`;
const KG_AVAILABLE = fs.existsSync(kgPath);
if (KG_AVAILABLE) {
  Font.register({ family: "KGPrimaryPenmanship", src: kgPath });
}
const SUBTITLE_FONT = KG_AVAILABLE ? "KGPrimaryPenmanship" : "Nunito";

// Hard-coded test pedido — used when pedidoId === "test" (rutinas only)
const TEST_PEDIDO = {
  id: "test",
  producto: "rutinas" as const,
  nombre_nino: "Sofía",
  color_acento: "#A5C9E8",
  personalizacion: {
    manana: ["levantarse", "cama", "bano", "cepillo", "vestirse", "desayunar", "agua"],
    noche: ["cena", "bano", "pijama", "cepillarse", "cuento", "orar", "dormir"],
    genero: "nina" as Genero,
  },
};

// ─── Builders ────────────────────────────────────────────────────────────────

async function buildRutinasBuffer(
  nombreNino: string,
  colorAcento: string,
  manana: string[],
  noche: string[],
  watermark: boolean,
  genero: Genero | null,
) {
  const allIconIds = [...manana, ...noche];
  const images = loadImages(allIconIds, genero);
  const element = React.createElement(TableroPDF, {
    nombreNino, colorAcento, manana, noche, images,
    subtitleFont: SUBTITLE_FONT,
    watermark,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

async function buildRecompensasBuffer(
  nombreNino: string,
  genero: Genero,
  cantidad: 10 | 20,
  watermark: boolean,
) {
  const element = React.createElement(RecompensaPDF, {
    nombreNino, genero, cantidad,
    subtitleFont: SUBTITLE_FONT,
    watermark,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

// Helpers to generate the right buffer from inline preview data or DB pedido data.
async function generateBuffer(
  producto: string,
  data: {
    nombreNino: string;
    colorAcento?: string;
    manana?: string[];
    noche?: string[];
    genero?: Genero | null;
    cantidad?: 10 | 20;
  },
  watermark: boolean,
): Promise<Buffer> {
  if (producto === "recompensas") {
    const genero = (data.genero ?? "nino") as Genero;
    const cantidad = (data.cantidad ?? 10) as 10 | 20;
    return buildRecompensasBuffer(data.nombreNino, genero, cantidad, watermark);
  }
  // default → rutinas
  return buildRutinasBuffer(
    data.nombreNino,
    data.colorAcento ?? "#a8c5a0",
    data.manana ?? [],
    data.noche ?? [],
    watermark,
    data.genero ?? null,
  );
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Preview mode: inline data, watermarked, served inline (not as a download)
  if (body.preview) {
    const producto = body.producto ?? "rutinas";
    const buffer = await generateBuffer(
      producto,
      {
        nombreNino:  body.nombreNino,
        colorAcento: body.colorAcento,
        manana:      body.manana,
        noche:       body.noche,
        genero:      body.genero,
        cantidad:    body.cantidad,
      },
      true,
    );
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Pedido mode: fetch from DB (or use test hardcode)
  const { pedidoId } = body;
  let pedido: typeof TEST_PEDIDO;

  if (pedidoId === "test") {
    pedido = TEST_PEDIDO;
  } else {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Pedido not found" }, { status: 404 });
    }
    pedido = data;
  }

  const producto = pedido.producto ?? "rutinas";
  const p = pedido.personalizacion as
    & Partial<PersonalizacionRutinas>
    & Partial<PersonalizacionRecompensas>
    & { genero?: Genero | null };

  // Paid path: no watermark — this is the final printable file
  const buffer = await generateBuffer(
    producto,
    {
      nombreNino:  pedido.nombre_nino,
      colorAcento: pedido.color_acento,
      manana:      p.manana,
      noche:       p.noche,
      genero:      p.genero ?? null,
      cantidad:    p.cantidad,
    },
    false,
  );

  // Test mode: return PDF directly as download
  if (pedidoId === "test") {
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tablero-test.pdf"`,
      },
    });
  }

  // Upload to Supabase Storage
  const fileName = `${pedidoId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("pdfs")
    .upload(fileName, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed", detail: uploadError.message }, { status: 500 });
  }

  // Signed URL valid for 48h
  const { data: signed, error: signError } = await supabase.storage
    .from("pdfs")
    .createSignedUrl(fileName, 60 * 60 * 48);

  if (signError || !signed) {
    return NextResponse.json({ error: "Could not create signed URL" }, { status: 500 });
  }

  // Persist URL on the pedido
  await supabase
    .from("pedidos")
    .update({ archivo_url: signed.signedUrl })
    .eq("id", pedidoId);

  return NextResponse.json({ url: signed.signedUrl });
}
