// Mercado del visitante: en qué moneda ve los precios y si puede comprar el
// tablero impreso. Se detecta por IP en el middleware (header que pone Vercel
// en cada request) y se guarda en una cookie.
//
//   Paraguay  → Gs.  · impreso + digital
//   Argentina → ARS  · solo digital
//   Brasil    → BRL  · solo digital
//   Resto     → USD  · solo digital
//
// Los precios en ARS/BRL/USD los fija el admin a mano en /admin/cms: no se
// convierten desde Gs. Un precio sin cargar (null) = ese producto no se
// ofrece en esa moneda.
//
// "PYG" es el default: sin país detectado (dev local, bots, IP rara) nos
// quedamos con el comportamiento de siempre en vez de asumir exterior.
export type Moneda = "PYG" | "ARS" | "BRL" | "USD";

export const MONEDAS: Moneda[] = ["PYG", "ARS", "BRL", "USD"];

export const MONEDA_COOKIE = "mr_moneda";
export const MONEDA_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export function isMoneda(v: unknown): v is Moneda {
  return v === "PYG" || v === "ARS" || v === "BRL" || v === "USD";
}

/** `x-vercel-ip-country` trae el ISO-2 del visitante (en local no existe). */
export function monedaFromCountryCode(code: string | null | undefined): Moneda {
  switch (code?.toUpperCase()) {
    case undefined:
    case "":
    case "PY": return "PYG";
    case "AR": return "ARS";
    case "BR": return "BRL";
    default:   return "USD";
  }
}

/** País que se le manda a dLocal para cada moneda. USD no lleva país: el
 *  checkout hospedado de dLocal se lo pide al pagador. */
export const PAIS_DLOCAL: Record<Moneda, string | undefined> = {
  PYG: "PY",
  ARS: "AR",
  BRL: "BR",
  USD: undefined,
};

/** Fuera de Paraguay no enviamos impreso: solo se vende el PDF. */
export function vendeImpreso(moneda: Moneda): boolean {
  return moneda === "PYG";
}

/** Sufijo de las columnas de `precios` para cada moneda extranjera. */
const SUFIJO: Record<Exclude<Moneda, "PYG">, string> = {
  ARS: "ars",
  BRL: "brl",
  USD: "usd",
};

// Fila de `precios` con todas las columnas que importan al público. Las de
// moneda extranjera solo existen en digital: el impreso es solo Paraguay.
export interface PreciosProducto {
  precio_impreso:         number | null;
  precio_digital:         number | null;
  precio_impreso_20?:     number | null;
  precio_digital_20?:     number | null;
  precio_digital_ars?:    number | null;
  precio_digital_20_ars?: number | null;
  precio_digital_brl?:    number | null;
  precio_digital_20_brl?: number | null;
  precio_digital_usd?:    number | null;
  precio_digital_20_usd?: number | null;
}

export const PRECIOS_SELECT =
  "producto, precio_impreso, precio_digital, precio_impreso_20, precio_digital_20, " +
  "precio_digital_ars, precio_digital_20_ars, precio_digital_brl, precio_digital_20_brl, " +
  "precio_digital_usd, precio_digital_20_usd";

/**
 * Precio de un ítem en la moneda dada, o null si no está cargado (o no se
 * vende: impreso fuera de Paraguay).
 */
export function precioEn(
  row: PreciosProducto | null | undefined,
  moneda: Moneda,
  tipo: "fisico" | "digital",
  veinte = false,
): number | null {
  if (!row) return null;
  let v: number | null | undefined;
  if (moneda === "PYG") {
    if (tipo === "fisico") v = veinte ? row.precio_impreso_20 ?? row.precio_impreso : row.precio_impreso;
    else                   v = veinte ? row.precio_digital_20 ?? row.precio_digital : row.precio_digital;
  } else {
    if (tipo === "fisico") return null;
    const s = SUFIJO[moneda];
    const r = row as unknown as Record<string, number | null | undefined>;
    v = veinte ? r[`precio_digital_20_${s}`] ?? r[`precio_digital_${s}`] : r[`precio_digital_${s}`];
  }
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

/** "Gs. 150.000", "$ 12.500", "R$ 49,90", "US$ 9.90". */
export function formatPrecio(n: number, moneda: Moneda): string {
  switch (moneda) {
    case "PYG": return "Gs. " + Math.round(n).toLocaleString("es-PY");
    case "ARS": return "$ " + Math.round(n).toLocaleString("es-AR");
    case "BRL": return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case "USD": return "US$ " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

// Server-only: lee la cookie desde un Server Component / route handler.
export async function getMoneda(): Promise<Moneda> {
  const { cookies } = await import("next/headers");
  const value = cookies().get(MONEDA_COOKIE)?.value;
  return isMoneda(value) ? value : "PYG";
}

/** Client-safe: lee la cookie de document.cookie (para "use client"). */
export function getMonedaClient(): Moneda {
  if (typeof document === "undefined") return "PYG";
  const m = document.cookie.match(new RegExp(`(?:^|; )${MONEDA_COOKIE}=([^;]*)`));
  const value = m ? decodeURIComponent(m[1]!) : null;
  return isMoneda(value) ? value : "PYG";
}
