// Región del visitante: Paraguay (Gs., tablero impreso) vs. resto del mundo
// (USD, solo digital). Se detecta por IP en el middleware (header que pone
// Vercel en cada request) y se guarda en una cookie — el visitante puede
// pisarla a mano con el selector del Header/Footer.
//
// "py" es el default: si no hay país detectado (dev local, bots, IP rara),
// nos quedamos con el comportamiento de siempre en vez de asumir exterior.
export type Region = "py" | "intl";

export const REGION_COOKIE = "mr_region";
export const REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export function isRegion(v: unknown): v is Region {
  return v === "py" || v === "intl";
}

/** Vercel pone `x-vercel-ip-country` con el código ISO-2 del visitante (en local no existe). */
export function regionFromCountryCode(code: string | null | undefined): Region {
  if (!code) return "py";
  return code.toUpperCase() === "PY" ? "py" : "intl";
}

export const REGION_LABEL: Record<Region, string> = {
  py:   "Paraguay",
  intl: "Otro país",
};

// Server-only: lee la cookie desde un Server Component / route handler.
// No se puede importar desde un client component (usa next/headers).
export async function getRegion(): Promise<Region> {
  const { cookies } = await import("next/headers");
  const value = cookies().get(REGION_COOKIE)?.value;
  return isRegion(value) ? value : "py";
}

/** Client-safe: lee la cookie directo de document.cookie (para "use client"). */
export function getRegionClient(): Region {
  if (typeof document === "undefined") return "py";
  const match = document.cookie.match(new RegExp(`(?:^|; )${REGION_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]!) : null;
  return isRegion(value) ? value : "py";
}
