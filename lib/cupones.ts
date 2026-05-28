// Coupon validation + discount calculation. Server-only (uses the service
// role to read cupones regardless of RLS). NEVER trust a discount computed
// on the client — always re-evaluate here before charging.
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface Cupon {
  id:             string;
  codigo:         string;
  tipo:           "monto" | "porcentaje";
  valor:          number;
  tope_descuento: number | null;
  monto_minimo:   number | null;
  vigencia_desde: string | null;
  vigencia_hasta: string | null;
  max_usos:       number | null;
  usos:           number;
  activo:         boolean;
  descripcion:    string | null;
  created_at:     string;
  updated_at:     string;
}

export function normalizeCodigo(c: string): string {
  return (c ?? "").trim().toUpperCase();
}

export async function fetchCupon(codigo: string): Promise<Cupon | null> {
  const norm = normalizeCodigo(codigo);
  if (!norm) return null;
  const { data, error } = await supabaseAdmin
    .from("cupones")
    .select("*")
    .ilike("codigo", norm)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as Cupon;
}

export interface EvaluacionCupon {
  ok:        boolean;
  error?:    string;
  descuento: number;        // Gs. to subtract from montoBase
  cupon?:    Cupon;
}

/**
 * Evaluates a coupon against a base amount (the product subtotal in Gs.,
 * before shipping). Returns the discount in Gs. and whether it's valid.
 */
export function evaluarCupon(
  cupon:     Cupon,
  montoBase: number,
  now:       Date = new Date(),
): EvaluacionCupon {
  if (!cupon.activo) {
    return { ok: false, error: "Este cupón no está activo.", descuento: 0 };
  }
  if (cupon.vigencia_desde && now < new Date(cupon.vigencia_desde)) {
    return { ok: false, error: "Este cupón todavía no está vigente.", descuento: 0 };
  }
  if (cupon.vigencia_hasta && now > new Date(cupon.vigencia_hasta)) {
    return { ok: false, error: "Este cupón está vencido.", descuento: 0 };
  }
  if (cupon.max_usos !== null && cupon.usos >= cupon.max_usos) {
    return { ok: false, error: "Este cupón alcanzó su límite de usos.", descuento: 0 };
  }
  if (cupon.monto_minimo && montoBase < cupon.monto_minimo) {
    return {
      ok: false,
      error: `Este cupón requiere una compra mínima de Gs. ${cupon.monto_minimo.toLocaleString("es-PY")}.`,
      descuento: 0,
    };
  }

  let descuento: number;
  if (cupon.tipo === "monto") {
    descuento = Math.min(Math.round(cupon.valor), montoBase);
  } else {
    const bruto = Math.round((montoBase * cupon.valor) / 100);
    descuento = cupon.tope_descuento ? Math.min(bruto, cupon.tope_descuento) : bruto;
  }
  descuento = Math.max(0, Math.min(descuento, montoBase));

  return { ok: true, descuento, cupon };
}

/** Fetch + evaluate in one call. */
export async function validarCupon(
  codigo:    string,
  montoBase: number,
): Promise<EvaluacionCupon> {
  const cupon = await fetchCupon(codigo);
  if (!cupon) return { ok: false, error: "Cupón inexistente.", descuento: 0 };
  return evaluarCupon(cupon, montoBase);
}
