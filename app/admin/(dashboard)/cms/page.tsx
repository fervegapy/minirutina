// CMS dashboard — pulls everything in parallel and hands it off to the
// client view. The view uses server actions for mutations.
import { createSupabaseServerClient } from "@/lib/supabase-server";
import CmsView, {
  type CmsData,
  type Faq,
  type Testimonio,
  type PrecioRow,
  type ProductoConfigRow,
} from "@/components/admin/CmsView";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  const supabase = createSupabaseServerClient();

  const [preciosRes, configRes, faqsRes, testimoniosRes] = await Promise.all([
    supabase.from("precios").select("producto, precio_impreso, precio_digital"),
    supabase.from("productos_config").select("producto, activo, nombre, tagline"),
    supabase.from("faqs").select("*").order("producto").order("orden"),
    supabase.from("testimonios").select("*").order("orden"),
  ]);

  const data: CmsData = {
    precios:     (preciosRes.data as PrecioRow[] | null)        ?? [],
    config:      (configRes.data  as ProductoConfigRow[] | null) ?? [],
    faqs:        (faqsRes.data    as Faq[] | null)              ?? [],
    testimonios: (testimoniosRes.data as Testimonio[] | null)   ?? [],
  };

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Contenido
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Precios, FAQs, testimonios y pausa de productos.
        </p>
      </header>
      <CmsView data={data} />
    </div>
  );
}
