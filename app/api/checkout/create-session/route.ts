// Creates a Stripe Checkout Session for an existing pedido in Supabase.
//
// Sends the producto and the envío as SEPARATE values:
//   - Producto goes as a line_item (price_data)
//   - Envío goes as a shipping_option (Stripe shows it as a discrete row)
// That way the customer sees "Tablero X — USD A.AB" + "Envío — USD C.DE"
// instead of a single opaque total.
import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CURRENCY } from "@/lib/stripe";
import { getTasaActual } from "@/lib/tipo-cambio";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface Body {
  pedidoId:     string;
  /** Producto price in Guaraní (before shipping). */
  productoPyg:  number;
  /** Shipping price in Guaraní. 0 for pickup / digital. */
  envioPyg?:    number;
  /** Legacy field — older clients send a single total. */
  totalPyg?:    number;
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
    const {
      pedidoId,
      email,
      nombreNino,
      producto,
      tipoEntrega,
      modalidad,
    } = body;

    // Backwards-compat: clients can send productoPyg+envioPyg OR totalPyg.
    const productoPyg = Number.isFinite(body.productoPyg)
      ? body.productoPyg
      : Number(body.totalPyg ?? 0);
    const envioPyg = Number.isFinite(body.envioPyg) ? Number(body.envioPyg) : 0;

    if (!pedidoId || !productoPyg || productoPyg <= 0) {
      return NextResponse.json({ ok: false, error: "Datos del pedido incompletos." }, { status: 400 });
    }

    const { tasa } = await getTasaActual();
    if (!tasa || tasa <= 0) {
      return NextResponse.json({ ok: false, error: "Tipo de cambio no configurado." }, { status: 500 });
    }

    const productoMinor = Math.round((productoPyg / tasa) * 100);
    const envioMinor    = Math.round((envioPyg    / tasa) * 100);

    // Snapshot the rate on the pedido NOW.
    await supabaseAdmin
      .from("pedidos")
      .update({
        tipo_cambio_usado: tasa,
        moneda_pago:       STRIPE_CURRENCY.toUpperCase(),
      })
      .eq("id", pedidoId);

    const origin = req.headers.get("origin") ?? "https://minirutina.com";
    const nombreProducto = NOMBRE_PRODUCTO[producto] ?? "Tablero personalizado";
    const entregaTxt = tipoEntrega === "digital"
      ? "Versión digital (PDF)"
      : modalidad === "delivery"
      ? "Impreso · Envío a domicilio"
      : "Impreso · Retiro en Villamorra";

    // Only include shipping_options when there's an envío amount > 0.
    // Stripe shows the shipping line on the hosted page + receipt.
    const shippingOptions = envioMinor > 0
      ? [{
          shipping_rate_data: {
            type: "fixed_amount" as const,
            fixed_amount: {
              amount:   envioMinor,
              currency: STRIPE_CURRENCY,
            },
            display_name: "Envío",
          },
        }]
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency:    STRIPE_CURRENCY,
            unit_amount: productoMinor,
            product_data: {
              name:        `${nombreProducto} — ${nombreNino}`,
              description: `${entregaTxt} · Pedido #${pedidoId.slice(0, 8).toUpperCase()}`,
            },
          },
        },
      ],
      shipping_options: shippingOptions,
      customer_email: email && email.includes("@") ? email : undefined,
      metadata: {
        pedido_id:     pedidoId,
        producto,
        nombre_nino:   nombreNino,
        producto_pyg:  String(productoPyg),
        envio_pyg:     String(envioPyg),
        total_pyg:     String(productoPyg + envioPyg),
        tasa_pyg_usd:  String(tasa),
      },
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
