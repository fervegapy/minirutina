// Singleton site config fetcher. Used by app/layout.tsx (metadata) y
// el Header/Footer público, así logos + meta tags cambian sin redeploy.
//
// El resultado se cachea bajo el tag "site-config" en vez de consultar
// Supabase en cada request: la landing lo pedía 4 veces por render
// (metadata, viewport, Header, Footer) y cada una era un viaje de red a
// São Paulo antes de mandar el primer byte de HTML. Las acciones de
// /admin/branding llaman revalidateTag("site-config") al guardar, así que
// los cambios del admin siguen saliendo en el request siguiente.
import { unstable_cache } from "next/cache";

export const SITE_CONFIG_TAG = "site-config";

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

async function fetchSiteConfig(): Promise<SiteConfig> {
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

// El `revalidate` no es para propagar cambios (de eso se encarga el tag) sino
// de red de seguridad: si Supabase falla, fetchSiteConfig devuelve el FALLBACK
// y sin techo de tiempo esa respuesta degradada quedaría cacheada para siempre.
export const getSiteConfig = unstable_cache(fetchSiteConfig, ["site-config"], {
  tags: [SITE_CONFIG_TAG],
  revalidate: 300,
});
