// Stripe webhook handler. Listens for:
//   - checkout.session.completed     → mark pedido as 'pagado'
//   - payment_intent.payment_failed  → log + leave the pedido as 'pendiente'
//
// IMPORTANT: this endpoint MUST receive the raw request body (not parsed
// JSON) so we can verify Stripe's signature. We use req.text() and the
// Stripe SDK's constructEvent helper.
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

// Force node runtime — edge runtime can't validate signatures with the
// stripe sdk reliably.
export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }
  if (!WEBHOOK_SECRET) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  // Stripe requires the RAW body bytes for signature verification.
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

        // Snapshot rate / currency / amount on the pedido.
        const tasa  = Number(session.metadata?.tasa_pyg_usd ?? 0);
        const moneda = (session.currency ?? "usd").toUpperCase();
        await supabase
          .from("pedidos")
          .update({
            estado:            "pagado",
            tipo_cambio_usado: tasa > 0 ? tasa : null,
            moneda_pago:       moneda,
          })
          .eq("id", pedidoId);

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
        // Other events we listed but don't need to act on yet (e.g.
        // payment_intent.succeeded fires alongside session.completed —
        // we handle the session one).
        break;
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe/webhook] handler error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
}
