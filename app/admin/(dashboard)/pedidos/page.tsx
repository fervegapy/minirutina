import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Pedido } from "@/types/pedido";
import PedidosList from "@/components/admin/PedidosList";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  const pedidos = (data as Pedido[] | null) ?? [];

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Pedidos
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
            {error && <span className="text-red-500"> · error al cargar</span>}
          </p>
        </div>
      </header>
      <PedidosList pedidos={pedidos} />
    </div>
  );
}
