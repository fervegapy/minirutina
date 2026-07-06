// TEMP diagnostic route — verifies Telegram notifications work in production
// with the real Vercel env vars. Gated by a secret query param. DELETE after use.
import { NextRequest, NextResponse } from "next/server";
import { notificarPagoTelegram, telegramConfigurado } from "@/lib/telegram";

export const runtime = "nodejs";

const SECRET = "1a290d677f6ab55457db027a";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== SECRET) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const configurado = telegramConfigurado();
  const enviado = await notificarPagoTelegram({
    pedidoId: "test0000-diag-diag-diag-diagdiagdiag",
    items: [
      { producto: "Tablero de Rutinas", nombreNino: "PRUEBA", tipoEntrega: "fisico", precioPyg: 149000 },
    ],
    totalPyg: 149000,
    metodo:   "TEST (diagnóstico)",
    contacto: "Nombre: Prueba | Email: test@minirutina.com",
  });

  return NextResponse.json({
    telegram_configurado: configurado,
    mensaje_enviado:      enviado,
    hint: configurado
      ? (enviado ? "OK — deberías haber recibido el mensaje en Telegram."
                 : "Credenciales presentes pero el envío FALLÓ. Revisá los logs de Vercel filtrando '[telegram]'.")
      : "Las env vars TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID NO están cargadas en este entorno de Vercel.",
  });
}
