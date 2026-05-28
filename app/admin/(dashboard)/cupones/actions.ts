"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";

async function asegurarAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("No autorizado.");
  return supabase;
}

export interface CuponInput {
  codigo:         string;
  tipo:           "monto" | "porcentaje";
  valor:          number;
  tope_descuento: number | null;
  monto_minimo:   number | null;
  vigencia_hasta: string | null;   // ISO or null
  max_usos:       number | null;
  activo:         boolean;
  descripcion:    string | null;
}

function validar(c: CuponInput): string | null {
  if (!c.codigo.trim()) return "Falta el código.";
  if (!Number.isFinite(c.valor) || c.valor <= 0) return "Valor inválido.";
  if (c.tipo === "porcentaje" && c.valor > 100) return "El porcentaje no puede superar 100.";
  return null;
}

export async function crearCupon(input: CuponInput) {
  try {
    const err = validar(input);
    if (err) return { ok: false, error: err };
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("cupones").insert({
      codigo:         input.codigo.trim().toUpperCase(),
      tipo:           input.tipo,
      valor:          input.valor,
      tope_descuento: input.tope_descuento,
      monto_minimo:   input.monto_minimo,
      vigencia_hasta: input.vigencia_hasta,
      max_usos:       input.max_usos,
      activo:         input.activo,
      descripcion:    input.descripcion?.trim() || null,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Ya existe un cupón con ese código." };
      return { ok: false, error: error.message };
    }
    revalidatePath("/admin/cupones");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarCupon(id: string, input: CuponInput) {
  try {
    const err = validar(input);
    if (err) return { ok: false, error: err };
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("cupones").update({
      codigo:         input.codigo.trim().toUpperCase(),
      tipo:           input.tipo,
      valor:          input.valor,
      tope_descuento: input.tope_descuento,
      monto_minimo:   input.monto_minimo,
      vigencia_hasta: input.vigencia_hasta,
      max_usos:       input.max_usos,
      activo:         input.activo,
      descripcion:    input.descripcion?.trim() || null,
      updated_at:     new Date().toISOString(),
    }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cupones");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarCupon(id: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("cupones").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cupones");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function toggleActivo(id: string, activo: boolean) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("cupones").update({ activo }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cupones");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
