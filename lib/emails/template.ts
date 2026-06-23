// Shared branded email building blocks. All emails to the customer go
// through `renderEmailShell` so the header / footer / palette stay
// consistent with the website (cream #faf6e7, deep #22244e, blue #336aea).
//
// Everything here is plain string HTML with inline styles + table layout —
// the only thing email clients (Gmail, Outlook, Apple Mail) render reliably.

const BG      = "#faf6e7";
const DARK    = "#22244e";
const BLUE    = "#336aea";
const BORDER  = "#e5e7eb";
const MUTED   = "#22244ecc";

export interface EmailItemSummary {
  productoLabel: string;
  nombreNino:    string;
  tipoEntrega:   "fisico" | "digital";
  precioPyg:     number;
}

export function fmtPyg(n: number): string {
  return "Gs. " + Math.round(n).toLocaleString("es-PY");
}

/** Full HTML document wrapping the given inner content with header + footer. */
export function renderEmailShell({
  preheader = "",
  heading,
  intro,
  contentHtml,
}: {
  preheader?: string;
  heading: string;
  intro?: string;
  contentHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Minirutina</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${DARK};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${DARK};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:${BLUE};letter-spacing:-0.5px;">
                Minirutina
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">
                Tableros personalizados para niños
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
              <p style="margin:0 0 ${intro ? "8px" : "24px"};font-size:22px;font-weight:700;color:${DARK};">
                ${heading}
              </p>
              ${intro ? `<p style="margin:0 0 24px;font-size:15px;color:${MUTED};line-height:1.6;">${intro}</p>` : ""}
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid ${BORDER};border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#22244e66;line-height:1.6;">
                Minirutina · Villamorra, Asunción, Paraguay<br />
                <a href="https://minirutina.com" style="color:${DARK};text-decoration:none;">minirutina.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Solid blue CTA button. */
export function emailButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0;"><tr><td
    style="background:${BLUE};border-radius:10px;">
    <a href="${href}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${label}</a>
  </td></tr></table>`;
}

/** Order summary card: lists each item + total. */
export function summaryCard(items: EmailItemSummary[], total: number): string {
  const rows = items.map((it) => `
    <tr>
      <td style="font-size:14px;color:${MUTED};padding:6px 0;line-height:1.4;">
        ${it.productoLabel}<br />
        <span style="color:#22244e88;font-size:12px;">Para ${it.nombreNino} · ${it.tipoEntrega === "digital" ? "Digital" : "Impreso"}</span>
      </td>
      <td align="right" style="font-size:14px;font-weight:600;color:${DARK};padding:6px 0;white-space:nowrap;">${fmtPyg(it.precioPyg)}</td>
    </tr>`).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0"
    style="background:${BG};border:1px solid ${BORDER};border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#22244e55;">
        Resumen del pedido
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${rows}
        <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid ${BORDER};margin:0;" /></td></tr>
        <tr>
          <td style="font-size:15px;font-weight:700;color:${DARK};padding:4px 0;">Total</td>
          <td align="right" style="font-size:18px;font-weight:800;color:${DARK};padding:4px 0;">${fmtPyg(total)}</td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

/** Generic tinted info box (próximo paso, cómo pagar, etc.). */
export function infoBox(title: string, bodyHtml: string, tint: "blue" | "plain" = "blue"): string {
  const style = tint === "blue"
    ? `background:${BLUE}22;border:1px solid ${BLUE}55;`
    : `background:#ffffff;border:1px solid ${BORDER};`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="${style}border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:18px 24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#22244e55;">${title}</p>
      <p style="margin:0;font-size:14px;color:${MUTED};line-height:1.6;">${bodyHtml}</p>
    </td></tr>
  </table>`;
}

/** Order number chip. */
export function pedidoNumero(pedidoId: string): string {
  return `<p style="margin:0;font-size:13px;color:#22244e66;">
    Número de pedido:
    <code style="font-size:12px;background:#f3f4f6;padding:2px 6px;border-radius:4px;">${pedidoId.slice(0, 8).toUpperCase()}</code>
  </p>`;
}

// ─── Delivery progress timeline ────────────────────────────────────────────
// Three steps: producción → camino a la entrega → entregado.
// `active` is the 1-based index of the CURRENT step; earlier steps render as
// completed (✓ filled), later steps as pending (gray).
const TIMELINE_STEPS = ["En producción", "Camino a la entrega", "Entregado"];

export function timeline(active: 1 | 2 | 3): string {
  const cells = TIMELINE_STEPS.map((label, i) => {
    const step = i + 1;
    const done    = step < active;
    const current = step === active;
    const circleBg     = done || current ? BLUE : "#eef0f2";
    const circleColor  = done || current ? "#ffffff" : "#22244e55";
    const circleText   = done ? "✓" : String(step);
    const labelColor   = current ? DARK : done ? "#22244e99" : "#22244e55";
    const labelWeight  = current ? "700" : "600";
    return `<td width="33%" align="center" valign="top" style="padding:0 4px;">
      <div style="width:32px;height:32px;line-height:32px;border-radius:50%;background:${circleBg};color:${circleColor};font-size:14px;font-weight:700;margin:0 auto 8px;text-align:center;">${circleText}</div>
      <p style="margin:0;font-size:12px;font-weight:${labelWeight};color:${labelColor};line-height:1.3;">${label}</p>
    </td>`;
  }).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0"
    style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:22px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
    </td></tr>
  </table>`;
}
