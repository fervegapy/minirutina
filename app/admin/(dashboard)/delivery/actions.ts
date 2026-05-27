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

function revalidarTodo() {
  revalidatePath("/admin/delivery");
  revalidatePath("/checkout");
}

export async function crearZona(
  nombre:   string,
  precio:   number,
  ciudades: string[],
  esDefault: boolean,
) {
  try {
    if (!nombre.trim()) return { ok: false, error: "Falta el nombre." };
    if (!Number.isFinite(precio) || precio < 0) {
      return { ok: false, error: "Precio inválido." };
    }
    const supabase = await asegurarAdmin();

    // Si esta nueva zona va a ser default, primero apago la default actual.
    if (esDefault) {
      await supabase.from("delivery_zonas").update({ es_default: false }).eq("es_default", true);
    }

    const { error } = await supabase.from("delivery_zonas").insert({
      nombre:     nombre.trim(),
      precio:     Math.round(precio),
      ciudades,
      es_default: esDefault,
    });
    if (error) return { ok: false, error: error.message };
    revalidarTodo();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarZona(
  id:        string,
  nombre:    string,
  precio:    number,
  ciudades:  string[],
  esDefault: boolean,
) {
  try {
    if (!nombre.trim()) return { ok: false, error: "Falta el nombre." };
    const supabase = await asegurarAdmin();

    if (esDefault) {
      await supabase.from("delivery_zonas")
        .update({ es_default: false })
        .eq("es_default", true)
        .neq("id", id);
    }

    const { error } = await supabase
      .from("delivery_zonas")
      .update({
        nombre:     nombre.trim(),
        precio:     Math.round(precio),
        ciudades,
        es_default: esDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidarTodo();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarZona(id: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("delivery_zonas").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidarTodo();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
