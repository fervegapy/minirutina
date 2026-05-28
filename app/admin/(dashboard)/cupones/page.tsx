import { createSupabaseServerClient } from "@/lib/supabase-server";
import CuponesView, { type Cupon, type CuponUso } from "@/components/admin/CuponesView";

export const dynamic = "force-dynamic";

export default async function CuponesPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: cupones }, { data: usos }] = await Promise.all([
    supabase.from("cupones").select("*").order("created_at", { ascending: false }),
    supabase.from("cupon_usos").select("*").order("created_at", { ascending: false }).limit(500),
  ]);

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Cupones
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Códigos de descuento para el checkout. El descuento se aplica sobre
          el precio del producto (el envío no se descuenta). Monitoreá los usos
          para campañas con creadores o referenciadores.
        </p>
      </header>
      <CuponesView
        cupones={(cupones ?? []) as Cupon[]}
        usos={(usos ?? []) as CuponUso[]}
      />
    </div>
  );
}
