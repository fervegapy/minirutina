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
import { fetchCupon, evaluarCupon } from "@/lib/cupones";
import { enviarPedidoConfirmado, productoLabel } from "@/lib/emails/pedido-emails";

interface Body {
  pedidoId:     string;
  productoPyg:  number;
  envioPyg?:    number;
  cuponCodigo?:     string | null;
  totalPyg?:        number;            // legacy fallback
  email?:           string | null;
  nombreComprador?: string | null;
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

    // Re-validate coupon server-side against the product subtotal.
    let descuento = 0;
    let cuponAplicado: { id: string; codigo: string } | null = null;
    if (body.cuponCodigo) {
      const cupon = await fetchCupon(body.cuponCodigo);
      if (cupon) {
        const ev = evaluarCupon(cupon, productoPyg);
        if (ev.ok) { descuento = ev.descuento; cuponAplicado = { id: cupon.id, codigo: cupon.codigo }; }
      }
    }

    const totalPyg = Math.round(Math.max(0, productoPyg - descuento) + envioPyg);

    if (!pedidoId || (totalPyg <= 0 && descuento === 0)) {
      return NextResponse.json({ ok: false, error: "Datos del pedido incompletos." }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "https://www.minirutina.com";

    // ─── Cupón 100 % — bypass dLocal ─────────────────────────────────────────
    // dLocal rejects payments under ~1 USD. When a coupon covers the full
    // amount, we mark the pedido as pagado directly and skip the payment flow.
    if (totalPyg === 0) {
      await supabaseAdmin.from("pedidos").update({
        estado:          "pagado",
        metodo_pago:     "cupon_100",
        cupon_codigo:    cuponAplicado?.codigo ?? null,
        cupon_descuento: descuento > 0 ? descuento : null,
      }).eq("id", pedidoId);

      if (cuponAplicado && descuento > 0) {
        await supabaseAdmin.from("cupon_usos").insert({
          cupon_id:        cuponAplicado.id,
          codigo:          cuponAplicado.codigo,
          pedido_id:       pedidoId,
          email:           email ?? null,
          monto_original:  Math.round(productoPyg + envioPyg),
          monto_descuento: descuento,
          monto_final:     0,
        });
        const { data: cuRow } = await supabaseAdmin
          .from("cupones").select("usos").eq("id", cuponAplicado.id).maybeSingle();
        await supabaseAdmin.from("cupones")
          .update({ usos: (cuRow?.usos ?? 0) + 1 }).eq("id", cuponAplicado.id);
      }

      // Send confirmation email fire-and-forget
      if (email?.includes("@")) {
        const { data: itemRows } = await supabaseAdmin
          .from("pedido_items")
          .select("producto, nombre_nino, tipo_entrega, precio_pyg")
          .eq("pedido_id", pedidoId);
        const emailItems = (itemRows ?? []).map((it) => ({
          productoLabel: productoLabel(it.producto),
          nombreNino:    it.nombre_nino,
          tipoEntrega:   it.tipo_entrega === "digital" ? "digital" as const : "fisico" as const,
          precioPyg:     Number(it.precio_pyg) || 0,
        }));
        enviarPedidoConfirmado({
          to:            email,
          nombreCliente: body.nombreComprador ?? null,
          pedidoId,
          items:         emailItems,
          total:         0,
        }).catch(() => {});
      }

      const confirmUrl = `${origin}/confirmacion?pedido_id=${pedidoId}&pagado=1&nombre_nino=${encodeURIComponent(nombreNino)}`;
      return NextResponse.json({ ok: true, url: confirmUrl });
    }
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
        name:  body.nombreComprador?.trim() || (nombreNino ? `Pedido ${nombreNino}` : undefined),
        email: email && email.includes("@") ? email : undefined,
      },
    });

    if (!payment.redirect_url) {
      return NextResponse.json(
        { ok: false, error: "dLocal no devolvió URL de pago." },
        { status: 502 },
      );
    }

    // Snapshot the dLocal payment id + method + coupon on the pedido.
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

    // Record coupon usage now (redirect flow — the customer is committing
    // to pay). The webhook marks the pedido 'pagado' on success.
    if (cuponAplicado && descuento > 0) {
      await supabaseAdmin.from("cupon_usos").insert({
        cupon_id:        cuponAplicado.id,
        codigo:          cuponAplicado.codigo,
        pedido_id:       pedidoId,
        email:           email ?? null,
        monto_original:  Math.round(productoPyg + envioPyg),
        monto_descuento: descuento,
        monto_final:     totalPyg,
      });
      const { data: cuRow } = await supabaseAdmin
        .from("cupones").select("usos").eq("id", cuponAplicado.id).maybeSingle();
      await supabaseAdmin.from("cupones")
        .update({ usos: (cuRow?.usos ?? 0) + 1 }).eq("id", cuponAplicado.id);
    }

    return NextResponse.json({ ok: true, url: payment.redirect_url });
  } catch (e) {
    console.error("[dlocal/create-session]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error interno" },
      { status: 500 },
    );
  }
}
