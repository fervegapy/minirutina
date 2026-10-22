// Mercado del visitante: en qué moneda ve los precios y si puede comprar el
// tablero impreso. Se detecta por IP en el middleware (header que pone Vercel
// en cada request) y se guarda en una cookie.
//
//   Paraguay  → Gs.  · impreso + digital
//   Argentina → ARS  · solo digital
//   Brasil    → BRL  · solo digital
//   Resto     → USD  · solo digital
//
// El precio de afuera se fija en USD (a mano, en /admin/cms). ARS y BRL se
// calculan desde el USD con el tipo de cambio del día (tabla tasas_usd, que
// carga una tarea diaria) y se redondean a un precio "lindo". Si el admin
// carga a mano un precio en ARS o BRL, ese gana sobre el calculado. Nada se
// convierte desde Gs. Sin precio USD (ni override) = no se vende afuera.
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

/** Unidades de cada moneda por 1 USD (de la tabla tasas_usd). */
export type Tasas = Partial<Record<"ARS" | "BRL", number>>;

/**
 * Redondeo a un precio de vidriera, al más cercano: BRL termina en 9,90
 * (R$ 85,93 → R$ 89,90) y ARS en 900 ($ 25.737 → $ 25.900). El desvío
 * máximo es de R$ 5 o $ 500 respecto del cálculo exacto.
 */
export function redondearPrecio(n: number, moneda: Moneda): number {
  if (moneda === "BRL") return Math.max(9.9, Math.round((n + 0.1) / 10) * 10 - 0.1);
  if (moneda === "ARS") return Math.max(900, Math.round((n + 100) / 1000) * 1000 - 100);
  return n;
}

/**
 * Precio de un ítem en la moneda dada, o null si no está cargado (o no se
 * vende: impreso fuera de Paraguay). ARS/BRL: override manual si existe; si
 * no, USD × tasa del día redondeado (null si falta la tasa o el USD).
 */
export function precioEn(
  row: PreciosProducto | null | undefined,
  moneda: Moneda,
  tipo: "fisico" | "digital",
  veinte = false,
  tasas: Tasas = {},
): number | null {
  if (row && tipo === "digital" && (moneda === "ARS" || moneda === "BRL")) {
    const manual = precioDirecto(row, moneda, tipo, veinte);
    if (manual !== null) return manual;
    const usd = precioDirecto(row, "USD", tipo, veinte);
    const tasa = tasas[moneda];
    if (usd === null || !tasa || !(tasa > 0)) return null;
    return redondearPrecio(usd * tasa, moneda);
  }
  return precioDirecto(row, moneda, tipo, veinte);
}

// El valor tal como está en la fila de `precios`, sin conversión.
function precioDirecto(
  row: PreciosProducto | null | undefined,
  moneda: Moneda,
  tipo: "fisico" | "digital",
  veinte: boolean,
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
