-- Tracks the invoice (factura) uploaded by the admin and sent to the
-- customer. We store the STORAGE PATH (not a signed URL, which expires) so
-- a fresh signed URL can always be generated on demand — for the email CTA
-- and for the admin's "Ver factura actual" link.
alter table public.pedidos
  add column if not exists factura_path       text,
  add column if not exists factura_enviada_at timestamptz;
