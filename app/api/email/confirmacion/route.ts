import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas:     "Tablero de Rutinas",
  semana:      "Plan de la Semana",
  recompensas: "Tablero de Recompensas",
};

function fmt(n: number) {
  return "Gs. " + n.toLocaleString("es-PY");
}

function buildHtml({
  nombreNino,
  producto,
  tipoEntrega,
  modalidad,
  total,
  pedidoId,
}: {
  nombreNino: string;
  producto: string;
  tipoEntrega: "fisico" | "digital";
  modalidad?: "pickup" | "delivery";
  total: number;
  pedidoId: string;
}) {
  const nombreProducto = NOMBRE_PRODUCTO[producto] ?? producto;
  const esDigital = tipoEntrega === "digital";

  const entregaTexto = esDigital
    ? "🖥️ Versión digital (te lo enviamos por email)"
    : modalidad === "delivery"
    ? "📦 Impreso con envío a domicilio (3-5 días hábiles)"
    : "🏪 Impreso con retiro en Villamorra, Asunción";

  const proximoPaso = esDigital
    ? "Una vez confirmado el pago te enviamos el archivo listo para imprimir."
    : "Una vez confirmado el pago preparamos tu tablero y te avisamos cuando esté listo.";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pedido recibido — Minirutina</title>
</head>
<body style="margin:0;padding:0;background:#fffef6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#233933;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffef6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo / header -->
          <tr>
            <td style="background:#233933;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#ecbc5d;letter-spacing:-0.5px;">
                Minirutina
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">
                Tableros personalizados para niños
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              <p style="margin:0 0 8px;font-size:22px;font-weight:700;">
                ¡Tu pedido fue recibido! 🎉
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#233933cc;line-height:1.6;">
                Hola, recibimos tu pedido del <strong>${nombreProducto}</strong> para
                <strong>${nombreNino}</strong>. Estamos muy contentos de ayudarte a organizar
                la rutina de tu pequeño.
              </p>

              <!-- Resumen del pedido -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fffef6;border:1px solid #e5e7eb;border-radius:12px;padding:0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#23393355;">
                      Resumen del pedido
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:14px;color:#233933cc;padding:4px 0;">Producto</td>
                        <td align="right" style="font-size:14px;font-weight:600;color:#233933;padding:4px 0;">${nombreProducto}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#233933cc;padding:4px 0;">Para</td>
                        <td align="right" style="font-size:14px;font-weight:600;color:#233933;padding:4px 0;">${nombreNino}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#233933cc;padding:4px 0;">Entrega</td>
                        <td align="right" style="font-size:14px;font-weight:600;color:#233933;padding:4px 0;">${entregaTexto}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:8px 0;">
                          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;font-weight:700;color:#233933;padding:4px 0;">Total</td>
                        <td align="right" style="font-size:18px;font-weight:800;color:#233933;padding:4px 0;">${fmt(total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Próximo paso -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#ecbc5d22;border:1px solid #ecbc5d55;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#23393355;">
                      Próximo paso
                    </p>
                    <p style="margin:0;font-size:14px;color:#233933cc;line-height:1.6;">
                      ${proximoPaso}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Pago -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#23393355;">
                      Cómo pagar
                    </p>
                    <p style="margin:0;font-size:14px;color:#233933cc;line-height:1.6;">
                      Podés pagar por transferencia bancaria o billetera digital.
                      Escribinos por WhatsApp al
                      <a href="https://wa.me/595981000000" style="color:#233933;font-weight:600;">+595 981 000 000</a>
                      y te confirmamos los datos.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#23393366;">
                Número de pedido: <code style="font-size:12px;background:#f3f4f6;padding:2px 6px;border-radius:4px;">${pedidoId.slice(0, 8).toUpperCase()}</code>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#23393366;line-height:1.6;">
                Minirutina · Villamorra, Asunción, Paraguay<br />
                <a href="https://minirutina.com" style="color:#233933;text-decoration:none;">minirutina.com</a>
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nombreNino, producto, tipoEntrega, modalidad, total, pedidoId } = body;

    // Si no hay email no hacemos nada (cliente solo puso WhatsApp).
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const html = buildHtml({ nombreNino, producto, tipoEntrega, modalidad, total, pedidoId });

    const result = await sendEmail({
      to: email,
      subject: `Tu pedido de Minirutina fue recibido 🎉`,
      html,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (e) {
    console.error("[email/confirmacion]", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
