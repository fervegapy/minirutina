// Piezas compartidas por el selector de país/idioma y el aviso de país: lo
// que se lee de las cookies que pone el middleware y cómo se arma la URL para
// cambiar de mercado. Solo cliente.
import { prefijo, type Locale } from "@/lib/i18n";
import { formatPrecio, monedaFromCountryCode, type Moneda } from "@/lib/mercado";

export function leerCookie(nombre: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

// Los tres mercados con precio propio y "otro país" (USD). El código de
// "otro" es US solo para fijar la moneda; no se muestra.
export type CodigoMercado = "PY" | "AR" | "BR" | "OTRO";

export const MERCADOS: { codigo: CodigoMercado; bandera: string; nombre: Record<Locale, string> }[] = [
  { codigo: "PY",   bandera: "🇵🇾", nombre: { es: "Paraguay",  en: "Paraguay",      pt: "Paraguai" } },
  { codigo: "AR",   bandera: "🇦🇷", nombre: { es: "Argentina", en: "Argentina",     pt: "Argentina" } },
  { codigo: "BR",   bandera: "🇧🇷", nombre: { es: "Brasil",    en: "Brazil",        pt: "Brasil" } },
  { codigo: "OTRO", bandera: "🌎", nombre: { es: "Otro país", en: "Other country", pt: "Outro país" } },
];

export function mercadoDePais(pais: string | null | undefined): CodigoMercado {
  const p = pais?.toUpperCase();
  return p === "PY" || p === "AR" || p === "BR" ? p : p ? "OTRO" : "PY";
}

export function monedaDeMercado(m: CodigoMercado): Moneda {
  return monedaFromCountryCode(m === "OTRO" ? "US" : m);
}

/** "Gs.", "$", "R$", "US$": el símbolo tal como sale en los precios. */
export function simboloMoneda(m: Moneda): string {
  return formatPrecio(0, m).split(" ")[0]!;
}

/** Ruta actual sin el prefijo de idioma (/pt/checkout → /checkout). */
export function rutaSinIdioma(pathname: string): string {
  const m = pathname.match(/^\/(en|pt)(\/.*)?$/);
  return m ? m[2] || "/" : pathname;
}

/**
 * URL para pasar a otro mercado/idioma. El middleware lee ?pais e ?idioma y
 * los deja fijados en cookies: lo elegido a mano manda sobre la IP.
 */
export function urlCambio(opts: {
  pathname: string;
  locale: Locale;
  mercado?: CodigoMercado;
}): string {
  const ruta = rutaSinIdioma(opts.pathname);
  const base = `${prefijo(opts.locale)}${ruta === "/" ? "" : ruta}` || "/";
  const q = new URLSearchParams({ idioma: opts.locale });
  if (opts.mercado) q.set("pais", opts.mercado === "OTRO" ? "US" : opts.mercado);
  return `${base}?${q.toString()}`;
}
