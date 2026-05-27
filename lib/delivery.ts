// Delivery zones helper. Reads from public.delivery_zonas and returns
// either the matching zone for a city, or the default zone.

import { unstable_noStore as noStore } from "next/cache";

export interface DeliveryZona {
  id:          string;
  nombre:      string;
  precio:      number;          // Gs.
  ciudades:    string[];
  es_default:  boolean;
  orden:       number;
  created_at:  string;
  updated_at:  string;
}

function normalize(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export async function getZonas(): Promise<DeliveryZona[]> {
  noStore();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(
      `${url}/rest/v1/delivery_zonas?select=*&order=orden.asc,nombre.asc`,
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
    return (await res.json()) as DeliveryZona[];
  } catch {
    return [];
  }
}

/** Picks the zone whose ciudades array contains the given city (case/accent
 *  insensitive). Falls back to the zone marked es_default. Returns null if
 *  there are no zones configured. */
export function findZonaForCiudad(
  ciudad:  string | null | undefined,
  zonas:   DeliveryZona[],
): DeliveryZona | null {
  if (zonas.length === 0) return null;
  const target = normalize(ciudad ?? "");
  if (target) {
    const match = zonas.find((z) =>
      z.ciudades.some((c) => normalize(c) === target),
    );
    if (match) return match;
  }
  return zonas.find((z) => z.es_default) ?? null;
}
