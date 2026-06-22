// dLocal Go webhook handler.
//
// dLocal POSTs { "payment_id": "DP-xxx" } with an HMAC-SHA256 signature in
// the Authorization header. We verify it, fetch the full payment to read
// its status, and if PAID we mark the pedido as 'pagado' + fire the
// customer / admin notification emails (same as the old Stripe webhook).
import { NextRequest, NextResponse } from "next/server";
import { getPayment, verifyWebhookSignature } from "@/lib/dlocal";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email";
import { captureServerEvent } from "@/lib/posthog-server";

export const runtime = "nodejs";

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas:     "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
  semana:      "Plan de la Semana",
};

function fmtPyg(n: number) {
  return "Gs. " + Math.round(n).toLocaleString("es-PY");
}

function extractEmail(contacto?: string | null): string | null {
  if (!contacto) return null;
  const m = contacto.match(/Email:\s*([^\s|]+)/i);
  return m?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const auth = req.headers.get("authorization");

  if (!(await verifyWebhookSignature(rawBody, auth))) {
    console.error("[dlocal/webhook] invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let paymentId: string | undefined;
  try {
    paymentId = (JSON.parse(rawBody) as { payment_id?: string }).payment_id;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!paymentId) {
    return NextResponse.json({ error: "missing payment_id" }, { status: 400 });
  }

  try {
    // Always fetch the authoritative status from dLocal.
    const payment = await getPayment(paymentId);
    const pedidoId = payment.order_id;
    if (!pedidoId) {
      console.warn("[dlocal/webhook] payment", paymentId, "has no order_id");
      return NextResponse.json({ received: true });
    }

    if (payment.status !== "PAID") {
      // Capture the non-PAID terminal states (REJECTED / EXPIRED /
      // CANCELLED) to PostHog so we can analyze drop-off reasons. We use
      // the pedido_id as distinct_id since we don't have an email here.
      if (["REJECTED", "EXPIRED", "CANCELLED"].includes(payment.status)) {
        captureServerEvent({
          distinctId: pedidoId,
          event:      "pago_fallido",
          properties: {
            pedido_id:        pedidoId,
            dlocal_payment:   payment.id,
            status:           payment.status,
            payment_method:   payment.payment_method_type ?? null,
            amount_pyg:       Number(payment.amount) || 0,
            currency:         payment.currency ?? "PYG",
          },
        }).catch(() => {});
      }
      console.log("[dlocal/webhook]", paymentId, "status", payment.status);
      return NextResponse.json({ received: true });
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("pedidos")
      .update({
        estado:            "pagado",
        dlocal_payment_id: payment.id,
        metodo_pago:       "dlocal",
        moneda_pago:       payment.currency ?? "PYG",
      })
      .eq("id", pedidoId)
      .select("id, nombre_nino, producto, contacto");

    if (updErr) {
      console.error("[dlocal/webhook] supabase update error:", updErr);
      return NextResponse.json({ error: "db update failed" }, { status: 500 });
    }
    if (!updated || updated.length === 0) {
      console.warn("[dlocal/webhook] 0 rows for pedido", pedidoId);
      return NextResponse.json({ received: true });
    }

    const pedido = updated[0] as { id: string; nombre_nino: string; producto: string; contacto?: string | null };
    const productoLabel = NOMBRE_PRODUCTO[pedido.producto] ?? pedido.producto;
    const montoPyg = Number(payment.amount) || 0;

    // Customer email
    const customerEmail = extractEmail(pedido.contacto);

    // Fetch items so emails + analytics reflect the full cart.
    const { data: itemsRows } = await supabaseAdmin
      .from("pedido_items")
      .select("producto, nombre_nino, tipo_entrega, precio_pyg, orden")
      .eq("pedido_id", pedidoId)
      .order("orden", { ascending: true });
    const items = (itemsRows ?? []) as Array<{
      producto: string; nombre_nino: string; tipo_entrega: string; precio_pyg: number;
    }>;

    // Subject / headline reflect single vs multi-item.
    const subjectName = items.length > 1
      ? `${items.length} tableros (${items.map((it) => it.nombre_nino).join(", ")})`
      : `${pedido.nombre_nino} (${productoLabel})`;
    const itemsListHtml = items.length > 0
      ? `<ul style="margin:0 0 12px;padding-left:18px;font-size:14px;color:#22244ecc;">
           ${items.map((it) =>
             `<li>${NOMBRE_PRODUCTO[it.producto] ?? it.producto} — <strong>${it.nombre_nino}</strong>
              <span style="color:#22244e88;">· ${it.tipo_entrega === "digital" ? "Digital" : "Impreso"} · ${fmtPyg(it.precio_pyg)}</span></li>`
           ).join("")}
         </ul>`
      : "";

    // Server-side analytics — confirmed payment.
    captureServerEvent({
      distinctId: customerEmail ?? pedidoId,
      event:      "pago_completado",
      properties: {
        pedido_id:      pedidoId,
        dlocal_payment: payment.id,
        items_count:    items.length,
        productos:      items.map((it) => it.producto),
        amount_pyg:     montoPyg,
        currency:       payment.currency ?? "PYG",
        payment_method: payment.payment_method_type ?? null,
      },
    }).catch(() => {});

    if (customerEmail) {
      const greeting = items.length > 1
        ? `Confirmamos tu pago de <strong>${fmtPyg(montoPyg)}</strong> por tus <strong>${items.length} tableros</strong>:`
        : `Confirmamos tu pago de <strong>${fmtPyg(montoPyg)}</strong> para el <strong>${productoLabel}</strong> de <strong>${pedido.nombre_nino}</strong>.`;
      sendEmail({
        to:      customerEmail,
        subject: `Confirmamos tu pago — Minirutina #${pedidoId.slice(0, 8).toUpperCase()}`,
        html: `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#22244e;padding:24px;">
          <h2 style="color:#22244e;">¡Pago recibido! 💳</h2>
          <p>${greeting}</p>
          ${items.length > 1 ? itemsListHtml : ""}
          <p>Ya empezamos a prepararlo. Te avisamos por WhatsApp cuando esté listo
          (estimado: 48 horas).</p>
          <p style="font-size:12px;color:#22244e88;">Pedido #${pedidoId.slice(0,8).toUpperCase()} · minirutina.com</p>
        </body></html>`,
      }).catch((e) => console.error("[dlocal/webhook] customer email failed:", e));
    }

    // Admin notification
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    for (const adminEmail of adminEmails) {
      sendEmail({
        to:      adminEmail,
        subject: `💸 Pago nuevo (dLocal) — ${subjectName}`,
        html: `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#22244e;padding:24px;">
          <h2>💸 Pago nuevo</h2>
          <p>Pedido <strong>#${pedidoId.slice(0,8).toUpperCase()}</strong> ·
          ${items.length > 1 ? `<strong>${items.length} items</strong>` : `<strong>${pedido.nombre_nino}</strong> — ${productoLabel}`}.</p>
          ${itemsListHtml}
          <p style="font-size:18px;"><strong>${fmtPyg(montoPyg)}</strong></p>
          ${pedido.contacto ? `<p style="font-size:13px;color:#22244e88;">Contacto: ${pedido.contacto}</p>` : ""}
          <p><a href="https://www.minirutina.com/admin/pedidos/${pedidoId}" style="background:#22244e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Ver en /admin/pedidos</a></p>
        </body></html>`,
      }).catch((e) => console.error("[dlocal/webhook] admin email failed:", e));
    }

    console.log("[dlocal/webhook] pedido", pedidoId, "marcado como pagado");
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[dlocal/webhook] handler error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
}
