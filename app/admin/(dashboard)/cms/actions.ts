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
  // Pages that surface CMS-managed content. Las públicas viven en
  // /v/[variante] (una por idioma/mercado, ver lib/i18n), así que se
  // revalida la ruta dinámica entera.
  revalidatePath("/v/[variante]", "page");                  // landing
  revalidatePath("/v/[variante]/productos/[slug]", "page"); // precios + activo
}

// ─── Precios ─────────────────────────────────────────────────────────────────

export async function actualizarPrecios(
  producto: string,
  precio_impreso:    number,
  precio_digital:    number,
  precio_impreso_20: number | null = null,
  precio_digital_20: number | null = null,
) {
  try {
    const supabase = await asegurarAdmin();
    // For Rutinas the _20 fields are ignored (no cantidad concept).
    // For Recompensas they hold the 20-stickers variant prices.
    const payload: Record<string, unknown> = {
      producto,
      precio_impreso,
      precio_digital,
      updated_at: new Date().toISOString(),
    };
    if (producto === "recompensas") {
      payload.precio_impreso_20 = precio_impreso_20;
      payload.precio_digital_20 = precio_digital_20;
    }
    const { error } = await supabase.from("precios").upsert(payload);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidatePath("/checkout");
    revalidarPublicas();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// Precios del digital en ARS / BRL / USD (columnas de supabase/i18n_monedas.sql).
// null = sin cargar → el producto no se ofrece en esa moneda.
const COLUMNAS_EXTERIOR = [
  "precio_digital_ars", "precio_digital_20_ars",
  "precio_digital_brl", "precio_digital_20_brl",
  "precio_digital_usd", "precio_digital_20_usd",
] as const;

export async function actualizarPreciosExterior(
  producto: string,
  valores: Partial<Record<(typeof COLUMNAS_EXTERIOR)[number], number | null>>,
) {
  try {
    const supabase = await asegurarAdmin();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const col of COLUMNAS_EXTERIOR) {
      if (!(col in valores)) continue;
      const v = valores[col];
      payload[col] = typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
    }
    const { error } = await supabase.from("precios").update(payload).eq("producto", producto);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/cms");
    revalidatePath("/checkout");
    revalidarPublicas();
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

// ─── Etiquetas del producto (nombre / tagline) ───────────────────────────────
// Null/blank → vuelve al fallback hardcoded en lib/productos.ts.
export async function actualizarLabelsProducto(
  producto: string,
  nombre: string | null,
  tagline: string | null,
) {
  try {
    const supabase = await asegurarAdmin();
    const normalizar = (v: string | null) =>
      v && v.trim().length > 0 ? v.trim() : null;
    const { error } = await supabase
      .from("productos_config")
      .upsert({
        producto,
        nombre:  normalizar(nombre),
        tagline: normalizar(tagline),
        updated_at: new Date().toISOString(),
      });
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
