// Idiomas del sitio público. El español vive en la raíz (/, /productos/…) y
// los otros dos con prefijo (/en, /pt). Así el tráfico actual de Meta, que
// entra a "/", no cambia de URL.
//
// Cómo se elige (middleware.ts):
//   - /en/… o /pt/… → ese idioma, y queda guardado en la cookie.
//   - "/" la primera vez → por país (Brasil = pt, países de habla hispana =
//     es) y si no, por el idioma del navegador; si no es español, redirige.
//   - ?idioma=es|en|pt fuerza el idioma (lo usa el selector del footer).
//
// Las páginas se arman por "variante" (idioma + si se vende impreso), que el
// middleware resuelve y reescribe a /v/<variante>/…. Cada variante es una
// página estática distinta, así que todas se siguen sirviendo desde el CDN.
import type { Moneda } from "@/lib/mercado";

export type Locale = "es" | "en" | "pt";
export const LOCALES: Locale[] = ["es", "en", "pt"];

// "_v2": la versión anterior fijaba el idioma también al entrar por /en o
// /pt (incluso por nuestra propia redirección). Con el nombre nuevo, esas
// fijaciones automáticas dejan de contar y solo vale lo elegido a mano.
export const LOCALE_COOKIE = "mr_idioma_v2";

export function isLocale(v: unknown): v is Locale {
  return v === "es" || v === "en" || v === "pt";
}

// Países donde el español es el idioma principal. Un visitante de acá se
// queda en "/" aunque tenga el navegador en inglés.
const PAISES_ES = new Set([
  "PY", "AR", "UY", "BO", "CL", "PE", "EC", "CO", "VE", "MX", "ES", "CR",
  "PA", "GT", "HN", "SV", "NI", "DO", "CU", "PR",
]);

export function localeFromRequest(country: string | null, acceptLanguage: string | null): Locale {
  const c = country?.toUpperCase();
  if (c === "BR" || c === "PT") return "pt";
  if (c && PAISES_ES.has(c)) return "es";
  // Sin país (dev local) o país de otro idioma: el primer idioma del navegador.
  const primero = acceptLanguage?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  if (primero === "pt") return "pt";
  if (primero === "es" || !c) return "es";
  return "en";
}

// ─── Variantes de página ─────────────────────────────────────────────────────
// es-py:   español, Paraguay (impreso + digital, Gs.)
// es-intl: español, fuera de Paraguay (solo digital)
// en, pt:  siempre fuera de Paraguay (solo digital)
export type Variante = "es-py" | "es-intl" | "en" | "pt";
export const VARIANTES: Variante[] = ["es-py", "es-intl", "en", "pt"];

export function isVariante(v: unknown): v is Variante {
  return v === "es-py" || v === "es-intl" || v === "en" || v === "pt";
}

export function varianteDe(locale: Locale, moneda: Moneda): Variante {
  if (locale !== "es") return locale;
  return moneda === "PYG" ? "es-py" : "es-intl";
}

export function localeDeVariante(v: Variante): Locale {
  return v === "en" ? "en" : v === "pt" ? "pt" : "es";
}

/** La variante muestra el tablero impreso (papel, envío, 48 hs). */
export function varianteImpresa(v: Variante): boolean {
  return v === "es-py";
}

/** Prefijo de URL pública del idioma: "" para español, "/en", "/pt". */
export function prefijo(locale: Locale): string {
  return locale === "es" ? "" : `/${locale}`;
}

export const HTML_LANG: Record<Locale, string> = {
  es: "es",
  en: "en",
  pt: "pt-BR",
};
