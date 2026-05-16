// Sales dashboard. Pulls pedidos + precios server-side and hands them to
// the client view, which computes the metrics (so the user can switch
// time ranges without refetching).
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Pedido } from "@/types/pedido";
import { indexPrecios, type PrecioRow } from "@/lib/precios";
import VentasView from "@/components/admin/VentasView";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const supabase = createSupabaseServerClient();

  const [pedidosRes, preciosRes] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("precios")
      .select("producto, precio_impreso, precio_digital"),
  ]);

  const pedidos = (pedidosRes.data as Pedido[] | null) ?? [];
  const precios = indexPrecios(preciosRes.data as PrecioRow[] | null);

  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Ventas
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Ingresos, ticket promedio y desglose por producto / entrega.
        </p>
      </header>
      <VentasView pedidos={pedidos} precios={precios} />
    </div>
  );
}
