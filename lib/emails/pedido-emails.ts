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
//   5. factura                — manual, from admin, on demand (not tied to estado)
import type { Moneda } from "@/lib/mercado";
import { isLocale, type Locale } from "@/lib/i18n";
import { nombreProducto } from "@/lib/i18n/compra";
import { sendEmail, type EmailAttachment } from "@/lib/email";
import { getSiteConfig } from "@/lib/site-config";
import {
  renderEmailShell,
  summaryCard,
  infoBox,
  emailButton,
  whatsappButton,
  timeline,
  TIMELINE_STEPS_RETIRO,
  pedidoNumero,
  fmtMonto,
  type EmailItemSummary,
} from "@/lib/emails/template";

export function productoLabel(producto: string, idioma: Locale = "es"): string {
  return nombreProducto(producto, idioma);
}

/** Idioma de un pedido: el que el checkout guardó en personalizacion.idioma
 *  de sus ítems (español si no hay, como los pedidos de antes). */
export function idiomaDePedido(items: { personalizacion?: unknown }[]): Locale {
  for (const it of items) {
    const v = (it.personalizacion as { idioma?: unknown } | null | undefined)?.idioma;
    if (isLocale(v)) return v;
  }
  return "es";
}

// Business contact + feedback destination. Filled via env (see .env.local);
// degrade gracefully when not yet configured.
const WHATSAPP     = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
const FEEDBACK_URL = process.env.FEEDBACK_FORM_URL ?? "";
// Con www: el apex redirige 307 hacia www, y estos links los abre gente con un
// pedido pendiente desde el celular. El redirect obliga a DNS, TCP y TLS nuevos
// contra otro hostname — medido, ~0,8 s antes de ver nada.
const SITE         = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.minirutina.com").replace(/\/$/, "");

// Logo for the email header — same one the website navbar/footer uses.
// Cached per process so we don't refetch site_config on every email.
let logoCache: string | null | undefined;
async function getLogoUrl(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    logoCache = (await getSiteConfig()).logo_url ?? null;
  } catch {
    logoCache = null;
  }
  return logoCache;
}

function saludo(nombreCliente?: string | null, idioma: Locale = "es"): string {
  const hola = { es: "Hola", en: "Hi", pt: "Olá" }[idioma];
  return nombreCliente ? `${hola} ${nombreCliente.split(" ")[0]},` : `${hola},`;
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
  logoUrl?:       string | null;
}
// `moneda`: la del pedido (Gs. si no se pasa). `precioPyg` de cada ítem y
// `total` vienen en esa moneda.
interface CartArgs extends BaseArgs { items: EmailItemSummary[]; total: number; moneda?: Moneda; idioma?: Locale }
interface ShipArgs extends BaseArgs { nombreNino?: string | null }
// `esRetiro` = customer chose pickup, not delivery. We never mention the
// pickup address in email — it's the team's home base — so pickup orders
// get contacted over WhatsApp for the exact spot instead.
interface EnCaminoArgs extends ShipArgs { esRetiro?: boolean }

// ─── 1. Recordatorio de pago ───────────────────────────────────────────────
export function buildRecordatorioPago({ nombreCliente, pedidoId, items, total, logoUrl }: CartArgs): BuiltEmail {
  const html = renderEmailShell({
    logoUrl,
    preheader: "Tu pedido te está esperando — completá el pago cuando quieras.",
    heading:   "Tu tablero te está esperando 💛",
    intro:     `${saludo(nombreCliente)} dejaste tu pedido casi listo. En cuanto confirmes el pago empezamos a prepararlo.`,
    contentHtml:
      summaryCard(items, total) +
      emailButton(`${SITE}/pagar/${pedidoId}`, "Completá tu pedido") +
      `<div style="height:16px;"></div>` +
      comoPagarBox() +
      whatsappButton(pedidoId, WHATSAPP) +
      pedidoNumero(pedidoId),
  });
  return { subject: "Tu pedido en Minirutina te está esperando", html };
}

// ─── 2. Pedido confirmado ──────────────────────────────────────────────────
// Two delivery variants for the digital file:
//   • conAdjuntos    → the PDF(s) travel attached to this same email (dLocal flow)
//   • downloadButtons → one "Descargá tu tablero" button per digital item
//                       (100%-coupon flow; nothing heavy runs during checkout)
export interface ConfirmadoOpts {
  conAdjuntos?:     boolean;
  downloadButtons?: { label: string; href: string }[];
}

const CONFIRMADO: Record<Locale, {
  listoTitulo: string; listoCuerpo: string;
  adjTitulo: string; adjTituloMixto: string; adjCuerpo: string; adjCuerpoMixto: string;
  proximoTitulo: string; proximoCuerpo: string;
  accionBotones: string; accionAdjuntos: string; accionPreparando: string; accionFisico: string;
  pago: (monto: string) => string; sinPago: string;
  preBotones: string; preAdjuntos: string; prePago: string;
  heading: string; asunto: (nro: string) => string;
  descargar: (nino: string) => string;
}> = {
  es: {
    listoTitulo: "Tu tablero está listo 🎉",
    listoCuerpo: "Descargá tu archivo desde el botón de abajo, listo para imprimir en casa o donde prefieras.",
    adjTitulo: "Tu archivo está listo 📎",
    adjTituloMixto: "Tu archivo digital 📎",
    adjCuerpo: "Adjuntamos tu tablero en este correo, listo para imprimir en casa o donde prefieras.",
    adjCuerpoMixto: "Adjuntamos en este correo el tablero de la versión digital. Los impresos siguen el proceso de abajo.",
    proximoTitulo: "Próximo paso",
    proximoCuerpo: "Estamos preparando tu archivo. Te lo enviamos por email apenas esté listo.",
    accionBotones: "Descargá tu tablero desde el botón de abajo.",
    accionAdjuntos: "Adjuntamos tu archivo en este correo.",
    accionPreparando: "Ya estamos preparando tu archivo.",
    accionFisico: "Ya empezamos a preparar tu tablero — te vamos avisando en cada paso.",
    pago: (m) => `recibimos tu pago de ${m}.`,
    sinPago: "confirmamos tu pedido.",
    preBotones: "Tu tablero está listo para descargar.",
    preAdjuntos: "Tu archivo está listo — lo adjuntamos en este correo.",
    prePago: "Confirmamos tu pago. Ya empezamos a preparar tu pedido.",
    heading: "Tu pedido está confirmado ✅",
    asunto: (nro) => `Tu pedido está confirmado — Minirutina #${nro}`,
    descargar: (n) => `Descargar tablero de ${n}`,
  },
  en: {
    listoTitulo: "Your chart is ready 🎉",
    listoCuerpo: "Download your file with the button below, ready to print at home or wherever you like.",
    adjTitulo: "Your file is ready 📎",
    adjTituloMixto: "Your digital file 📎",
    adjCuerpo: "Your chart is attached to this email, ready to print at home or wherever you like.",
    adjCuerpoMixto: "The digital chart is attached to this email. Printed charts follow the steps below.",
    proximoTitulo: "Next step",
    proximoCuerpo: "We're preparing your file. We'll email it to you as soon as it's ready.",
    accionBotones: "Download your chart with the button below.",
    accionAdjuntos: "Your file is attached to this email.",
    accionPreparando: "We're already preparing your file.",
    accionFisico: "We've started preparing your chart — we'll keep you posted at every step.",
    pago: (m) => `we received your payment of ${m}.`,
    sinPago: "your order is confirmed.",
    preBotones: "Your chart is ready to download.",
    preAdjuntos: "Your file is ready — it's attached to this email.",
    prePago: "Payment confirmed. We've started preparing your order.",
    heading: "Your order is confirmed ✅",
    asunto: (nro) => `Your order is confirmed — Minirutina #${nro}`,
    descargar: (n) => `Download ${n}'s chart`,
  },
  pt: {
    listoTitulo: "Seu quadro está pronto 🎉",
    listoCuerpo: "Baixe seu arquivo no botão abaixo, pronto para imprimir em casa ou onde preferir.",
    adjTitulo: "Seu arquivo está pronto 📎",
    adjTituloMixto: "Seu arquivo digital 📎",
    adjCuerpo: "Seu quadro está anexado a este e-mail, pronto para imprimir em casa ou onde preferir.",
    adjCuerpoMixto: "O quadro da versão digital está anexado a este e-mail. Os impressos seguem o processo abaixo.",
    proximoTitulo: "Próximo passo",
    proximoCuerpo: "Estamos preparando seu arquivo. Enviamos por e-mail assim que estiver pronto.",
    accionBotones: "Baixe seu quadro no botão abaixo.",
    accionAdjuntos: "Seu arquivo está anexado a este e-mail.",
    accionPreparando: "Já estamos preparando seu arquivo.",
    accionFisico: "Já começamos a preparar seu quadro — vamos avisando a cada passo.",
    pago: (m) => `recebemos seu pagamento de ${m}.`,
    sinPago: "seu pedido está confirmado.",
    preBotones: "Seu quadro está pronto para baixar.",
    preAdjuntos: "Seu arquivo está pronto — está anexado a este e-mail.",
    prePago: "Pagamento confirmado. Já começamos a preparar seu pedido.",
    heading: "Seu pedido está confirmado ✅",
    asunto: (nro) => `Seu pedido está confirmado — Minirutina #${nro}`,
    descargar: (n) => `Baixar o quadro de ${n}`,
  },
};

/** Texto del botón de descarga (flujo cupón 100 %). */
export function labelDescarga(nombreNino: string, idioma: Locale = "es"): string {
  return CONFIRMADO[idioma].descargar(nombreNino);
}

export function buildPedidoConfirmado(
  { nombreCliente, pedidoId, items, total, logoUrl, moneda, idioma = "es" }: CartArgs,
  opts: ConfirmadoOpts = {},
): BuiltEmail {
  const t = CONFIRMADO[idioma];
  const { conAdjuntos = false, downloadButtons = [] } = opts;
  const hayBotones     = downloadButtons.length > 0;
  const todosDigitales = items.length > 0 && items.every((it) => it.tipoEntrega === "digital");
  const hayDigitales   = items.some((it) => it.tipoEntrega === "digital");

  const botonesHtml = hayBotones
    ? infoBox(t.listoTitulo, t.listoCuerpo)
      + downloadButtons.map((b) => emailButton(b.href, b.label) + `<div style="height:8px;"></div>`).join("")
    : "";

  // Block describing the digital deliverable (buttons / attachment / "preparando").
  const digitalBox = hayBotones
    ? botonesHtml
    : conAdjuntos
      ? infoBox(
          todosDigitales ? t.adjTitulo : t.adjTituloMixto,
          todosDigitales ? t.adjCuerpo : t.adjCuerpoMixto,
        )
      : todosDigitales
        ? infoBox(t.proximoTitulo, t.proximoCuerpo)
        : "";

  // All-digital orders have no physical timeline; mixed/físico orders do.
  const progreso = todosDigitales ? digitalBox : (hayDigitales ? digitalBox : "") + timeline(1);

  const accion = hayBotones
    ? t.accionBotones
    : todosDigitales
      ? (conAdjuntos ? t.accionAdjuntos : t.accionPreparando)
      : t.accionFisico;
  const intro = `${saludo(nombreCliente, idioma)} ${total > 0 ? t.pago(fmtMonto(total, moneda)) : t.sinPago} ${accion}`;

  const html = renderEmailShell({
    logoUrl,
    idioma,
    preheader: hayBotones ? t.preBotones : conAdjuntos ? t.preAdjuntos : t.prePago,
    heading:   t.heading,
    intro,
    contentHtml:
      progreso +
      summaryCard(items, total, moneda, idioma) +
      whatsappButton(pedidoId, WHATSAPP, idioma) +
      pedidoNumero(pedidoId, idioma),
  });
  return { subject: t.asunto(pedidoId.slice(0, 8).toUpperCase()), html };
}

// ─── 3. En camino ──────────────────────────────────────────────────────────
export function buildEnCamino({ nombreCliente, pedidoId, nombreNino, logoUrl, esRetiro }: EnCaminoArgs): BuiltEmail {
  const quien = nombreNino ? `el tablero de ${nombreNino}` : "tu pedido";

  if (esRetiro) {
    const content =
      timeline(2, TIMELINE_STEPS_RETIRO) +
      infoBox(
        "Coordinamos el retiro",
        "Te contactamos por WhatsApp para coordinar el día y la ubicación exacta.",
      ) +
      whatsappButton(pedidoId, WHATSAPP) +
      pedidoNumero(pedidoId);

    const html = renderEmailShell({
      logoUrl,
      preheader:   "Tu tablero está listo para retirar.",
      heading:     "Tu tablero está listo para retirar 📦",
      intro:       `${saludo(nombreCliente)} ${quien} ya está listo. Te escribimos por WhatsApp para coordinar el retiro.`,
      contentHtml: content,
    });
    return { subject: "Tu pedido de Minirutina está listo para retirar 📦", html };
  }

  const content =
    timeline(2) +
    infoBox(
      "Llega pronto",
      "Tu pedido ya salió rumbo a tu dirección. Si coordinamos la entrega por WhatsApp, te escribimos para confirmar el horario.",
    ) +
    whatsappButton(pedidoId, WHATSAPP) +
    pedidoNumero(pedidoId);

  const html = renderEmailShell({
    logoUrl,
    preheader:   "Tu pedido va en camino.",
    heading:     "Tu pedido va en camino 🚚",
    intro:       `${saludo(nombreCliente)} ${quien} ya está en camino a tu dirección.`,
    contentHtml: content,
  });
  return { subject: "Tu pedido de Minirutina va en camino 🚚", html };
}

// ─── 4. Feedback ───────────────────────────────────────────────────────────
export function buildFeedback({ nombreCliente, pedidoId, nombreNino, logoUrl }: ShipArgs): BuiltEmail {
  // Primary CTA always present. Points to the feedback form when configured,
  // otherwise to the site contact page as a safe interim destination. When it's
  // the Tally form, append the short order number so it lands in the form's
  // hidden "pedido" field and each response ties back to its order.
  const nro = pedidoId.slice(0, 8).toUpperCase();
  const destino = FEEDBACK_URL
    ? `${FEEDBACK_URL}${FEEDBACK_URL.includes("?") ? "&" : "?"}pedido=${nro}`
    : `${SITE}/contacto`;

  const content =
    timeline(3) +
    infoBox(
      "¿Nos contás cómo te fue?",
      `Tu opinión nos ayuda muchísimo${nombreNino ? ` — y nos encantaría saber cómo le está yendo a ${nombreNino} con su tablero` : ""}. Te toma menos de un minuto.`,
    ) +
    emailButton(destino, "Dejar mi opinión") +
    `<div style="height:8px;"></div>` +
    whatsappButton(pedidoId, WHATSAPP) +
    pedidoNumero(pedidoId);

  const html = renderEmailShell({
    logoUrl,
    preheader:   "¡Tu tablero llegó! Contanos cómo te fue.",
    heading:     "¡Tu tablero llegó! 🎉",
    intro:       `${saludo(nombreCliente)} esperamos que ${nombreNino ? `${nombreNino} disfrute` : "disfruten"} su nuevo tablero. Nos encantaría saber qué te pareció.`,
    contentHtml: content,
  });
  return { subject: "¿Cómo te fue con tu tablero de Minirutina?", html };
}

// ─── 5. Factura ─────────────────────────────────────────────────────────────
// Manual, from admin — sent whenever the team uploads the invoice for a
// pedido that requested facturación. `facturaUrl` is a signed Storage URL
// generated fresh at send time (see actions.ts) so it's always valid for
// however long the link stays live.
interface FacturaArgs extends BaseArgs { facturaUrl: string }
export function buildFactura({ nombreCliente, pedidoId, facturaUrl, logoUrl }: FacturaArgs): BuiltEmail {
  const content =
    infoBox("Tu factura está lista 🧾", "Adjuntamos el link para que la descargues cuando quieras.") +
    emailButton(facturaUrl, "Ver factura") +
    `<div style="height:8px;"></div>` +
    whatsappButton(pedidoId, WHATSAPP) +
    pedidoNumero(pedidoId);

  const html = renderEmailShell({
    logoUrl,
    preheader:   "Tu factura ya está disponible.",
    heading:     "Tu factura está lista 🧾",
    intro:       `${saludo(nombreCliente)} te dejamos la factura de tu pedido en Minirutina.`,
    contentHtml: content,
  });
  return { subject: `Tu factura — Minirutina #${pedidoId.slice(0, 8).toUpperCase()}`, html };
}

// ─── Senders (fetch logo, then dispatch) ─────────────────────────────────────
export async function enviarRecordatorioPago(args: CartArgs & { to: string }) {
  const { subject, html } = buildRecordatorioPago({ ...args, logoUrl: await getLogoUrl() });
  return sendEmail({ to: args.to, subject, html });
}
export async function enviarPedidoConfirmado(
  args: CartArgs & {
    to: string;
    attachments?:    EmailAttachment[];
    downloadButtons?: { label: string; href: string }[];
  },
) {
  const attachments = args.attachments ?? [];
  const { subject, html } = buildPedidoConfirmado(
    { ...args, logoUrl: await getLogoUrl() },
    { conAdjuntos: attachments.length > 0, downloadButtons: args.downloadButtons },
  );
  return sendEmail({ to: args.to, subject, html, attachments });
}
export async function enviarEnCamino(args: EnCaminoArgs & { to: string }) {
  const { subject, html } = buildEnCamino({ ...args, logoUrl: await getLogoUrl() });
  return sendEmail({ to: args.to, subject, html });
}
export async function enviarFeedback(args: ShipArgs & { to: string }) {
  const { subject, html } = buildFeedback({ ...args, logoUrl: await getLogoUrl() });
  return sendEmail({ to: args.to, subject, html });
}
export async function enviarFactura(args: FacturaArgs & { to: string }) {
  const { subject, html } = buildFactura({ ...args, logoUrl: await getLogoUrl() });
  return sendEmail({ to: args.to, subject, html });
}
