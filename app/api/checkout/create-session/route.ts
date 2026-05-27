// Creates a Stripe Checkout Session for an existing pedido in Supabase.
//
// Flow:
//   1. The /checkout client form inserts the pedido first (status =
//      'pendiente') and then POSTs that pedido_id here.
//   2. We look up the pedido, read the current PYG→USD rate, compute the
//      USD amount, create a Checkout Session with dynamic price_data
//      (no pre-created products needed), and return the URL.
//   3. The client redirects the browser to that URL — Stripe hosts the
//      payment page.
//   4. On success Stripe calls /api/stripe/webhook → marks the pedido as
//      'pagado' and snapshots the rate used.
import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CURRENCY } from "@/lib/stripe";
import { getTasaActual } from "@/lib/tipo-cambio";
import { supabase } from "@/lib/supabase";

interface Body {
  pedidoId:     string;
  totalPyg:     number;                       // total in Guaraní (impreso/digital + envío)
  email?:       string | null;
  nombreNino:   string;
  producto:     string;
  tipoEntrega:  "fisico" | "digital";
  modalidad?:   "pickup" | "delivery" | null;
}

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas:     "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
  semana:      "Plan de la Semana",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { pedidoId, totalPyg, email, nombreNino, producto, tipoEntrega, modalidad } = body;

    if (!pedidoId || !totalPyg || totalPyg <= 0) {
      return NextResponse.json({ ok: false, error: "Datos del pedido incompletos." }, { status: 400 });
    }

    // 1. Get the active exchange rate (Gs. → USD).
    const { tasa } = await getTasaActual();
    if (!tasa || tasa <= 0) {
      return NextResponse.json({ ok: false, error: "Tipo de cambio no configurado." }, { status: 500 });
    }
    const amountInCurrency = totalPyg / tasa;                     // e.g. 149000 / 7300 = 20.41 USD
    const unitAmountMinor  = Math.round(amountInCurrency * 100);  // Stripe expects minor units (cents)

    // 2. Snapshot the rate on the pedido NOW. Even if the customer
    //    bounces before paying, we record what we quoted them.
    await supabase
      .from("pedidos")
      .update({
        tipo_cambio_usado: tasa,
        moneda_pago:       STRIPE_CURRENCY.toUpperCase(),
      })
      .eq("id", pedidoId);

    // 3. Build the Checkout Session.
    const origin = req.headers.get("origin") ?? "https://minirutina.com";
    const nombreProducto = NOMBRE_PRODUCTO[producto] ?? "Tablero personalizado";
    const entregaTxt = tipoEntrega === "digital"
      ? "Versión digital (PDF)"
      : modalidad === "delivery"
      ? "Impreso · Envío a domicilio"
      : "Impreso · Retiro en Villamorra";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency:    STRIPE_CURRENCY,
            unit_amount: unitAmountMinor,
            product_data: {
              name:        `${nombreProducto} — ${nombreNino}`,
              description: `${entregaTxt} · Pedido #${pedidoId.slice(0, 8).toUpperCase()}`,
            },
          },
        },
      ],
      customer_email: email && email.includes("@") ? email : undefined,
      metadata: {
        pedido_id:   pedidoId,
        producto,
        nombre_nino: nombreNino,
        total_pyg:   String(totalPyg),
        tasa_pyg_usd: String(tasa),
      },
      // The customer also sees this on their card statement, alongside
      // the brand statement_descriptor set in Stripe settings.
      payment_intent_data: {
        metadata: { pedido_id: pedidoId },
        description: `Minirutina — ${nombreProducto} para ${nombreNino}`,
      },
      success_url: `${origin}/confirmacion?pedido_id=${pedidoId}&pagado=1&nombre_nino=${encodeURIComponent(nombreNino)}&sid={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/checkout?cancelado=1`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    console.error("[stripe/create-session]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error interno" },
      { status: 500 },
    );
  }
}
