import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "hola@minirutina.com";

export interface EmailAttachment {
  filename: string;
  content:  Buffer;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: `Minirutina <${EMAIL_FROM}>`,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });

  if (error) {
    console.error("[email] Error al enviar:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}
