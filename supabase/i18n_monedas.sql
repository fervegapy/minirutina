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
