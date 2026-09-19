// Atribución de ventas: de dónde vino la persona que compró.
//
// PostHog no sirve solo para esto por dos motivos: no se carga en la landing
// (ver PostHogProvider), así que los UTMs de quien entra por la home desde un
// anuncio se pierden al navegar al customizer; y `pago_completado` sale del
// webhook, sin sesión de navegador a la que atarse.
//
// Entonces lo capturamos nosotros: <AtribucionScript /> corre inline en cada
// carga de página, guarda el primer y el último contacto en localStorage, el
// checkout lo guarda en `pedidos.atribucion` y el webhook lo adjunta a
// `pago_completado`. Este módulo no depende del navegador salvo
// leerAtribucion(), así que el webhook y el admin lo importan sin problema.

export const ATRIBUCION_KEY = "mr_atribucion";

/** Un contacto: cómo llegó la persona en una visita puntual. */
export interface Toque {
  utm_source?:   string;
  utm_medium?:   string;
  utm_campaign?: string;
  utm_content?:  string;
  utm_term?:     string;
  fbclid?:       string;
  gclid?:        string;
  /** Dominio externo de referencia, sin www. Ausente si fue directo. */
  referrer?:     string;
  /** Página en la que aterrizó (pathname). */
  landing:       string;
  ts:            string;
}

export interface Atribucion {
  /** Primera visita registrada en este navegador, aunque haya sido directa. */
  primero: Toque | null;
  /** Última visita que trajo origen (UTM o referrer externo). Las visitas
   *  directas no lo pisan: quien vuelve tecleando la URL después de ver un
   *  anuncio sigue atribuido al anuncio. */
  ultimo:  Toque | null;
  /** Sesión de PostHog en la que se hizo el pedido, para ligar la venta. */
  posthog_session_id?: string | null;
}

const META_SOURCES = ["ig", "fb", "an", "th", "msg", "instagram", "facebook", "meta"];

/** Traduce un contacto a un canal legible para el tablero y el admin. */
export function canalDe(t: Toque | null | undefined): string {
  if (!t) return "Sin datos";
  const src = (t.utm_source ?? "").toLowerCase();
  const med = (t.utm_medium ?? "").toLowerCase();
  const ref = (t.referrer ?? "").toLowerCase();

  // Los anuncios de Meta llegan con utm_campaign (el ID de campaña) y un
  // source de ubicación: ig, fb, an (Audience Network), th (Threads).
  if (t.utm_campaign && (META_SOURCES.includes(src) || t.fbclid)) return "Meta Ads";
  if (t.gclid || (src === "google" && ["cpc", "ppc", "paid"].includes(med))) return "Google Ads";
  // El link de la bio también trae fbclid, pero sin campaña.
  if (META_SOURCES.includes(src) || t.fbclid || /instagram|facebook|threads/.test(ref)) {
    return "Instagram/Facebook orgánico";
  }
  if (/(^|\.)google\./.test(ref) || src === "google") return "Google orgánico";
  if (/chatgpt|openai|perplexity|gemini|claude/.test(`${ref} ${src}`)) return "IA (ChatGPT, etc.)";
  if (/whatsapp|wa\.me/.test(`${ref} ${src}`)) return "WhatsApp";
  if (src) return src;
  if (ref) return ref;
  return "Directo";
}

/** Lee la atribución guardada. Solo en el navegador; si no hay, nulls. */
export function leerAtribucion(): Atribucion {
  const vacia: Atribucion = { primero: null, ultimo: null };
  if (typeof window === "undefined") return vacia;
  try {
    const guardada = JSON.parse(window.localStorage.getItem(ATRIBUCION_KEY) ?? "null");
    if (!guardada || typeof guardada !== "object") return vacia;
    return { primero: guardada.primero ?? null, ultimo: guardada.ultimo ?? null };
  } catch {
    return vacia; // localStorage bloqueado (modo privado, etc.)
  }
}

/**
 * Propiedades planas para PostHog: `canal` y los UTMs del último contacto
 * (la visita que terminó en compra) y del primero (cómo conoció la marca).
 */
export function propiedadesDeAtribucion(a: Atribucion | null | undefined): Record<string, unknown> {
  if (!a) return { canal: "Sin datos", primer_canal: "Sin datos" };
  // Sin último contacto (solo visitas directas), la venta es del primero.
  const u = a.ultimo ?? a.primero;
  const p = a.primero;
  return {
    canal:                   canalDe(u),
    utm_source:              u?.utm_source ?? null,
    utm_medium:              u?.utm_medium ?? null,
    utm_campaign:            u?.utm_campaign ?? null,
    utm_content:             u?.utm_content ?? null,
    referring_domain:        u?.referrer ?? null,
    landing_page:            u?.landing ?? null,
    primer_canal:            canalDe(p),
    primer_utm_source:       p?.utm_source ?? null,
    primer_utm_campaign:     p?.utm_campaign ?? null,
    primer_referring_domain: p?.referrer ?? null,
    // PostHog liga el evento a la grabación y a la sesión con esta clave.
    ...(a.posthog_session_id ? { $session_id: a.posthog_session_id } : {}),
  };
}
