-- Idiomas y monedas por país: Paraguay (Gs., impreso + digital), Argentina
-- (ARS), Brasil (BRL) y resto del mundo (USD) — fuera de Paraguay solo se
-- vende el digital. Ver lib/mercado.ts.
--
-- Correr manualmente en el SQL editor de Supabase. Todo es aditivo: no
-- rompe filas ni código existente.

-- Precios del digital en cada moneda, fijados por el admin en /admin/cms
-- (NO se calculan desde Gs.). NULL = no configurado → ese producto no se
-- ofrece en esa moneda hasta que se cargue.
alter table public.precios
  add column if not exists precio_digital_ars    numeric,
  add column if not exists precio_digital_20_ars numeric,
  add column if not exists precio_digital_brl    numeric,
  add column if not exists precio_digital_20_brl numeric,
  add column if not exists precio_digital_usd    numeric,
  add column if not exists precio_digital_20_usd numeric;

-- Moneda e idioma del pedido: se fijan al crearlo (antes de pagar), así el
-- admin distingue un pedido en Gs. de uno en BRL aunque siga pendiente.
alter table public.pedidos
  add column if not exists moneda_pedido text not null default 'PYG',
  add column if not exists idioma        text not null default 'es';

alter table public.pedidos drop constraint if exists pedidos_moneda_pedido_check;
alter table public.pedidos
  add constraint pedidos_moneda_pedido_check check (moneda_pedido in ('PYG', 'ARS', 'BRL', 'USD'));

-- Precio de cada ítem en la moneda del pedido (paralelo a precio_pyg, que
-- en los pedidos de afuera queda en 0).
alter table public.pedido_items
  add column if not exists precio_moneda numeric;

-- ─── Tipo de cambio diario (USD → ARS / BRL) ────────────────────────────────
-- Los precios de afuera se fijan en USD; ARS y BRL se calculan desde el USD
-- con la tasa del día, redondeados (ver lib/mercado.ts). La carga una tarea
-- diaria de Vercel (app/api/cron/tipo-cambio). Una fila por moneda y día.
create table if not exists public.tasas_usd (
  moneda     text        not null check (moneda in ('ARS', 'BRL')),
  fecha      date        not null,
  tasa       numeric     not null check (tasa > 0),  -- unidades de `moneda` por 1 USD
  fuente     text,
  created_at timestamptz not null default now(),
  primary key (moneda, fecha)
);

-- Lectura pública (el checkout calcula el precio en el navegador); escritura
-- solo con la service role (la tarea diaria).
alter table public.tasas_usd enable row level security;
drop policy if exists "tasas_usd lectura publica" on public.tasas_usd;
create policy "tasas_usd lectura publica" on public.tasas_usd for select using (true);

-- Precios en USD de arranque (editables en /admin/cms). Solo si están vacíos.
update public.precios set precio_digital_usd = 17
  where producto = 'rutinas' and precio_digital_usd is null;
update public.precios set precio_digital_usd = 14, precio_digital_20_usd = 14
  where producto = 'recompensas' and precio_digital_usd is null;
