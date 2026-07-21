// Stripe webhook handler. Listens for:
//   - checkout.session.completed     → mark pedido as 'pagado', snapshot
//                                       Stripe refs, send customer +
//                                       admin email notifications
//   - payment_intent.payment_failed  → log + leave the pedido as 'pendiente'
//
// IMPORTANT: this endpoint MUST receive the raw request body (not parsed
// JSON) so we can verify Stripe's signature. We use req.text() and the
// Stripe SDK's constructEvent helper.
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

// Force node runtime — edge runtime can't validate signatures with the
// stripe sdk reliably.
export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas:     "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
  semana:      "Plan de la Semana",
};

function fmtUsd(n: number) {
  return "USD " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPyg(n: number) {
  return "Gs. " + Math.round(n).toLocaleString("es-PY");
}

interface PedidoMinimo {
  nombre_nino: string;
  producto:    string;
  contacto?:   string | null;
}

/** Best-effort: extract an email out of the contacto column ("Email: foo | WhatsApp: 09xx"). */
function extractEmail(contacto?: string | null): string | null {
  if (!contacto) return null;
  const match = contacto.match(/Email:\s*([^\s|]+)/i);
  return match?.[1] ?? null;
}

function emailClienteHtml({
  nombreNino,
  productoLabel,
  pedidoId,
  amountUsd,
  amountPyg,
}: {
  nombreNino:    string;
  productoLabel: string;
  pedidoId:      string;
  amountUsd:     number;
  amountPyg:     number | null;
}) {
  const idCorto = pedidoId.slice(0, 8).toUpperCase();
  return `<!DOCTYPE html>
<html lang="es"><body style="margin:0;padding:0;background:#fffef6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#22244e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="background:#22244e;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:800;color:#ecbc5d;letter-spacing:-0.5px;">Minirutina</p>
      </td></tr>
      <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;">¡Pago recibido! 💳</p>
        <p style="margin:0 0 24px;font-size:15px;color:#22244ecc;line-height:1.6;">
          Confirmamos tu pago para el <strong>${productoLabel}</strong> de
          <strong>${nombreNino}</strong>. Ya empezamos a prepararlo.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffef6;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#22244e55;">Resumen del pago</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:14px;color:#22244ecc;padding:4px 0;">Pedido</td><td align="right" style="font-size:14px;font-weight:600;padding:4px 0;font-family:monospace;">#${idCorto}</td></tr>
              <tr><td style="font-size:14px;color:#22244ecc;padding:4px 0;">Producto</td><td align="right" style="font-size:14px;font-weight:600;padding:4px 0;">${productoLabel}</td></tr>
              <tr><td style="font-size:14px;color:#22244ecc;padding:4px 0;">Para</td><td align="right" style="font-size:14px;font-weight:600;padding:4px 0;">${nombreNino}</td></tr>
              <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>
              <tr><td style="font-size:15px;font-weight:700;padding:4px 0;">Total cobrado</td>
                  <td align="right" style="font-size:18px;font-weight:800;padding:4px 0;">${fmtUsd(amountUsd)}${amountPyg ? ` <span style="font-size:12px;color:#22244e88;font-weight:500;">(≈ ${fmtPyg(amountPyg)})</span>` : ""}</td></tr>
            </table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecbc5d22;border:1px solid #ecbc5d55;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:18px 24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#22244e55;">Próximos pasos</p>
            <p style="margin:0;font-size:14px;color:#22244ecc;line-height:1.6;">
              Preparamos tu tablero y te avisamos por WhatsApp en cuanto esté listo para enviar.
              Tiempo estimado: <strong>48 horas</strong>.
            </p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#22244e66;line-height:1.6;">Minirutina · Asunción · <a href="https://minirutina.com" style="color:#22244e;text-decoration:none;">minirutina.com</a></p>
      </td></tr>
    </table></td></tr>
  </table>
</body></html>`;
}

function emailAdminHtml({
  pedidoId,
  nombreNino,
  productoLabel,
  amountUsd,
  amountPyg,
  contacto,
  sessionId,
}: {
  pedidoId:      string;
  nombreNino:    string;
  productoLabel: string;
  amountUsd:     number;
  amountPyg:     number | null;
  contacto:      string | null;
  sessionId:     string | null;
}) {
  const idCorto = pedidoId.slice(0, 8).toUpperCase();
  const adminUrl = `https://www.minirutina.com/admin/pedidos/${pedidoId}`;
  const stripeUrl = sessionId
    ? `https://dashboard.stripe.com/test/payments?query=${encodeURIComponent(sessionId)}`
    : null;
  return `<!DOCTYPE html>
<html><body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#22244e;padding:24px;">
  <h2 style="margin:0 0 12px;">💸 Pago nuevo</h2>
  <p style="margin:0 0 16px;color:#22244ecc;font-size:14px;">
    Pedido <strong>#${idCorto}</strong> de <strong>${nombreNino}</strong> — ${productoLabel}.
  </p>
  <p style="margin:0 0 8px;font-size:18px;"><strong>${fmtUsd(amountUsd)}</strong>${amountPyg ? ` <span style="color:#22244e88;">≈ ${fmtPyg(amountPyg)}</span>` : ""}</p>
  ${contacto ? `<p style="margin:8px 0 16px;font-size:13px;color:#22244e88;">Contacto: ${contacto}</p>` : ""}
  <p style="margin:16px 0;">
    <a href="${adminUrl}" style="background:#22244e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Ver en /admin/pedidos</a>
    ${stripeUrl ? `<a href="${stripeUrl}" style="margin-left:8px;background:#fff;color:#22244e;border:1px solid #e5e7eb;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Ver en Stripe</a>` : ""}
  </p>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }
  if (!WEBHOOK_SECRET) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (e) {
    console.error("[stripe/webhook] signature verification failed:", e);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const pedidoId = session.metadata?.pedido_id;
        if (!pedidoId) {
          console.warn("[stripe/webhook] session.completed without pedido_id metadata");
          break;
        }

        const tasa  = Number(session.metadata?.tasa_pyg_usd ?? 0);
        const moneda = (session.currency ?? "usd").toUpperCase();
        const amountTotal = session.amount_total ?? 0;          // in minor units
        const amountUsd = amountTotal / 100;
        const amountPyg = tasa > 0 ? amountUsd * tasa : null;
        const pi = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

        const { data: updated, error: updErr } = await supabaseAdmin
          .from("pedidos")
          .update({
            estado:                   "pagado",
            tipo_cambio_usado:        tasa > 0 ? tasa : null,
            moneda_pago:              moneda,
            stripe_session_id:        session.id,
            stripe_payment_intent_id: pi,
          })
          .eq("id", pedidoId)
          .select("id, nombre_nino, producto, contacto");

        if (updErr) {
          console.error("[stripe/webhook] supabase update error:", updErr);
          return NextResponse.json({ error: "db update failed" }, { status: 500 });
        }
        if (!updated || updated.length === 0) {
          console.warn("[stripe/webhook] 0 rows affected for pedido", pedidoId);
          break;
        }

        const pedido = updated[0] as PedidoMinimo & { id: string };
        const productoLabel = NOMBRE_PRODUCTO[pedido.producto] ?? pedido.producto;

        // Customer email — best-effort, don't fail the webhook if email fails.
        const customerEmail = session.customer_details?.email
          ?? session.customer_email
          ?? extractEmail(pedido.contacto);
        if (customerEmail) {
          sendEmail({
            to:      customerEmail,
            subject: `Confirmamos tu pago — Minirutina #${pedidoId.slice(0, 8).toUpperCase()}`,
            html:    emailClienteHtml({
              nombreNino:    pedido.nombre_nino,
              productoLabel,
              pedidoId,
              amountUsd,
              amountPyg,
            }),
          }).catch((e) => console.error("[stripe/webhook] customer email failed:", e));
        }

        // Admin notification — sent to every address in ADMIN_EMAILS.
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
          .split(",").map((s) => s.trim()).filter(Boolean);
        for (const adminEmail of adminEmails) {
          sendEmail({
            to:      adminEmail,
            subject: `💸 Pago nuevo — ${pedido.nombre_nino} (${productoLabel})`,
            html:    emailAdminHtml({
              pedidoId,
              nombreNino:    pedido.nombre_nino,
              productoLabel,
              amountUsd,
              amountPyg,
              contacto:      pedido.contacto ?? null,
              sessionId:     session.id,
            }),
          }).catch((e) => console.error("[stripe/webhook] admin email failed:", e));
        }

        console.log("[stripe/webhook] pedido", pedidoId, "marcado como pagado");
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const pedidoId = intent.metadata?.pedido_id;
        console.warn(
          "[stripe/webhook] payment failed for pedido",
          pedidoId,
          intent.last_payment_error?.message,
        );
        break;
      }

      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe/webhook] handler error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
}
