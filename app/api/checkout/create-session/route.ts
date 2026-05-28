// Creates a dLocal Go payment for an existing pedido in Supabase and
// returns the hosted-checkout redirect URL.
//
// dLocal Go charges in PYG natively, so there is NO currency conversion —
// the customer pays the exact Guaraní amount shown in the checkout.
//
// Flow:
//   1. /checkout inserts the pedido (status 'pendiente') then POSTs the
//      pedido_id + amounts here.
//   2. We create a dLocal payment (amount = producto + envío in PYG) and
//      return redirect_url.
//   3. Client redirects the browser there.
//   4. dLocal POSTs to /api/dlocal/webhook on status change → we mark the
//      pedido as 'pagado'.
import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/dlocal";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface Body {
  pedidoId:     string;
  productoPyg:  number;
  envioPyg?:    number;
  totalPyg?:    number;            // legacy fallback
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
    const { pedidoId, email, nombreNino, producto, tipoEntrega, modalidad } = body;

    const productoPyg = Number.isFinite(body.productoPyg)
      ? body.productoPyg
      : Number(body.totalPyg ?? 0);
    const envioPyg = Number.isFinite(body.envioPyg) ? Number(body.envioPyg) : 0;
    const totalPyg = Math.round(productoPyg + envioPyg);

    if (!pedidoId || totalPyg <= 0) {
      return NextResponse.json({ ok: false, error: "Datos del pedido incompletos." }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "https://www.minirutina.com";
    const nombreProducto = NOMBRE_PRODUCTO[producto] ?? "Tablero personalizado";
    const entregaTxt = tipoEntrega === "digital"
      ? "Digital (PDF)"
      : modalidad === "delivery"
      ? "Impreso + envío"
      : "Impreso (retiro)";

    // Short, human-readable order number (same one shown across the app /
    // emails as #XXXXXXXX). Goes both in the order_id and the visible
    // description so it's trackable from dLocal's dashboard and on the
    // payment page. The webhook still looks the pedido up by order_id.
    const nroPedido = pedidoId.slice(0, 8).toUpperCase();
    const descripcion =
      `Pedido #${nroPedido} · ${nombreProducto} — ${nombreNino} · ${entregaTxt}`.slice(0, 100);

    const payment = await createPayment({
      amount:           totalPyg,        // PYG, integer — no decimals
      currency:         "PYG",
      country:          "PY",
      order_id:         pedidoId,
      description:      descripcion,
      success_url:      `${origin}/confirmacion?pedido_id=${pedidoId}&pagado=1&nombre_nino=${encodeURIComponent(nombreNino)}`,
      back_url:         `${origin}/checkout?cancelado=1`,
      notification_url: `${origin}/api/dlocal/webhook`,
      payer: {
        name:  nombreNino ? `Pedido ${nombreNino}` : undefined,
        email: email && email.includes("@") ? email : undefined,
      },
    });

    if (!payment.redirect_url) {
      return NextResponse.json(
        { ok: false, error: "dLocal no devolvió URL de pago." },
        { status: 502 },
      );
    }

    // Snapshot the dLocal payment id + method on the pedido.
    await supabaseAdmin
      .from("pedidos")
      .update({
        dlocal_payment_id: payment.id,
        metodo_pago:       "dlocal",
        moneda_pago:       "PYG",
      })
      .eq("id", pedidoId);

    return NextResponse.json({ ok: true, url: payment.redirect_url });
  } catch (e) {
    console.error("[dlocal/create-session]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error interno" },
      { status: 500 },
    );
  }
}
