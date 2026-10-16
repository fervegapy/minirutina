import { supabaseAdmin } from "@/lib/supabase-admin";
import MetaPurchase from "@/components/meta/MetaPurchase";
import ConfirmacionView from "./ConfirmacionView";
import { getMoneda, vendeImpreso } from "@/lib/mercado";
import type { Locale } from "@/lib/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server wrapper: when the customer lands here after a confirmed payment
// (`pagado=1`), reads the pedido's real total so the Meta Purchase event
// carries the amount actually charged (items − cupón + envío, in Gs.).
// The `fallback=1` path (pedido saved but gateway didn't open) never counts.
// Lo renderizan app/confirmacion/page.tsx (español) y
// app/[locale]/confirmacion/page.tsx (inglés y portugués).
export default async function ConfirmacionPage({
  searchParams,
  idioma = "es",
}: {
  searchParams: { pedido_id?: string; pagado?: string };
  idioma?: Locale;
}) {
  const pedidoId = searchParams.pedido_id;
  let purchase: { pedidoId: string; value: number; productos: string[] } | null = null;

  if (searchParams.pagado === "1" && pedidoId && UUID_RE.test(pedidoId)) {
    const [{ data: pedido }, { data: items }] = await Promise.all([
      supabaseAdmin
        .from("pedidos")
        .select("id, costo_envio, cupon_descuento")
        .eq("id", pedidoId)
        .maybeSingle(),
      supabaseAdmin
        .from("pedido_items")
        .select("producto, precio_pyg")
        .eq("pedido_id", pedidoId),
    ]);

    if (pedido && items && items.length > 0) {
      const subtotal = items.reduce((acc, it) => acc + (it.precio_pyg ?? 0), 0);
      const value = Math.max(0, subtotal - (pedido.cupon_descuento ?? 0) + (pedido.costo_envio ?? 0));
      purchase = { pedidoId: pedido.id, value, productos: items.map((it) => it.producto) };
    }
  }

  return (
    <>
      {purchase && <MetaPurchase {...purchase} />}
      {/* Fuera de Paraguay es todo digital: llega por email, no "se envía". */}
      <ConfirmacionView idioma={idioma} soloDigital={!vendeImpreso(await getMoneda())} />
    </>
  );
}
