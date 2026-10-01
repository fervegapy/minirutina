import { createSupabaseServerClient } from "@/lib/supabase-server";
import KanbanView from "@/components/admin/KanbanView";
import type { Pieza } from "@/lib/contenido";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contenido_kanban")
    .select("*")
    .order("orden", { ascending: true });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Kanban de contenido
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          De la idea a la publicación. Arrastrá las tarjetas entre columnas, o tocá
          una para editar contenido, caption, inspo y fecha (en el celular, cambiá el
          estado desde el selector de la tarjeta).
        </p>
      </header>
      {error ? (
        <p className="text-sm text-red-600">
          No se pudo cargar el kanban: {error.message}. ¿Corriste{" "}
          <code>supabase/kanban_contenido.sql</code>?
        </p>
      ) : (
        <KanbanView piezas={(data ?? []) as Pieza[]} />
      )}
    </div>
  );
}
