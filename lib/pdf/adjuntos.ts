// Generates the print-ready PDF(s) for the DIGITAL items of a pedido so they
// can be attached to the confirmation email. Físico items are skipped — those
// go through the producción/envío flow instead.
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateBuffer, type PdfData } from "@/lib/pdf/render";
import type { EmailAttachment } from "@/lib/email";
import type { Genero } from "@/lib/iconAssets";
import type {
  PersonalizacionRutinas,
  PersonalizacionRecompensas,
} from "@/types/pedido";

// Slugify a child's name for a safe filename (tablero-sofia.pdf).
function slug(s: string): string {
  return (s || "tablero")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tablero";
}

/**
 * Builds one cliente PDF (no watermark) per digital item of the pedido.
 * Returns an empty array when there are no digital items. Never throws — on a
 * per-item render failure it logs and skips that item.
 */
export async function generarAdjuntosDigitales(pedidoId: string): Promise<EmailAttachment[]> {
  const { data: rows } = await supabaseAdmin
    .from("pedido_items")
    .select("producto, nombre_nino, color_acento, personalizacion, tipo_entrega, orden")
    .eq("pedido_id", pedidoId)
    .eq("tipo_entrega", "digital")
    .order("orden", { ascending: true });

  const items = rows ?? [];
  const attachments: EmailAttachment[] = [];

  for (const it of items) {
    try {
      const p = (it.personalizacion ?? {}) as
        & Partial<PersonalizacionRutinas>
        & Partial<PersonalizacionRecompensas>
        & { genero?: Genero | null };

      const data: PdfData = {
        nombreNino:  it.nombre_nino,
        colorAcento: it.color_acento,
        manana:      p.manana,
        noche:       p.noche,
        genero:      p.genero ?? null,
        cantidad:    p.cantidad,
        sticker:     p.sticker,
      };

      const buffer = await generateBuffer(it.producto, data, false, "cliente");
      attachments.push({ filename: `tablero-${slug(it.nombre_nino)}.pdf`, content: buffer });
    } catch (e) {
      console.error("[adjuntos] no se pudo generar PDF para item de", pedidoId, e);
    }
  }

  return attachments;
}
