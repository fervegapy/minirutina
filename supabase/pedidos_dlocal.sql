-- dLocal Go payment reference. Set by /api/dlocal/webhook (and at session
-- creation) so the admin can trace a pedido to its dLocal payment.
alter table public.pedidos
  add column if not exists dlocal_payment_id text,
  add column if not exists metodo_pago       text;   -- 'dlocal' | 'stripe' | 'manual'

create index if not exists pedidos_dlocal_idx
  on public.pedidos (dlocal_payment_id);
