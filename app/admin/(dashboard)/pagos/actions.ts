"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";
import type { Ambiente, CheckoutMode } from "@/lib/dlocal-config";

async function asegurarAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("No autorizado.");
  return { supabase, email: user.email ?? null };
}

export interface DlocalConfigInput {
  ambiente:                 Ambiente;
  checkout_mode:            CheckoutMode;
  sandbox_api_key:          string;
  sandbox_secret_key:       string;
  sandbox_smartfields_key:  string;
  prod_api_key:             string;
  prod_secret_key:          string;
  prod_smartfields_key:     string;
}

export async function guardarDlocalConfig(input: DlocalConfigInput) {
  try {
    const { supabase, email } = await asegurarAdmin();
    const { error } = await supabase
      .from("dlocal_config")
      .upsert({
        id:                       1,
        ambiente:                 input.ambiente,
        checkout_mode:            input.checkout_mode,
        sandbox_api_key:          input.sandbox_api_key.trim() || null,
        sandbox_secret_key:       input.sandbox_secret_key.trim() || null,
        sandbox_smartfields_key:  input.sandbox_smartfields_key.trim() || null,
        prod_api_key:             input.prod_api_key.trim() || null,
        prod_secret_key:          input.prod_secret_key.trim() || null,
        prod_smartfields_key:     input.prod_smartfields_key.trim() || null,
        updated_at:               new Date().toISOString(),
        updated_by:               email,
      });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/pagos");
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
