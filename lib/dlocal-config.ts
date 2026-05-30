// Resolves the active dLocal Go credentials + mode from the
// public.dlocal_config table. Server-side reads use the service role to
// access the api_key + secret_key columns; the public-facing endpoint
// only ever returns the SmartFields public key + ambiente + checkout
// mode.
import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type Ambiente = "sandbox" | "production";
export type CheckoutMode = "redirect" | "embedded";

export interface ResolvedDlocalConfig {
  ambiente:        Ambiente;
  checkout_mode:   CheckoutMode;
  api_base:        string;
  api_key:         string;
  secret_key:      string;
  smartfields_key: string;
}

const SANDBOX_BASE = "https://api-sbx.dlocalgo.com/v1";
const PROD_BASE    = "https://api.dlocalgo.com/v1";

export interface DlocalConfigRow {
  id:                      number;
  ambiente:                Ambiente;
  checkout_mode:           CheckoutMode;
  sandbox_api_key:         string | null;
  sandbox_secret_key:      string | null;
  sandbox_smartfields_key: string | null;
  prod_api_key:            string | null;
  prod_secret_key:         string | null;
  prod_smartfields_key:    string | null;
  updated_at:              string;
  updated_by:              string | null;
}

/** Reads the singleton config row using the SERVICE ROLE (server-only). */
export async function getDlocalConfigRow(): Promise<DlocalConfigRow | null> {
  noStore();
  const { data } = await supabaseAdmin
    .from("dlocal_config").select("*").eq("id", 1).maybeSingle();
  return (data as DlocalConfigRow | null) ?? null;
}

/** Resolves the active config (env-var fallback if the row doesn't exist). */
export async function getActiveDlocalConfig(): Promise<ResolvedDlocalConfig> {
  const row = await getDlocalConfigRow();
  if (!row) {
    return {
      ambiente:        (process.env.NEXT_PUBLIC_DLOCAL_ENV as Ambiente) ?? "sandbox",
      checkout_mode:   (process.env.NEXT_PUBLIC_CHECKOUT_MODE as CheckoutMode) ?? "redirect",
      api_base:         process.env.DLOCAL_API_BASE ?? SANDBOX_BASE,
      api_key:          process.env.DLOCAL_API_KEY ?? "",
      secret_key:       process.env.DLOCAL_SECRET_KEY ?? "",
      smartfields_key:  process.env.DLOCAL_SMARTFIELDS_KEY ?? "",
    };
  }
  const isProd = row.ambiente === "production";
  return {
    ambiente:        row.ambiente,
    checkout_mode:   row.checkout_mode,
    api_base:        isProd ? PROD_BASE : SANDBOX_BASE,
    api_key:         (isProd ? row.prod_api_key         : row.sandbox_api_key)         ?? "",
    secret_key:      (isProd ? row.prod_secret_key      : row.sandbox_secret_key)      ?? "",
    smartfields_key: (isProd ? row.prod_smartfields_key : row.sandbox_smartfields_key) ?? "",
  };
}

/** Public subset — safe to expose to the browser. */
export interface PublicDlocalConfig {
  ambiente:        Ambiente;
  checkout_mode:   CheckoutMode;
  smartfields_key: string;
}

export async function getPublicDlocalConfig(): Promise<PublicDlocalConfig> {
  const c = await getActiveDlocalConfig();
  return {
    ambiente:        c.ambiente,
    checkout_mode:   c.checkout_mode,
    smartfields_key: c.smartfields_key,
  };
}
