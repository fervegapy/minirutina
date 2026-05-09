import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import { supabase } from "@/lib/supabase";
import { loadImages } from "@/lib/pdfImages";
import TableroPDF from "@/components/pdf/TableroPDF";
import type { PersonalizacionRutinas } from "@/types/pedido";

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

// Hard-coded test pedido — used when pedidoId === "test"
const TEST_PEDIDO = {
  id: "test",
  nombre_nino: "Sofía",
  color_acento: "#A5C9E8",
  personalizacion: {
    manana: ["despertar", "dientes", "desayuno", "vestirse", "mochila", "colegio", "pelo"],
    noche: ["cena", "bano", "pijama", "cuento", "dientes_noche", "dormir"],
  } as PersonalizacionRutinas,
};

async function buildBuffer(
  nombreNino: string,
  colorAcento: string,
  manana: string[],
  noche: string[],
) {
  const allIconIds = [...manana, ...noche];
  const images = loadImages(allIconIds);
  const element = React.createElement(TableroPDF, {
    nombreNino, colorAcento, manana, noche, images, subtitleFont: SUBTITLE_FONT,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ── Preview mode: inline data, no DB needed ───────────────────────────────
  if (body.preview) {
    const { nombreNino, colorAcento, manana = [], noche = [] } = body;
    const buffer = await buildBuffer(nombreNino, colorAcento, manana, noche);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tablero-${nombreNino ?? "preview"}.pdf"`,
      },
    });
  }

  // ── Pedido mode: fetch from DB (or use test hardcode) ────────────────────
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

  const p = pedido.personalizacion as PersonalizacionRutinas;
  const buffer = await buildBuffer(
    pedido.nombre_nino,
    pedido.color_acento,
    p.manana ?? [],
    p.noche ?? [],
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
