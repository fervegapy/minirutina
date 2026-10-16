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
import { createPayment, buildOrderId } from "@/lib/dlocal";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchCupon, evaluarCupon } from "@/lib/cupones";
import { enviarPedidoConfirmado, productoLabel } from "@/lib/emails/pedido-emails";
import { captureServerEvent } from "@/lib/posthog-server";
import { notificarPagoTelegram, telegramConfigurado } from "@/lib/telegram";
import { isMoneda, PAIS_DLOCAL, precioEn, type Moneda, type PreciosProducto } from "@/lib/mercado";
import { leerTasas } from "@/lib/tasas";

// Cuánto puede diferir el precio que vio el cliente (guardado al crear el
// pedido) del recalculado acá. Cubre que la tasa del día cambie entre que
// armó el carrito y pagó, más el redondeo; más que eso se trata como precio
// manipulado y se cobra el recalculado.
const TOLERANCIA_PRECIO = 0.08;

interface Body {
  pedidoId:     string;
  moneda?:      Moneda;              // default PYG
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

// ─── Pedidos de afuera (ARS / BRL / USD) ─────────────────────────────────────
// Solo digital, sin cupones ni envío. El monto no se toma a ciegas del
// cliente: se recalcula desde precios + tipo de cambio del día. Si el que
// quedó guardado al crear el pedido (lo que el cliente vio) está dentro de la
// tolerancia, se respeta ese — así no paga distinto de lo que leyó.
async function crearPagoExterior(
  req: NextRequest,
  body: Body,
  moneda: Exclude<Moneda, "PYG">,
) {
  const { pedidoId, email, nombreNino } = body;
  const [{ data: itemRows }, { data: precioRows }, tasas] = await Promise.all([
    supabaseAdmin
      .from("pedido_items")
      .select("*")
      .eq("pedido_id", pedidoId)
      .order("orden", { ascending: true }),
    supabaseAdmin.from("precios").select("*"),
    leerTasas(supabaseAdmin),
  ]);
  const items = itemRows ?? [];
  if (!pedidoId || items.length === 0) {
    return NextResponse.json({ ok: false, error: "Datos del pedido incompletos." }, { status: 400 });
  }
  const precios = new Map((precioRows ?? []).map((r) => [r.producto as string, r as PreciosProducto]));

  let total = 0;
  for (const it of items) {
    const veinte = it.producto === "recompensas" && (it.personalizacion as { cantidad?: number } | null)?.cantidad === 20;
    const calculado = precioEn(precios.get(it.producto), moneda, "digital", veinte, tasas);
    if (calculado === null) {
      return NextResponse.json(
        { ok: false, error: "Este tablero todavía no está a la venta en tu país." },
        { status: 400 },
      );
    }
    const visto = Number((it as { precio_moneda?: number | null }).precio_moneda);
    const precio = visto > 0 && Math.abs(visto / calculado - 1) <= TOLERANCIA_PRECIO ? visto : calculado;
    total += precio;
    await supabaseAdmin
      .from("pedido_items")
      .update({ precio_moneda: precio, precio_pyg: 0, tipo_entrega: "digital" })
      .eq("id", it.id);
  }
  // ARS y PYG no usan decimales; BRL y USD sí (centavos).
  total = moneda === "ARS" ? Math.round(total) : Math.round(total * 100) / 100;

  const origin = req.headers.get("origin") ?? "https://www.minirutina.com";
  const nroPedido = pedidoId.slice(0, 8).toUpperCase();
  const descripcion = (items.length === 1
    ? `Pedido #${nroPedido} · ${NOMBRE_PRODUCTO[items[0]!.producto] ?? "Tablero"} — ${nombreNino} · Digital (PDF)`
    : `Pedido #${nroPedido} · ${items.length} tableros · Digital (PDF)`).slice(0, 100);

  const payment = await createPayment({
    amount:           total,
    currency:         moneda,
    // USD sin país: el checkout hospedado de dLocal se lo pide al pagador.
    ...(PAIS_DLOCAL[moneda] ? { country: PAIS_DLOCAL[moneda] } : {}),
    order_id:         buildOrderId(pedidoId),
    description:      descripcion,
    success_url:      `${origin}/confirmacion?pedido_id=${pedidoId}&pagado=1&nombre_nino=${encodeURIComponent(nombreNino)}`,
    back_url:         `${origin}/checkout?cancelado=1`,
    notification_url: `${origin}/api/dlocal/webhook`,
    payer: {
      name:  body.nombreComprador?.trim() || undefined,
      email: email && email.includes("@") ? email : undefined,
    },
  });
  if (!payment.redirect_url) {
    return NextResponse.json({ ok: false, error: "dLocal no devolvió URL de pago." }, { status: 502 });
  }

  await supabaseAdmin
    .from("pedidos")
    .update({
      dlocal_payment_id: payment.id,
      metodo_pago:       "dlocal",
      moneda_pago:       moneda,
      moneda_pedido:     moneda,
      tipo_entrega:      "digital",
      direccion:         null,
      costo_envio:       0,
    })
    .eq("id", pedidoId);

  return NextResponse.json({ ok: true, url: payment.redirect_url });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { pedidoId, email, nombreNino, producto, tipoEntrega, modalidad } = body;

    if (isMoneda(body.moneda) && body.moneda !== "PYG") {
      return await crearPagoExterior(req, body, body.moneda);
    }

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

      const { data: itemRows } = await supabaseAdmin
        .from("pedido_items")
        .select("id, producto, nombre_nino, tipo_entrega, precio_pyg")
        .eq("pedido_id", pedidoId)
        .order("orden", { ascending: true });
      const rows = itemRows ?? [];

      // Team Telegram ping — awaited (serverless can freeze right after the
      // response, killing in-flight fetches) and flagged to PostHog on failure
      // so a silent miss is queryable.
      const tgOk = await notificarPagoTelegram({
        pedidoId,
        items: rows.map((it) => ({
          producto:    productoLabel(it.producto),
          nombreNino:  it.nombre_nino,
          tipoEntrega: it.tipo_entrega,
          precioPyg:   Number(it.precio_pyg) || 0,
        })),
        totalPyg: 0,
        metodo:   `Cupón 100% (${cuponAplicado?.codigo ?? "?"})`,
        contacto: email ?? null,
      }).catch(() => false);
      if (telegramConfigurado() && !tgOk) {
        captureServerEvent({
          distinctId: email?.toLowerCase() ?? pedidoId,
          event:      "telegram_notificacion_fallida",
          properties: { pedido_id: pedidoId, origen: "cupon_100" },
        }).catch(() => {});
      }

      // Confirmation email. Unlike the dLocal flow (which attaches the PDF),
      // the 100%-coupon path sends a download BUTTON per digital item so no
      // heavy PDF generation runs inside this request. We AWAIT the send so it
      // can't be cut off when the serverless function returns.
      if (email?.includes("@")) {
        const emailItems = rows.map((it) => ({
          productoLabel: productoLabel(it.producto),
          nombreNino:    it.nombre_nino,
          tipoEntrega:   it.tipo_entrega === "digital" ? "digital" as const : "fisico" as const,
          precioPyg:     Number(it.precio_pyg) || 0,
        }));
        // One download button per digital item.
        const downloadButtons = rows
          .filter((it) => it.tipo_entrega === "digital")
          .map((it) => ({
            label: `Descargar tablero de ${it.nombre_nino}`,
            href:  `${origin}/api/pdf/${it.id}`,
          }));
        // Await + inspect the result. sendEmail RESOLVES with { ok:false } on
        // a Resend error (it doesn't throw), so a plain .catch would miss it.
        // Awaiting also matters on serverless, where the function can freeze
        // right after returning the response.
        const envio = await enviarPedidoConfirmado({
          to:            email,
          nombreCliente: body.nombreComprador ?? null,
          pedidoId,
          items:         emailItems,
          total:         0,
          downloadButtons,
        }).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) }));
        if (!envio.ok) {
          console.error("[create-session] cupón-100 email NO se envió para", pedidoId, ":", envio.error);
          captureServerEvent({
            distinctId: email.toLowerCase(),
            event:      "email_confirmacion_fallido",
            properties: { pedido_id: pedidoId, error: envio.error ?? "unknown", origen: "cupon_100" },
          }).catch(() => {});
        }
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
      order_id:         buildOrderId(pedidoId),  // unique per attempt (retry-safe)
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
