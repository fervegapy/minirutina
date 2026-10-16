// Tarea diaria (vercel.json → crons): guarda el tipo de cambio USD → ARS/BRL
// del día en `tasas_usd`. Con eso se calculan los precios en pesos argentinos
// y reales desde el precio en USD (ver lib/mercado.ts).
//
// Fuente: open.er-api.com (gratis, sin clave, se actualiza una vez por día).
// Para ARS trae el oficial, que es más o menos con el que liquida dLocal.
//
// Una vez por día y no en tiempo real a propósito: si el precio se moviera
// mientras alguien está en el checkout, vería un monto y pagaría otro.
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FUENTE = "https://open.er-api.com/v6/latest/USD";

// Una tasa que se mueve más que esto contra la anterior se descarta: es más
// probable un error de la fuente que un salto real de un día para el otro.
const SALTO_MAXIMO = 0.25;

export async function GET(req: NextRequest) {
  // Vercel manda el CRON_SECRET del proyecto como Bearer. Sin la variable
  // configurada la ruta queda abierta, pero lo único que hace es refrescar
  // la tasa desde la fuente pública.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let rates: Record<string, number>;
  try {
    const res = await fetch(FUENTE, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || json.result !== "success") throw new Error(`fuente respondió ${res.status}`);
    rates = json.rates;
  } catch (e) {
    console.error("[cron/tipo-cambio] no se pudo leer la fuente:", e);
    return NextResponse.json({ ok: false, error: "fuente no disponible" }, { status: 502 });
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const guardadas: Record<string, number> = {};
  const descartadas: Record<string, string> = {};

  for (const moneda of ["ARS", "BRL"] as const) {
    const tasa = Number(rates[moneda]);
    if (!(tasa > 0)) { descartadas[moneda] = "sin dato"; continue; }

    const { data: previa } = await supabaseAdmin
      .from("tasas_usd")
      .select("tasa")
      .eq("moneda", moneda)
      .lt("fecha", fecha)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle();
    const anterior = previa ? Number(previa.tasa) : null;
    if (anterior && Math.abs(tasa / anterior - 1) > SALTO_MAXIMO) {
      descartadas[moneda] = `salto de ${anterior} a ${tasa}`;
      continue;
    }

    const { error } = await supabaseAdmin
      .from("tasas_usd")
      .upsert({ moneda, fecha, tasa, fuente: "open.er-api.com" });
    if (error) descartadas[moneda] = error.message;
    else guardadas[moneda] = tasa;
  }

  if (Object.keys(descartadas).length) {
    console.error("[cron/tipo-cambio] tasas descartadas:", descartadas);
  }

  // Las páginas de producto se sirven desde el CDN: que tomen la tasa nueva.
  if (Object.keys(guardadas).length) {
    revalidatePath("/v/[variante]/productos/[slug]", "page");
  }

  return NextResponse.json({ ok: Object.keys(descartadas).length === 0, fecha, guardadas, descartadas });
}
