// Generates the print-ready PDF(s) for the DIGITAL items of a pedido so they
// can be attached to the confirmation email. Físico items are skipped — those
// go through the producción/envío flow instead.
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateDigitalBuffer, generateInstructivoBuffer, type PdfData } from "@/lib/pdf/render";
import type { EmailAttachment } from "@/lib/email";
import type { Genero } from "@/lib/iconAssets";
import type {
  PersonalizacionRutinas,
  PersonalizacionRecompensas,
} from "@/types/pedido";

// Slugify a child's name for a safe filename (rutinas-sofia.pdf). The
// product goes in the name so two boards for the same kid don't collide.
function slug(s: string): string {
  return (s || "tablero")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tablero";
}

/**
 * Builds one print-ready PDF (imprenta version, front + back, cut line, no
 * watermark) per digital item of the pedido, plus the assembly guide.
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

      // Versión imprenta (frente y dorso, como el impreso que armamos acá)
      // con línea de corte para recortar en casa. Ver generateDigitalBuffer.
      const buffer = await generateDigitalBuffer(it.producto, data);
      attachments.push({ filename: `${it.producto}-${slug(it.nombre_nino)}.pdf`, content: buffer });
    } catch (e) {
      console.error("[adjuntos] no se pudo generar PDF para item de", pedidoId, e);
    }
  }

  // Una sola vez por email, aunque el pedido traiga varios tableros.
  if (attachments.length > 0) {
    try {
      attachments.push({ filename: "como-armar-tu-tablero.pdf", content: await generateInstructivoBuffer() });
    } catch (e) {
      console.error("[adjuntos] no se pudo generar el instructivo para", pedidoId, e);
    }
  }

  return attachments;
}
