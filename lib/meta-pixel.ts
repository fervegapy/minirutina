// Meta (Facebook) Pixel helpers. Runs on the client only.
//
// The base code is injected once by <MetaPixel /> in the root layout; these
// helpers just forward standard events to `fbq`. Like lib/tracking.ts, every
// call is fire-and-forget — if the pixel is blocked (ad blockers, Safari ITP)
// nothing throws and the UI is unaffected.
//
// Production sells in Guaraníes only, so `currency` is always PYG.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1113349541645232";

export type MetaEvent =
  | "PageView"
  | "ViewContent"
  | "CustomizeProduct"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export interface MetaParams {
  value?:        number;
  currency?:     "PYG";
  content_name?: string;
  content_ids?:  string[];
  content_type?: "product";
  num_items?:    number;
}

type Fbq = (cmd: "track", event: MetaEvent, params?: MetaParams, opts?: { eventID: string }) => void;

/** Sends a standard event. `eventID` lets Meta dedupe repeats (and, later,
 *  the same event sent from the server via the Conversions API). */
export function metaTrack(event: MetaEvent, params?: MetaParams, eventID?: string): void {
  if (typeof window === "undefined") return;
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (!fbq) return;
    const withCurrency = params?.value !== undefined ? { currency: "PYG" as const, ...params } : params;
    if (eventID) fbq("track", event, withCurrency, { eventID });
    else fbq("track", event, withCurrency);
  } catch {
    /* noop */
  }
}
