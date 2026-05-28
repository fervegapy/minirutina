// Server-side dLocal Go client. Charges in PYG natively — no currency
// conversion needed. NEVER import from client components (uses secret key).
//
// Docs: https://docs.dlocalgo.com/integration-api
import crypto from "crypto";

const API_BASE   = process.env.DLOCAL_API_BASE ?? "https://api.dlocalgo.com/v1";
const API_KEY    = process.env.DLOCAL_API_KEY ?? "";
const SECRET_KEY = process.env.DLOCAL_SECRET_KEY ?? "";

function authHeader(): string {
  // dLocal Go: Bearer <API_KEY>:<SECRET_KEY>
  return `Bearer ${API_KEY}:${SECRET_KEY}`;
}

export interface CreatePaymentParams {
  amount:           number;        // in PYG (integer — Guaraní has no decimals)
  currency:         string;        // "PYG"
  country:          string;        // "PY"
  order_id:         string;
  description:      string;
  success_url:      string;
  back_url:         string;
  notification_url: string;
  payer?: {
    name?:  string;
    email?: string;
  };
}

export interface DlocalPayment {
  id:           string;            // "DP-xxxxx"
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
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  authHeader(),
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

export async function getPayment(paymentId: string): Promise<DlocalPayment> {
  const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: { Authorization: authHeader() },
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
 *
 * dLocal sends:  Authorization: V2-HMAC-SHA256, Signature: <hex>
 * The signature is HMAC-SHA256(message = API_KEY + rawBody, key = SECRET_KEY).
 */
export function verifyWebhookSignature(rawBody: string, authorizationHeader: string | null): boolean {
  if (!authorizationHeader) return false;
  const match = authorizationHeader.match(/Signature\s*:\s*([a-f0-9]+)/i);
  const provided = match?.[1];
  if (!provided) return false;

  const expected = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(API_KEY + rawBody)
    .digest("hex");

  // Constant-time compare.
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
