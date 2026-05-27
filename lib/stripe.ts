// Server-side Stripe client. NEVER import this from client components —
// it uses the secret key. Use it from API routes / server actions only.
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // Pin the API version so updates to the stripe npm package don't change
  // the response shape silently. Bump this intentionally when ready.
  apiVersion: "2026-04-22.dahlia",
});

export const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase();
