import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Genero } from "@/lib/iconAssets";
import { generateBuffer, type PdfMode } from "@/lib/pdf/render";
import type {
  PersonalizacionRutinas,
  PersonalizacionRecompensas,
} from "@/types/pedido";

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

  // Pedido mode: fetch from DB (or use test hardcode).
  // Accepts either:
  //   { pedidoItemId } → new multi-item path, reads from pedido_items
  //   { pedidoId }     → legacy single-item path, reads from pedidos
  //   { pedidoId: "test" } → hardcoded test fixture
  const { pedidoId, pedidoItemId } = body as {
    pedidoId?:     string;
    pedidoItemId?: string;
  };
  let pedido: typeof TEST_PEDIDO;
  // Used later when uploading to Storage — items get a per-item filename.
  const storageId = pedidoItemId ?? pedidoId ?? "test";

  if (pedidoId === "test") {
    pedido = TEST_PEDIDO;
  } else if (pedidoItemId) {
    const { data, error } = await supabase
      .from("pedido_items")
      .select("*")
      .eq("id", pedidoItemId)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Pedido item not found" }, { status: 404 });
    }
    // Map item shape → pedido shape for the generator.
    pedido = {
      ...TEST_PEDIDO,
      nombre_nino:    data.nombre_nino,
      color_acento:   data.color_acento,
      producto:       data.producto,
      personalizacion: data.personalizacion,
      tipo_entrega:   data.tipo_entrega,
    } as typeof TEST_PEDIDO;
  } else if (pedidoId) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Pedido not found" }, { status: 404 });
    }
    pedido = data;
  } else {
    return NextResponse.json({ error: "Missing pedidoId or pedidoItemId" }, { status: 400 });
  }

  const producto = pedido.producto ?? "rutinas";
  const p = pedido.personalizacion as
    & Partial<PersonalizacionRutinas>
    & Partial<PersonalizacionRecompensas>
    & { genero?: Genero | null };

  const mode: PdfMode = body.mode === "imprenta" ? "imprenta" : "cliente";

  // Paid path: no watermark — this is the final printable file (or the
  // expanded imprenta file with extra ficha pages).
  const buffer = await generateBuffer(
    producto,
    {
      nombreNino:  pedido.nombre_nino,
      colorAcento: pedido.color_acento,
      manana:      p.manana,
      noche:       p.noche,
      genero:      p.genero ?? null,
      cantidad:    p.cantidad,
      sticker:     p.sticker,
    },
    false,
    mode,
  );

  // Test mode OR imprenta mode: return PDF directly so the admin can
  // download/preview without going through Supabase Storage.
  if (pedidoId === "test" || mode === "imprenta") {
    const fname = mode === "imprenta"
      ? `imprenta-${pedido.nombre_nino ?? storageId}.pdf`
      : `tablero-${pedido.nombre_nino ?? storageId}.pdf`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fname}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Upload to Supabase Storage — per-item filenames keep multi-item
  // pedidos from clobbering each other.
  const fileName = `${storageId}.pdf`;
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

  // Persist URL on the pedido (legacy path only — pedido_items doesn't
  // have an archivo_url column today, and the cliente PDF download path
  // is only used by the legacy single-item /confirmacion page).
  if (pedidoId && pedidoId !== "test") {
    await supabase
      .from("pedidos")
      .update({ archivo_url: signed.signedUrl })
      .eq("id", pedidoId);
  }

  return NextResponse.json({ url: signed.signedUrl });
}
