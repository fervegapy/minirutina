// On-demand PDF download for a single pedido_item. This is the target of the
// "Descargar tu tablero" button in the 100%-coupon confirmation email: the
// file is generated when the customer clicks, so nothing heavy runs during
// the checkout request itself.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateBuffer, type PdfData } from "@/lib/pdf/render";
import type { Genero } from "@/lib/iconAssets";
import type {
  PersonalizacionRutinas,
  PersonalizacionRecompensas,
} from "@/types/pedido";

export const runtime = "nodejs";

function slug(s: string): string {
  return (s || "tablero")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tablero";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { itemId: string } },
) {
  const { data: item, error } = await supabaseAdmin
    .from("pedido_items")
    .select("producto, nombre_nino, color_acento, personalizacion")
    .eq("id", params.itemId)
    .maybeSingle();

  if (error || !item) {
    return NextResponse.json({ error: "Tablero no encontrado" }, { status: 404 });
  }

  const p = (item.personalizacion ?? {}) as
    & Partial<PersonalizacionRutinas>
    & Partial<PersonalizacionRecompensas>
    & { genero?: Genero | null };

  const data: PdfData = {
    nombreNino:  item.nombre_nino,
    colorAcento: item.color_acento,
    manana:      p.manana,
    noche:       p.noche,
    genero:      p.genero ?? null,
    cantidad:    p.cantidad,
    sticker:     p.sticker,
  };

  const buffer = await generateBuffer(item.producto, data, false, "cliente");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tablero-${slug(item.nombre_nino)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
