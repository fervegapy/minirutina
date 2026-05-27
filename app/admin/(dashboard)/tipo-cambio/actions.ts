"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";

async function asegurarAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("No autorizado.");
  return { supabase, email: user.email ?? null };
}

export async function crearTasa(
  tasa:           number,
  vigente_desde?: string | null,    // ISO; defaults to now() server-side
  notas?:         string | null,
) {
  try {
    if (!Number.isFinite(tasa) || tasa <= 0) {
      return { ok: false, error: "La tasa tiene que ser un número positivo." };
    }
    const { supabase, email } = await asegurarAdmin();

    const { data: rows, error } = await supabase
      .from("tipo_cambio")
      .insert({
        moneda_origen:  "PYG",
        moneda_destino: (process.env.STRIPE_CURRENCY ?? "usd").toUpperCase(),
        tasa,
        vigente_desde:  vigente_desde && vigente_desde.trim() ? vigente_desde : new Date().toISOString(),
        notas:          notas?.trim() || null,
        creado_por:     email,
      })
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!rows || rows.length === 0) {
      return {
        ok: false,
        error: "No se pudo guardar (revisá las políticas RLS de tipo_cambio).",
      };
    }

    revalidatePath("/admin/tipo-cambio");
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
