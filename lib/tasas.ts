// Tipo de cambio del día (USD → ARS / BRL) desde la tabla `tasas_usd`. Ver
// lib/mercado.ts para cómo se usa y app/api/cron/tipo-cambio para cómo se
// carga. Si la tabla no existe todavía o está vacía, devuelve {} y los
// precios en ARS/BRL quedan sin calcular (no se venden hasta que haya tasa).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tasas } from "@/lib/mercado";

export async function leerTasas(client: SupabaseClient): Promise<Tasas> {
  // La última fila de cada moneda: con una por día, 10 alcanzan de sobra.
  const { data, error } = await client
    .from("tasas_usd")
    .select("moneda, tasa, fecha")
    .order("fecha", { ascending: false })
    .limit(10);
  if (error || !data) return {};
  const tasas: Tasas = {};
  for (const r of data as { moneda: "ARS" | "BRL"; tasa: number }[]) {
    if (tasas[r.moneda] === undefined) tasas[r.moneda] = Number(r.tasa);
  }
  return tasas;
}
