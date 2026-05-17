// Singleton site config fetcher. Used by app/layout.tsx (metadata) and
// the public Header/Footer so logos + meta tags update without a redeploy.
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "@/lib/supabase";

export interface SiteConfig {
  site_name:          string;
  site_description:   string;
  logo_url:           string | null;
  favicon_url:        string | null;
  og_image_url:       string | null;
  support_image_url:  string | null;
  theme_color:        string;
}

const FALLBACK: SiteConfig = {
  site_name:         "Minirutina",
  site_description:  "Tableros personalizados para que los niños construyan hábitos con alegría.",
  logo_url:          null,
  favicon_url:       null,
  og_image_url:      null,
  support_image_url: null,
  theme_color:       "#336aea",
};

export async function getSiteConfig(): Promise<SiteConfig> {
  // Opt out of Next's fetch cache — admin edits should be visible on the
  // next request, not after the next deploy.
  noStore();
  const { data } = await supabase
    .from("site_config")
    .select("site_name, site_description, logo_url, favicon_url, og_image_url, support_image_url, theme_color")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return FALLBACK;
  return {
    site_name:         data.site_name        ?? FALLBACK.site_name,
    site_description:  data.site_description ?? FALLBACK.site_description,
    logo_url:          data.logo_url,
    favicon_url:       data.favicon_url,
    og_image_url:      data.og_image_url,
    support_image_url: data.support_image_url,
    theme_color:       data.theme_color      ?? FALLBACK.theme_color,
  };
}
