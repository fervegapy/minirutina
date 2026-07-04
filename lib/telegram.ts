// Telegram notifications for the team (order tracking).
//
// Setup: create a bot with @BotFather → TELEGRAM_BOT_TOKEN, then get the
// target chat id (e.g. via https://api.telegram.org/bot<token>/getUpdates
// after messaging the bot) → TELEGRAM_CHAT_ID. Both env vars must be set;
// otherwise sending is a silent no-op so the feature degrades gracefully.
//
// Never throws — callers treat this as fire-and-forget, a Telegram outage
// must never break a payment webhook.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID ?? "";

/** True when both env vars are set — callers use this to tell a real send
 *  failure apart from the intentional unconfigured no-op. */
export function telegramConfigurado(): boolean {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

/** Sends an HTML-formatted message to the team chat. Resolves to false on any failure. */
export async function sendTelegram(html: string): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    CHAT_ID,
        text:       html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[telegram] sendMessage failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[telegram] sendMessage error:", e);
    return false;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface TelegramPedidoItem {
  producto:    string;   // human label
  nombreNino:  string;
  tipoEntrega: string;   // "digital" | "fisico"
  precioPyg:   number;
}

/** Team notification for a confirmed payment (dLocal or cupón 100%). */
export async function notificarPagoTelegram(args: {
  pedidoId:  string;
  items:     TelegramPedidoItem[];
  totalPyg:  number;
  metodo:    string;          // "dLocal" | "Cupón 100%"
  contacto?: string | null;
}): Promise<boolean> {
  const nro = args.pedidoId.slice(0, 8).toUpperCase();
  const fmt = (n: number) => "Gs. " + Math.round(n).toLocaleString("es-PY");

  const lineas = args.items.map((it) =>
    `• ${esc(it.producto)} — <b>${esc(it.nombreNino)}</b> (${it.tipoEntrega === "digital" ? "Digital" : "Impreso"}) · ${fmt(it.precioPyg)}`,
  ).join("\n");

  const msg =
    `💸 <b>Pedido pagado</b> — #${nro}\n` +
    `${lineas}\n` +
    `Total: <b>${fmt(args.totalPyg)}</b> · ${esc(args.metodo)}\n` +
    (args.contacto ? `${esc(args.contacto)}\n` : "") +
    `https://www.minirutina.com/admin/pedidos/${args.pedidoId}`;

  return sendTelegram(msg);
}
