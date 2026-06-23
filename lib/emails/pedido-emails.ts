// High-level builders + senders for the customer email sequence. Each email
// has a pure `build*` function (returns { subject, html }) so it can be unit
// tested / previewed, plus a thin `enviar*` wrapper that dispatches via Resend
// (lib/email). The senders are safe to call fire-and-forget — they never throw.
//
// Sequence:
//   1. recordatorio de pago   — manual, from admin, while estado = pendiente
//   2. pedido confirmado      — auto, dLocal webhook on PAID
//   3. en camino              — auto, admin marks estado = enviado
//   4. feedback               — auto, admin marks estado = entregado
import { sendEmail } from "@/lib/email";
import {
  renderEmailShell,
  summaryCard,
  infoBox,
  emailButton,
  timeline,
  pedidoNumero,
  fmtPyg,
  type EmailItemSummary,
} from "@/lib/emails/template";

const PRODUCTO_LABEL: Record<string, string> = {
  rutinas:     "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
  semana:      "Plan de la Semana",
};

export function productoLabel(producto: string): string {
  return PRODUCTO_LABEL[producto] ?? producto;
}

// Business contact + feedback destination. Filled via env (see .env.local);
// degrade gracefully when not yet configured.
const WHATSAPP     = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
const FEEDBACK_URL = process.env.FEEDBACK_FORM_URL ?? "";

function saludo(nombreCliente?: string | null): string {
  return nombreCliente ? `Hola ${nombreCliente.split(" ")[0]},` : "Hola,";
}

/** "Cómo pagar" copy — links to WhatsApp when the number is configured. */
function comoPagarBox(): string {
  const body = WHATSAPP
    ? `Podés pagar por transferencia bancaria o billetera digital. Escribinos por WhatsApp al
       <a href="https://wa.me/${WHATSAPP}" style="color:#22244e;font-weight:600;">+${WHATSAPP}</a>
       y te pasamos los datos.`
    : `Podés pagar por transferencia bancaria o billetera digital. Escribinos por WhatsApp y te pasamos los datos.`;
  return infoBox("Cómo pagar", body, "plain");
}

export interface BuiltEmail { subject: string; html: string }

interface BaseArgs {
  nombreCliente?: string | null;
  pedidoId:       string;
}
interface CartArgs extends BaseArgs { items: EmailItemSummary[]; total: number }
interface ShipArgs extends BaseArgs { nombreNino?: string | null }

// ─── 1. Recordatorio de pago ───────────────────────────────────────────────
export function buildRecordatorioPago({ nombreCliente, pedidoId, items, total }: CartArgs): BuiltEmail {
  const html = renderEmailShell({
    preheader: "Tu pedido te está esperando — completá el pago cuando quieras.",
    heading:   "Tu tablero te está esperando 💛",
    intro:     `${saludo(nombreCliente)} dejaste tu pedido casi listo. En cuanto confirmes el pago empezamos a prepararlo.`,
    contentHtml: summaryCard(items, total) + comoPagarBox() + pedidoNumero(pedidoId),
  });
  return { subject: "Tu pedido en Minirutina te está esperando", html };
}

// ─── 2. Pedido confirmado ──────────────────────────────────────────────────
export function buildPedidoConfirmado({ nombreCliente, pedidoId, items, total }: CartArgs): BuiltEmail {
  const todosDigitales = items.length > 0 && items.every((it) => it.tipoEntrega === "digital");
  const progreso = todosDigitales
    ? infoBox("Próximo paso", "Estamos preparando tu archivo. Te lo enviamos por email apenas esté listo.")
    : timeline(1);

  const html = renderEmailShell({
    preheader: "Confirmamos tu pago. Ya empezamos a preparar tu pedido.",
    heading:   "Tu pedido está confirmado ✅",
    intro:     `${saludo(nombreCliente)} recibimos tu pago de ${fmtPyg(total)}. ${
      todosDigitales
        ? "Ya estamos preparando tu archivo."
        : "Ya empezamos a preparar tu tablero — te vamos avisando en cada paso."
    }`,
    contentHtml: progreso + summaryCard(items, total) + pedidoNumero(pedidoId),
  });
  return { subject: `Tu pedido está confirmado — Minirutina #${pedidoId.slice(0, 8).toUpperCase()}`, html };
}

// ─── 3. En camino ──────────────────────────────────────────────────────────
export function buildEnCamino({ nombreCliente, pedidoId, nombreNino }: ShipArgs): BuiltEmail {
  const content =
    timeline(2) +
    infoBox(
      "Llega pronto",
      "Tu pedido ya salió rumbo a tu dirección. Si coordinamos la entrega por WhatsApp, te escribimos para confirmar el horario.",
    ) +
    pedidoNumero(pedidoId);

  const html = renderEmailShell({
    preheader:   "Tu pedido va en camino.",
    heading:     "Tu pedido va en camino 🚚",
    intro:       `${saludo(nombreCliente)} ${nombreNino ? `el tablero de ${nombreNino}` : "tu pedido"} ya está en camino a tu dirección.`,
    contentHtml: content,
  });
  return { subject: "Tu pedido de Minirutina va en camino 🚚", html };
}

// ─── 4. Feedback ───────────────────────────────────────────────────────────
export function buildFeedback({ nombreCliente, pedidoId, nombreNino }: ShipArgs): BuiltEmail {
  const cta = FEEDBACK_URL
    ? emailButton(FEEDBACK_URL, "Dejar mi opinión")
    : `<p style="margin:0;font-size:14px;color:#22244ecc;line-height:1.6;">Respondé este email y contanos cómo te fue 💛</p>`;

  const content =
    timeline(3) +
    infoBox(
      "¿Nos contás cómo te fue?",
      `Tu opinión nos ayuda muchísimo${nombreNino ? ` — y nos encantaría saber cómo le está yendo a ${nombreNino} con su tablero` : ""}. Te toma menos de un minuto.`,
    ) +
    cta +
    `<div style="height:8px;"></div>` +
    pedidoNumero(pedidoId);

  const html = renderEmailShell({
    preheader:   "¡Tu tablero llegó! Contanos cómo te fue.",
    heading:     "¡Tu tablero llegó! 🎉",
    intro:       `${saludo(nombreCliente)} esperamos que ${nombreNino ? `${nombreNino} disfrute` : "disfruten"} su nuevo tablero. Nos encantaría saber qué te pareció.`,
    contentHtml: content,
  });
  return { subject: "¿Cómo te fue con tu tablero de Minirutina?", html };
}

// ─── Senders ────────────────────────────────────────────────────────────────
export function enviarRecordatorioPago(args: CartArgs & { to: string }) {
  const { subject, html } = buildRecordatorioPago(args);
  return sendEmail({ to: args.to, subject, html });
}
export function enviarPedidoConfirmado(args: CartArgs & { to: string }) {
  const { subject, html } = buildPedidoConfirmado(args);
  return sendEmail({ to: args.to, subject, html });
}
export function enviarEnCamino(args: ShipArgs & { to: string }) {
  const { subject, html } = buildEnCamino(args);
  return sendEmail({ to: args.to, subject, html });
}
export function enviarFeedback(args: ShipArgs & { to: string }) {
  const { subject, html } = buildFeedback(args);
  return sendEmail({ to: args.to, subject, html });
}
