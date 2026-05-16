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

function revalidarPublicas() {
  // Pages that surface CMS-managed content:
  revalidatePath("/");                              // landing (testimonials)
  revalidatePath("/productos/rutinas");             // FAQs + activo
  revalidatePath("/productos/recompensas");
}

// ─── Precios ─────────────────────────────────────────────────────────────────

export async function actualizarPrecios(
  producto: string,
  precio_impreso: number,
  precio_digital: number,
) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("precios")
      .upsert({ producto, precio_impreso, precio_digital, updated_at: new Date().toISOString() });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// ─── Activación / pausa de producto ──────────────────────────────────────────

export async function setProductoActivo(producto: string, activo: boolean) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("productos_config")
      .upsert({ producto, activo, updated_at: new Date().toISOString() });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// ─── FAQs ────────────────────────────────────────────────────────────────────

export async function crearFaq(producto: string, pregunta: string, respuesta: string) {
  try {
    const supabase = await asegurarAdmin();
    const { data: maxRow } = await supabase
      .from("faqs")
      .select("orden")
      .eq("producto", producto)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    const orden = (maxRow?.orden ?? 0) + 1;
    const { error } = await supabase
      .from("faqs")
      .insert({ producto, pregunta, respuesta, orden });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarFaq(id: string, pregunta: string, respuesta: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("faqs")
      .update({ pregunta, respuesta })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarFaq(id: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// ─── Testimonios ─────────────────────────────────────────────────────────────

export async function crearTestimonio(texto: string, autor: string) {
  try {
    const supabase = await asegurarAdmin();
    const { data: maxRow } = await supabase
      .from("testimonios")
      .select("orden")
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    const orden = (maxRow?.orden ?? 0) + 1;
    const { error } = await supabase
      .from("testimonios")
      .insert({ texto, autor, orden, activo: true });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarTestimonio(id: string, texto: string, autor: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("testimonios")
      .update({ texto, autor })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function setTestimonioActivo(id: string, activo: boolean) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("testimonios")
      .update({ activo })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarTestimonio(id: string) {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase.from("testimonios").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
