// Pedidos store contact info as a single string built at checkout, e.g.
// "Email: foo@bar.com · WhatsApp: 0981 123 456". These helpers extract the
// individual pieces and produce a wa.me-friendly phone number.

export function extraerEmail(contacto: string | null | undefined): string | null {
  if (!contacto) return null;
  const m = contacto.match(/Email:\s*([^\s·]+)/i);
  return m?.[1]?.trim() ?? null;
}

export function extraerWhatsapp(contacto: string | null | undefined): string | null {
  if (!contacto) return null;
  // Capture digits/spaces/dashes/parens/plus after "WhatsApp:" until the next separator
  const m = contacto.match(/WhatsApp:\s*([+\d\s()\-]+)/i);
  if (!m) return null;
  return m[1].trim();
}

// Returns the digits-only phone number with the Paraguay country code
// prepended (when missing). wa.me requires international format without "+".
export function whatsappParaWaMe(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Already starts with 595? leave it. Otherwise prepend it (typical Paraguay
  // local numbers start with 09xx). Strip a leading 0 first if present.
  if (digits.startsWith("595")) return digits;
  const trimmed = digits.replace(/^0+/, "");
  return `595${trimmed}`;
}

export function waMeUrl(numero: string | null, mensaje: string): string | null {
  const num = whatsappParaWaMe(numero);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
}
