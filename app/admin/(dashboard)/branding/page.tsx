import { createSupabaseServerClient } from "@/lib/supabase-server";
import BrandingView, { type SiteConfigRow } from "@/components/admin/BrandingView";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("site_config")
    .select(
      "site_name, site_description, logo_url, favicon_url, og_image_url, support_image_url, theme_color",
    )
    .eq("id", 1)
    .maybeSingle();

  const initial: SiteConfigRow = data
    ? (data as SiteConfigRow)
    : {
        site_name:         "Minirutina",
        site_description:
          "Tableros personalizados para que los niños construyan hábitos con alegría.",
        logo_url:          null,
        favicon_url:       null,
        og_image_url:      null,
        support_image_url: null,
        theme_color:       "#336aea",
      };

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Branding
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Logo, favicon, metadatos y otras imágenes del sitio.
        </p>
      </header>
      <BrandingView initial={initial} />
    </div>
  );
}
