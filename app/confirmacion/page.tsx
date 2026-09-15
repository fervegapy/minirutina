import { supabaseAdmin } from "@/lib/supabase-admin";
import MetaPurchase from "@/components/meta/MetaPurchase";
import ConfirmacionView from "./ConfirmacionView";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server wrapper: when the customer lands here after a confirmed payment
// (`pagado=1`), reads the pedido's real total so the Meta Purchase event
// carries the amount actually charged (items − cupón + envío, in Gs.).
// The `fallback=1` path (pedido saved but gateway didn't open) never counts.
export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: { pedido_id?: string; pagado?: string };
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
      <ConfirmacionView />
    </>
  );
}
