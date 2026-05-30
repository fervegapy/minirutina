// Server-side dLocal Go client. Charges in PYG natively — no currency
// conversion needed. NEVER import from client components (uses secret key).
//
// Credentials and base URL are resolved at request time from
// public.dlocal_config (with env-var fallback) so the admin can flip
// sandbox ↔ producción without touching Vercel.
//
// Docs: https://docs.dlocalgo.com/integration-api
import crypto from "crypto";
import { getActiveDlocalConfig, type ResolvedDlocalConfig } from "@/lib/dlocal-config";

function authHeader(cfg: ResolvedDlocalConfig): string {
  return `Bearer ${cfg.api_key}:${cfg.secret_key}`;
}

export interface CreatePaymentParams {
  amount:           number;
  currency:         string;
  country:          string;
  order_id:         string;
  description:      string;
  success_url:      string;
  back_url:         string;
  notification_url: string;
  payer?: { name?: string; email?: string };
}

export interface DlocalPayment {
  id:           string;
  amount:       number;
  currency:     string;
  country:      string;
  status:       "PENDING" | "PAID" | "REJECTED" | "CANCELLED" | "EXPIRED" | string;
  order_id?:    string;
  redirect_url?: string;
  payment_method_type?: string;
  approved_date?: string;
  [key: string]: unknown;
}

export async function createPayment(params: CreatePaymentParams): Promise<DlocalPayment> {
  const cfg = await getActiveDlocalConfig();
  const res = await fetch(`${cfg.api_base}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  authHeader(cfg),
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`dLocal createPayment ${res.status}: ${text}`);
  }
  return JSON.parse(text) as DlocalPayment;
}

export interface CreateTokenPaymentParams {
  amount:           number;
  currency:         string;
  country:          string;
  order_id:         string;
  description:      string;
  token:            string;
  notification_url: string;
  success_url?:     string;
  back_url?:        string;
  payer?: { name?: string; email?: string; document?: string };
}

export async function createPaymentWithToken(
  params: CreateTokenPaymentParams,
): Promise<DlocalPayment> {
  const cfg = await getActiveDlocalConfig();
  const res = await fetch(`${cfg.api_base}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  authHeader(cfg),
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`dLocal createPaymentWithToken ${res.status}: ${text}`);
  }
  return JSON.parse(text) as DlocalPayment;
}

export async function getPayment(paymentId: string): Promise<DlocalPayment> {
  const cfg = await getActiveDlocalConfig();
  const res = await fetch(`${cfg.api_base}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: { Authorization: authHeader(cfg) },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`dLocal getPayment ${res.status}: ${text}`);
  }
  return JSON.parse(text) as DlocalPayment;
}

/**
 * Verifies a webhook notification's HMAC signature.
 * dLocal sends:  Authorization: V2-HMAC-SHA256, Signature: <hex>
 * signature = HMAC-SHA256(message = API_KEY + rawBody, key = SECRET_KEY).
 */
export async function verifyWebhookSignature(
  rawBody:             string,
  authorizationHeader: string | null,
): Promise<boolean> {
  if (!authorizationHeader) return false;
  const match = authorizationHeader.match(/Signature\s*:\s*([a-f0-9]+)/i);
  const provided = match?.[1];
  if (!provided) return false;

  const cfg = await getActiveDlocalConfig();
  const expected = crypto
    .createHmac("sha256", cfg.secret_key)
    .update(cfg.api_key + rawBody)
    .digest("hex");

  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
