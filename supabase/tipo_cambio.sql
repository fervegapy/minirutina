-- Historical exchange rate from PYG (Guaraní) to whatever currency Stripe
-- charges in (usually USD). Each admin update creates a NEW row — we never
-- overwrite — so old pedidos always reflect the rate that was active at
-- the moment they were paid.
--
-- The "current" rate is the row with the latest vigente_desde that's
-- already <= now().

create table if not exists public.tipo_cambio (
  id              uuid primary key default gen_random_uuid(),
  moneda_origen   text   not null default 'PYG',
  moneda_destino  text   not null default 'USD',
  tasa            numeric(12, 4) not null,    -- e.g. 7300.0000 = 1 USD = 7300 PYG
  vigente_desde   timestamptz not null default now(),
  notas           text,
  creado_por      text,                       -- admin email that set it
  created_at      timestamptz not null default now()
);

create index if not exists tipo_cambio_vigente_idx
  on public.tipo_cambio (moneda_origen, moneda_destino, vigente_desde desc);

-- RLS — public read so the public checkout can look up the current rate,
-- authenticated write so only logged-in admins can record new rates.
alter table public.tipo_cambio enable row level security;

drop policy if exists "tipo_cambio public read" on public.tipo_cambio;
create policy "tipo_cambio public read"
  on public.tipo_cambio for select using (true);

drop policy if exists "tipo_cambio auth insert" on public.tipo_cambio;
create policy "tipo_cambio auth insert"
  on public.tipo_cambio for insert
  with check (auth.role() = 'authenticated');

-- Snapshot the rate on the pedido so historical reports stay accurate
-- even when admins update the rate later.
alter table public.pedidos
  add column if not exists tipo_cambio_usado numeric(12, 4),
  add column if not exists moneda_pago       text;

-- Seed with the env-var default so the system has a working rate from
-- minute one. Tweak from /admin/tipo-cambio after applying.
insert into public.tipo_cambio (moneda_origen, moneda_destino, tasa, notas)
select 'PYG', 'USD', 7300, 'Inicial (seed). Editar desde /admin/tipo-cambio.'
where not exists (
  select 1 from public.tipo_cambio
  where moneda_origen = 'PYG' and moneda_destino = 'USD'
);
