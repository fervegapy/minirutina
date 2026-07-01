"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";
import { extraerEmail, extraerNombre } from "@/lib/contacto";
import {
  enviarEnCamino,
  enviarFeedback,
  enviarPedidoConfirmado,
  enviarRecordatorioPago,
  productoLabel,
} from "@/lib/emails/pedido-emails";
import { generarAdjuntosDigitales } from "@/lib/pdf/adjuntos";
import type { EstadoPedido } from "@/types/pedido";

// Re-check admin status server-side. The middleware already protects /admin
// but server actions can be called from anywhere — defense in depth.
async function asegurarAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("No autorizado.");
  }
  return supabase;
}

type SupabaseAdminClient = Awaited<ReturnType<typeof asegurarAdmin>>;

// Builds the email item summaries for a pedido, falling back to the legacy
// pedido columns when there are no pedido_items rows.
async function resumenPedido(supabase: SupabaseAdminClient, pedidoId: string) {
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("nombre_nino, producto, contacto, costo_envio")
    .eq("id", pedidoId)
    .single();
  if (!pedido) return null;

  const { data: itemsRows } = await supabase
    .from("pedido_items")
    .select("producto, nombre_nino, tipo_entrega, precio_pyg, orden")
    .eq("pedido_id", pedidoId)
    .order("orden", { ascending: true });

  const items = (itemsRows ?? []).map((it) => ({
    productoLabel: productoLabel(it.producto as string),
    nombreNino:    it.nombre_nino as string,
    tipoEntrega:   (it.tipo_entrega === "digital" ? "digital" : "fisico") as "digital" | "fisico",
    precioPyg:     Number(it.precio_pyg) || 0,
  }));

  const subtotal = items.reduce((s, it) => s + it.precioPyg, 0);
  const total = subtotal + (Number(pedido.costo_envio) || 0);

  return {
    email:         extraerEmail(pedido.contacto),
    nombreCliente: extraerNombre(pedido.contacto),
    nombreNino:    pedido.nombre_nino as string,
    items,
    total,
  };
}

export async function cambiarEstadoPedido(
  pedidoId: string,
  nuevoEstado: EstadoPedido,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId);
    if (error) return { ok: false, error: error.message };

    // Fire the matching customer email on shipping / delivery transitions.
    // Awaited (serverless may freeze after response) but never blocks the
    // state change — failures are logged only.
    if (nuevoEstado === "enviado" || nuevoEstado === "entregado") {
      try {
        const r = await resumenPedido(supabase, pedidoId);
        if (r?.email) {
          if (nuevoEstado === "enviado") {
            await enviarEnCamino({ to: r.email, nombreCliente: r.nombreCliente, pedidoId, nombreNino: r.nombreNino });
          } else {
            await enviarFeedback({ to: r.email, nombreCliente: r.nombreCliente, pedidoId, nombreNino: r.nombreNino });
          }
        }
      } catch (e) {
        console.error("[cambiarEstadoPedido] email failed:", e);
      }
    }

    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath("/admin/pedidos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// Manual "recordatorio de pago" — sent from the pedido detail while the
// order is still pending payment.
export async function enviarRecordatorioPagoManual(
  pedidoId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await asegurarAdmin();
    const r = await resumenPedido(supabase, pedidoId);
    if (!r) return { ok: false, error: "No se encontró el pedido." };
    if (!r.email) return { ok: false, error: "Este pedido no tiene email registrado." };
    if (r.items.length === 0) return { ok: false, error: "El pedido no tiene items." };

    const res = await enviarRecordatorioPago({
      to:            r.email,
      nombreCliente: r.nombreCliente,
      pedidoId,
      items:         r.items,
      total:         r.total,
    });
    if (!res.ok) return { ok: false, error: res.error ?? "No se pudo enviar el email." };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// Manual "reenviar confirmación de pago" — regenerates the digital PDF(s) and
// re-sends the same confirmation email the dLocal webhook sends on payment.
// Used to recover orders where the automatic email failed (Resend hiccup,
// webhook never fired, etc.). Surfaces the real send error so the team can see
// WHY it failed instead of it being swallowed by a fire-and-forget .catch.
export async function reenviarConfirmacionPago(
  pedidoId: string,
): Promise<{ ok: boolean; error?: string; sinAdjuntos?: boolean }> {
  try {
    const supabase = await asegurarAdmin();
    const r = await resumenPedido(supabase, pedidoId);
    if (!r) return { ok: false, error: "No se encontró el pedido." };
    if (!r.email) return { ok: false, error: "Este pedido no tiene email registrado." };
    if (r.items.length === 0) return { ok: false, error: "El pedido no tiene items." };

    // Regenerate the print-ready PDF(s) for any digital item — same as the
    // payment webhook. Físico-only pedidos get an email with no attachment.
    const adjuntos = await generarAdjuntosDigitales(pedidoId);

    const res = await enviarPedidoConfirmado({
      to:            r.email,
      nombreCliente: r.nombreCliente,
      pedidoId,
      items:         r.items,
      total:         r.total,
      attachments:   adjuntos,
    });
    if (!res.ok) return { ok: false, error: res.error ?? "No se pudo enviar el email." };
    return { ok: true, sinAdjuntos: adjuntos.length === 0 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
