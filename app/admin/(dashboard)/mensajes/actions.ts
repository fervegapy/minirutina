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

export async function marcarLeido(id: string, leido: boolean) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("mensajes").update({ leido }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/mensajes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function marcarRespondido(id: string, respondido: boolean) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("mensajes").update({ respondido }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/mensajes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarMensaje(id: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("mensajes").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/mensajes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
