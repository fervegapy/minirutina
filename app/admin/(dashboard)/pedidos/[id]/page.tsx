import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Pedido } from "@/types/pedido";
import PedidoDetail from "@/components/admin/PedidoDetail";

export const dynamic = "force-dynamic";

export default async function PedidoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();
  const pedido = data as Pedido;

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Pedidos
      </Link>
      <PedidoDetail pedido={pedido} />
    </div>
  );
}
