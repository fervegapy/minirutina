"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";

export type AssetKind = "logo" | "favicon" | "og" | "support";

const COLUMN_BY_KIND: Record<AssetKind, string> = {
  logo:    "logo_url",
  favicon: "favicon_url",
  og:      "og_image_url",
  support: "support_image_url",
};

const FILENAME_BY_KIND: Record<AssetKind, string> = {
  logo:    "logo",
  favicon: "favicon",
  og:      "og-image",
  support: "support",
};

async function asegurarAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("No autorizado.");
  return supabase;
}

function revalidarPublicas() {
  revalidatePath("/", "layout"); // refreshes metadata for entire site
  revalidatePath("/");
}

// ─── Textual fields ──────────────────────────────────────────────────────────

export async function actualizarSiteConfig(
  site_name: string,
  site_description: string,
  theme_color: string,
) {
  try {
    const supabase = await asegurarAdmin();
    const { data: rows, error } = await supabase
      .from("site_config")
      .upsert({
        id:               1,
        site_name:        site_name.trim() || "Minirutina",
        site_description: site_description.trim(),
        theme_color:      theme_color.trim() || "#336aea",
        updated_at:       new Date().toISOString(),
      })
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!rows || rows.length === 0) {
      return {
        ok: false,
        error:
          "Guardado falló silenciosamente (probablemente RLS). " +
          "Corré supabase/site_config_rls.sql en Supabase.",
      };
    }
    revalidarPublicas();
    revalidatePath("/admin/branding");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// ─── Asset upload ────────────────────────────────────────────────────────────

export async function subirAsset(kind: AssetKind, formData: FormData) {
  try {
    const supabase = await asegurarAdmin();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "Archivo vacío." };

    // Keep a stable filename per kind (overwrite on re-upload). Append
    // a timestamp suffix to bust any CDN/cache when the URL changes.
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${FILENAME_BY_KIND[kind]}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase
      .storage
      .from("branding")
      .upload(path, buffer, {
        contentType: file.type || "image/png",
        upsert:      true,
      });
    if (upErr) return { ok: false, error: upErr.message };

    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // upsert (not update) so we don't silently no-op if id=1 doesn't exist
    // yet. Also use .select() so we can detect when RLS hides the row.
    const { data: rows, error: updErr } = await supabase
      .from("site_config")
      .upsert({
        id:                     1,
        [COLUMN_BY_KIND[kind]]: publicUrl,
        updated_at:             new Date().toISOString(),
      })
      .select("id");
    if (updErr) return { ok: false, error: `DB: ${updErr.message}` };
    if (!rows || rows.length === 0) {
      return {
        ok: false,
        error:
          "El archivo se subió pero el guardado en la base falló (probablemente RLS). " +
          "Asegurate de haber corrido supabase/site_config_rls.sql en Supabase.",
      };
    }

    revalidarPublicas();
    revalidatePath("/admin/branding");
    return { ok: true, url: publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function quitarAsset(kind: AssetKind) {
  try {
    const supabase = await asegurarAdmin();
    const { data: rows, error } = await supabase
      .from("site_config")
      .upsert({
        id:                     1,
        [COLUMN_BY_KIND[kind]]: null,
        updated_at:             new Date().toISOString(),
      })
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!rows || rows.length === 0) {
      return { ok: false, error: "No se pudo guardar (revisá RLS)." };
    }
    revalidarPublicas();
    revalidatePath("/admin/branding");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
