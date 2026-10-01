"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";
import type { Pieza } from "@/lib/contenido";

async function asegurarAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("No autorizado.");
  return supabase;
}

export type Cambios = Partial<Omit<Pieza, "id" | "orden">>;

export async function crearTarjeta(estado: string) {
  try {
    const supabase = await asegurarAdmin();
    // Las nuevas van arriba de la columna (orden más chico).
    const { error } = await supabase
      .from("contenido_kanban")
      .insert({ titulo: "Sin título", estado, orden: -Date.now() });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/kanban");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarTarjeta(id: string, cambios: Cambios) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("contenido_kanban").update(cambios).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/kanban");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarTarjeta(id: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("contenido_kanban").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/kanban");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
