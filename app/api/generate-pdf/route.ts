import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import { supabase } from "@/lib/supabase";
import { loadImages } from "@/lib/pdfImages";
import TableroPDF from "@/components/pdf/TableroPDF";
import type { PersonalizacionRutinas } from "@/types/pedido";

// Register Nunito font (local files under public/fonts/)
const fontsDir = path.join(process.cwd(), "public", "fonts");
Font.register({
  family: "Nunito",
  fonts: [
    { src: `${fontsDir}/Nunito-Regular.woff`,   fontWeight: 400 },
    { src: `${fontsDir}/Nunito-Bold.woff`,      fontWeight: 700 },
    { src: `${fontsDir}/Nunito-ExtraBold.woff`, fontWeight: 800 },
  ],
});

// Hard-coded test pedido — used when pedidoId === "test"
const TEST_PEDIDO = {
  id: "test",
  nombre_nino: "Sofía",
  color_acento: "#A5C9E8",
  personalizacion: {
    manana: ["despertar", "dientes", "desayuno", "vestirse", "mochila", "colegio", "pelo"],
    siesta: ["almuerzo", "siesta", "lectura", "juego", "tarea", "merienda"],
    noche: ["cena", "bano", "pijama", "cuento", "dientes_noche", "dormir"],
  } as PersonalizacionRutinas,
};

export async function POST(req: NextRequest) {
  const { pedidoId } = await req.json();

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
  const allIconIds = [...(p.manana ?? []), ...(p.siesta ?? []), ...(p.noche ?? [])];
  const images = loadImages(allIconIds);

  const element = React.createElement(TableroPDF, {
    nombreNino: pedido.nombre_nino,
    colorAcento: pedido.color_acento,
    manana: p.manana ?? [],
    siesta: p.siesta ?? [],
    noche: p.noche ?? [],
    images,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

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
