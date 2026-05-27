// Public contact-form handler.
// - Honeypot field 'website' → silently drop (200 ok but no work).
// - Per-IP rate limit: max 3 submissions in the last 5 minutes.
// - Save the message in public.mensajes (service role bypasses RLS).
// - Send a notification email to soporte@minirutina.com via Resend.
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase-admin";

const SOPORTE_EMAIL = "soporte@minirutina.com";

const RATE_LIMIT_WINDOW_MIN = 5;
const RATE_LIMIT_MAX        = 3;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  nombre?:  string;
  email?:   string;
  mensaje?: string;
  website?: string;     // honeypot
}

function clientIp(req: NextRequest): string | null {
  // Vercel forwards the real client IP in x-forwarded-for.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  // Honeypot — silently succeed without doing anything.
  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const nombre  = (body.nombre  ?? "").trim();
  const email   = (body.email   ?? "").trim();
  const mensaje = (body.mensaje ?? "").trim();

  if (!nombre || !email || !mensaje) {
    return NextResponse.json(
      { ok: false, error: "Faltan campos requeridos." },
      { status: 400 },
    );
  }
  if (!EMAIL_RX.test(email)) {
    return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
  }
  if (nombre.length > 120 || email.length > 200 || mensaje.length > 3000) {
    return NextResponse.json({ ok: false, error: "Mensaje demasiado largo." }, { status: 400 });
  }

  const ip         = clientIp(req);
  const userAgent  = req.headers.get("user-agent") ?? null;

  // Rate limit by IP — if not available, by email as a softer fallback.
  try {
    const sinceIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60_000).toISOString();
    let query = supabaseAdmin
      .from("mensajes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso);
    if (ip)         query = query.eq("ip", ip);
    else            query = query.eq("email", email);
    const { count } = await query;
    if (typeof count === "number" && count >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { ok: false, error: "Demasiados mensajes recientes. Probá en unos minutos." },
        { status: 429 },
      );
    }
  } catch (e) {
    console.warn("[contacto] rate-limit check failed:", e);
  }

  // Persist
  const { data: inserted, error: insErr } = await supabaseAdmin
    .from("mensajes")
    .insert({ nombre, email, mensaje, ip, user_agent: userAgent })
    .select("id")
    .single();
  if (insErr) {
    console.error("[contacto] insert error:", insErr);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el mensaje." },
      { status: 500 },
    );
  }

  // Notify support — non-blocking; if it fails we already saved the message
  // so we don't fail the request.
  const html = `<!DOCTYPE html>
<html><body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#22244e;padding:24px;">
  <h2 style="margin:0 0 12px;">📩 Nuevo mensaje de contacto</h2>
  <table cellpadding="4" cellspacing="0" style="font-size:14px;">
    <tr><td style="color:#22244e88;">Nombre:</td><td><strong>${escapeHtml(nombre)}</strong></td></tr>
    <tr><td style="color:#22244e88;">Email:</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
  <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#22244ecc;">${escapeHtml(mensaje)}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
  <p style="font-size:12px;color:#22244e66;">
    Mensaje #${inserted.id.slice(0, 8).toUpperCase()} ·
    Ver en <a href="https://www.minirutina.com/admin/mensajes">/admin/mensajes</a>
  </p>
</body></html>`;

  sendEmail({
    to:      SOPORTE_EMAIL,
    subject: `📩 Nuevo mensaje — ${nombre}`,
    html,
  }).catch((e) => console.error("[contacto] support email failed:", e));

  return NextResponse.json({ ok: true, id: inserted.id });
}
