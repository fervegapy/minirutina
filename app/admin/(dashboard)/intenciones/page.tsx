// Funnel + abandoned-session view.
//
// We pull every event in the window, dedupe by session_id per event, and
// compute counts client-side. At MVP scale this is fine; if the table
// grows large we can move the aggregation to SQL views/RPCs.
import { createSupabaseServerClient } from "@/lib/supabase-server";
import IntencionesView from "@/components/admin/IntencionesView";

export const dynamic = "force-dynamic";

export interface EventoRow {
  id:         string;
  created_at: string;
  session_id: string;
  evento:     string;
  producto:   string | null;
  paso:       string | null;
  data:       Record<string, unknown> | null;
  pedido_id:  string | null;
}

export default async function IntencionesPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = (searchParams.range ?? "30d") as "7d" | "30d" | "all";
  const supabase = createSupabaseServerClient();

  // Time window
  let query = supabase
    .from("eventos_sesion")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (range !== "all") {
    const days = range === "7d" ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  const eventos = (data as EventoRow[] | null) ?? [];

  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Intenciones de compra
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Funnel y sesiones abandonadas
          {error && <span className="text-red-500"> · error al cargar</span>}
        </p>
      </header>
      <IntencionesView eventos={eventos} range={range} />
    </div>
  );
}
