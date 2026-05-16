// Anonymous funnel tracking. Runs on the client only.
//
// Each visitor gets a random session_id in localStorage (no cookie, no
// fingerprinting). Events are POSTed to /api/track with `keepalive: true`
// so they survive page navigation, and the call is fire-and-forget — UI
// is never blocked or rolled back if tracking fails.
//
// We only capture personal info (email / whatsapp) inside the
// `checkout_filled` event's `data` payload, after the user has typed it
// in voluntarily. Everything else is product / step metadata.

"use client";

const STORAGE_KEY = "mr_session_id";

export type TrackEvent =
  | "customizer_started"
  | "step_completed"
  | "preview_generated"
  | "checkout_started"
  | "checkout_filled"
  | "pedido_created";

interface TrackArgs {
  evento:    TrackEvent;
  producto?: "rutinas" | "recompensas";
  paso?:     string;
  data?:     Record<string, unknown>;
  pedidoId?: string;
}

/** Returns the persisted session id, creating one on first call. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return ""; // localStorage blocked (private mode etc.) — drop tracking quietly
  }
}

/** Fire-and-forget event log. Never throws, never blocks. */
export function track(args: TrackArgs): void {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  if (!session_id) return;

  const payload = {
    session_id,
    evento:    args.evento,
    producto:  args.producto ?? null,
    paso:      args.paso ?? null,
    data:      args.data ?? null,
    pedido_id: args.pedidoId ?? null,
  };

  try {
    fetch("/api/track", {
      method:    "POST",
      headers:   { "Content-Type": "application/json" },
      body:      JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* noop */
  }
}
