// Reads the currently-active PYG→{stripe currency} exchange rate from
// the `tipo_cambio` table. Used by:
//   - the Stripe checkout-session creator (to know how many USD to charge)
//   - the admin UI (to show the active rate + history)
//
// The "current" rate is the row with the latest vigente_desde that's
// already in the past. Falling back to the env-var default if the table
// is empty or unreachable, so checkout never breaks.

import { unstable_noStore as noStore } from "next/cache";

export interface TipoCambio {
  id:             string;
  moneda_origen:  string;
  moneda_destino: string;
  tasa:           number;
  vigente_desde:  string;
  notas:          string | null;
  creado_por:     string | null;
  created_at:     string;
}

const FALLBACK_RATE = Number(process.env.PYG_PER_USD ?? 7300);
const TARGET_CURRENCY = (process.env.STRIPE_CURRENCY ?? "usd").toUpperCase();

/** Returns the active rate (newest with vigente_desde <= now). */
export async function getTasaActual(): Promise<{ tasa: number; row: TipoCambio | null }> {
  noStore();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { tasa: FALLBACK_RATE, row: null };

  try {
    const nowIso = new Date().toISOString();
    const res = await fetch(
      `${url}/rest/v1/tipo_cambio?moneda_origen=eq.PYG&moneda_destino=eq.${TARGET_CURRENCY}` +
      `&vigente_desde=lte.${nowIso}&order=vigente_desde.desc,created_at.desc&limit=1`,
      {
        headers: {
          apikey:        key,
          Authorization: `Bearer ${key}`,
          Accept:        "application/json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return { tasa: FALLBACK_RATE, row: null };
    const rows = (await res.json()) as TipoCambio[];
    const row = rows[0] ?? null;
    return { tasa: row ? Number(row.tasa) : FALLBACK_RATE, row };
  } catch {
    return { tasa: FALLBACK_RATE, row: null };
  }
}

/** Returns ALL rates, newest first — for the admin history view. */
export async function getHistorialTasas(limit = 50): Promise<TipoCambio[]> {
  noStore();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(
      `${url}/rest/v1/tipo_cambio?order=vigente_desde.desc,created_at.desc&limit=${limit}`,
      {
        headers: {
          apikey:        key,
          Authorization: `Bearer ${key}`,
          Accept:        "application/json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    return (await res.json()) as TipoCambio[];
  } catch {
    return [];
  }
}

/** Helper for callers — convert a PYG amount to the destination currency. */
export function convertirPygA(amountPyg: number, tasa: number): number {
  if (tasa <= 0) return 0;
  return amountPyg / tasa;
}
