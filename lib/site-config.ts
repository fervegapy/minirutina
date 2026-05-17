// Singleton site config fetcher. Used by app/layout.tsx (metadata) and
// the public Header/Footer so logos + meta tags update without a redeploy.
//
// Uses raw fetch with `cache: "no-store"` against Supabase's REST API to
// bypass Next's data cache entirely — admin edits MUST surface on the
// next request, not after the next deploy.
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK;

  try {
    const res = await fetch(
      `${url}/rest/v1/site_config?id=eq.1&select=site_name,site_description,logo_url,favicon_url,og_image_url,support_image_url,theme_color`,
      {
        headers: {
          apikey:        key,
          Authorization: `Bearer ${key}`,
          Accept:        "application/json",
        },
        cache: "no-store", // never cache — needs to be fresh per request
      },
    );
    if (!res.ok) {
      console.warn("[site-config] HTTP", res.status, await res.text().catch(() => ""));
      return FALLBACK;
    }
    const rows = (await res.json()) as Partial<SiteConfig>[];
    const row = rows[0];
    if (!row) {
      console.warn("[site-config] no rows returned — table empty or RLS blocking");
      return FALLBACK;
    }
    return {
      site_name:         row.site_name        || FALLBACK.site_name,
      site_description:  row.site_description || FALLBACK.site_description,
      logo_url:          row.logo_url         ?? null,
      favicon_url:       row.favicon_url      ?? null,
      og_image_url:      row.og_image_url     ?? null,
      support_image_url: row.support_image_url ?? null,
      theme_color:       row.theme_color      || FALLBACK.theme_color,
    };
  } catch {
    return FALLBACK;
  }
}
