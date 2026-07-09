// Embedded SmartFields charge. Receives a card token tokenized client-side
// by dlocal.js and attempts a direct charge against dLocal Go.
//
// Outcomes returned to the client:
//   { ok: true, status: "PAID" }              → payment captured, go to /confirmacion
//   { ok: true, status: "PENDING", redirectUrl } → 3DS required, send browser there
//   { ok: false, error }                        → rejected / failed, stay on checkout
import { NextRequest, NextResponse } from "next/server";
import { createPaymentWithToken, buildOrderId } from "@/lib/dlocal";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchCupon, evaluarCupon } from "@/lib/cupones";

interface Body {
  pedidoId:     string;
  token:        string;
  productoPyg:  number;
  envioPyg?:    number;
  cuponCodigo?: string | null;
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

    // Re-validate the coupon server-side against the PRODUCT subtotal —
    // never trust a discount computed on the client.
    let descuento = 0;
    let cuponAplicado: { id: string; codigo: string } | null = null;
    if (body.cuponCodigo) {
      const cupon = await fetchCupon(body.cuponCodigo);
      if (cupon) {
        const ev = evaluarCupon(cupon, productoPyg);
        if (ev.ok) {
          descuento = ev.descuento;
          cuponAplicado = { id: cupon.id, codigo: cupon.codigo };
        }
        // If invalid (expired / maxed out), we silently ignore it and
        // charge full price rather than block the sale.
      }
    }

    const productoConDescuento = Math.max(0, productoPyg - descuento);
    const totalPyg = Math.round(productoConDescuento + envioPyg);
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
      order_id:         buildOrderId(pedidoId),  // unique per attempt (retry-safe)
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

    // Always snapshot the dLocal id + method + coupon.
    await supabaseAdmin
      .from("pedidos")
      .update({
        dlocal_payment_id: payment.id,
        metodo_pago:       "dlocal",
        moneda_pago:       "PYG",
        cupon_codigo:      cuponAplicado?.codigo ?? null,
        cupon_descuento:   descuento > 0 ? descuento : null,
      })
      .eq("id", pedidoId);

    // Record the coupon usage + bump the counter only on a captured payment
    // (PAID). For 3DS (PENDING) we wait — the webhook would be the right
    // place to record it, but to keep this simple we record on PAID here
    // and on the optimistic success path.
    const registrarUsoCupon = async () => {
      if (!cuponAplicado || descuento <= 0) return;
      await supabaseAdmin.from("cupon_usos").insert({
        cupon_id:        cuponAplicado.id,
        codigo:          cuponAplicado.codigo,
        pedido_id:       pedidoId,
        email:           email ?? null,
        monto_original:  Math.round(productoPyg + envioPyg),
        monto_descuento: descuento,
        monto_final:     totalPyg,
      });
      // Bump the usage counter (read-modify-write — fine at this volume).
      const { data } = await supabaseAdmin
        .from("cupones").select("usos").eq("id", cuponAplicado.id).maybeSingle();
      await supabaseAdmin
        .from("cupones")
        .update({ usos: (data?.usos ?? 0) + 1 })
        .eq("id", cuponAplicado.id);
    };

    // 3-D Secure: dLocal wants the buyer to authenticate on their page.
    if (payment.status === "PENDING" && payment.redirect_url) {
      return NextResponse.json({ ok: true, status: "PENDING", redirectUrl: payment.redirect_url });
    }

    if (payment.status === "PAID") {
      // The webhook will also fire and is the source of truth (marks the
      // pedido 'pagado' + sends emails). We optimistically report success
      // so the client can move to /confirmacion immediately.
      await registrarUsoCupon();
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
