// Embedded SmartFields charge. Receives a card token tokenized client-side
// by dlocal.js and attempts a direct charge against dLocal Go.
//
// Outcomes returned to the client:
//   { ok: true, status: "PAID" }              → payment captured, go to /confirmacion
//   { ok: true, status: "PENDING", redirectUrl } → 3DS required, send browser there
//   { ok: false, error }                        → rejected / failed, stay on checkout
import { NextRequest, NextResponse } from "next/server";
import { createPaymentWithToken } from "@/lib/dlocal";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface Body {
  pedidoId:     string;
  token:        string;
  productoPyg:  number;
  envioPyg?:    number;
  email?:       string | null;
  nombre?:      string | null;
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
    const { pedidoId, token, email, nombre, nombreNino, producto, tipoEntrega, modalidad } = body;

    if (!pedidoId || !token) {
      return NextResponse.json({ ok: false, error: "Faltan datos del pago." }, { status: 400 });
    }

    const productoPyg = Number(body.productoPyg) || 0;
    const envioPyg    = Number(body.envioPyg) || 0;
    const totalPyg    = Math.round(productoPyg + envioPyg);
    if (totalPyg <= 0) {
      return NextResponse.json({ ok: false, error: "Monto inválido." }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "https://www.minirutina.com";
    const nombreProducto = NOMBRE_PRODUCTO[producto] ?? "Tablero personalizado";
    const entregaTxt = tipoEntrega === "digital"
      ? "Digital (PDF)"
      : modalidad === "delivery" ? "Impreso + envío" : "Impreso (retiro)";
    const nroPedido = pedidoId.slice(0, 8).toUpperCase();
    const descripcion =
      `Pedido #${nroPedido} · ${nombreProducto} — ${nombreNino} · ${entregaTxt}`.slice(0, 100);

    const payment = await createPaymentWithToken({
      amount:           totalPyg,
      currency:         "PYG",
      country:          "PY",
      order_id:         pedidoId,
      description:      descripcion,
      token,
      notification_url: `${origin}/api/dlocal/webhook`,
      success_url:      `${origin}/confirmacion?pedido_id=${pedidoId}&pagado=1&nombre_nino=${encodeURIComponent(nombreNino)}`,
      back_url:         `${origin}/checkout?cancelado=1`,
      payer: {
        name:  nombre || (nombreNino ? `Pedido ${nombreNino}` : undefined),
        email: email && email.includes("@") ? email : undefined,
      },
    });

    // Always snapshot the dLocal id + method.
    await supabaseAdmin
      .from("pedidos")
      .update({
        dlocal_payment_id: payment.id,
        metodo_pago:       "dlocal",
        moneda_pago:       "PYG",
      })
      .eq("id", pedidoId);

    // 3-D Secure: dLocal wants the buyer to authenticate on their page.
    if (payment.status === "PENDING" && payment.redirect_url) {
      return NextResponse.json({ ok: true, status: "PENDING", redirectUrl: payment.redirect_url });
    }

    if (payment.status === "PAID") {
      // The webhook will also fire and is the source of truth (marks the
      // pedido 'pagado' + sends emails). We optimistically report success
      // so the client can move to /confirmacion immediately.
      return NextResponse.json({ ok: true, status: "PAID" });
    }

    // REJECTED / CANCELLED / EXPIRED / unexpected
    return NextResponse.json(
      { ok: false, error: `El pago no pudo procesarse (estado: ${payment.status}).` },
      { status: 402 },
    );
  } catch (e) {
    console.error("[dlocal/pay-with-token]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error procesando el pago." },
      { status: 500 },
    );
  }
}
