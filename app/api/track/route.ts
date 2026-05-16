// Receives anonymous funnel events from the client. The anon Supabase
// key is fine here — RLS allows inserts but no reads from anon.
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_EVENTOS = new Set([
  "customizer_started",
  "step_completed",
  "preview_generated",
  "checkout_started",
  "checkout_filled",
  "pedido_created",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, evento, producto, paso, data, pedido_id } = body ?? {};
    if (!session_id || !evento || !VALID_EVENTOS.has(evento)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await supabase.from("eventos_sesion").insert({
      session_id,
      evento,
      producto: producto ?? null,
      paso:     paso ?? null,
      data:     data ?? null,
      pedido_id: pedido_id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Tracking should never break the client — swallow failures.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
