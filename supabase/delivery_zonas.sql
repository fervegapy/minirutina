-- Zonas de delivery con precio por zona. Cada zona agrupa una lista de
-- ciudades (string match). Una zona se marca como default para cualquier
-- ciudad que no esté en otra zona (típicamente "Interior" / otras).
--
-- Edición desde /admin/delivery.

create table if not exists public.delivery_zonas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text   not null,
  precio      int    not null,                  -- en Guaraníes
  ciudades    text[] not null default '{}',     -- lista de nombres de ciudad
  es_default  boolean not null default false,   -- una sola zona puede ser default
  orden       int    not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Solo una zona puede ser default a la vez.
create unique index if not exists delivery_zonas_default_unique
  on public.delivery_zonas ((es_default)) where es_default = true;

-- RLS — public read so checkout can compute the price; auth write only.
alter table public.delivery_zonas enable row level security;

drop policy if exists "delivery_zonas public read" on public.delivery_zonas;
create policy "delivery_zonas public read"
  on public.delivery_zonas for select using (true);

drop policy if exists "delivery_zonas auth write" on public.delivery_zonas;
create policy "delivery_zonas auth write"
  on public.delivery_zonas for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed razonable: dos zonas para arrancar.
insert into public.delivery_zonas (nombre, precio, ciudades, es_default, orden)
select 'Asunción y Gran Asunción', 35000,
       array['Asunción', 'Lambaré', 'Fernando de la Mora', 'San Lorenzo', 'Luque',
             'Mariano Roque Alonso', 'Villa Elisa', 'Ñemby', 'Capiatá', 'Limpio',
             'San Antonio', 'Ypané', 'Itauguá', 'Areguá'],
       false, 1
where not exists (select 1 from public.delivery_zonas where nombre = 'Asunción y Gran Asunción');

insert into public.delivery_zonas (nombre, precio, ciudades, es_default, orden)
select 'Interior del país', 65000, '{}', true, 99
where not exists (select 1 from public.delivery_zonas where es_default = true);

-- Snapshot del costo de delivery en cada pedido — para que reportes
-- históricos no cambien si después subís/bajás precios.
alter table public.pedidos
  add column if not exists costo_envio  int,
  add column if not exists envio_zona   text,
  add column if not exists envio_calle  text,
  add column if not exists envio_numero text,
  add column if not exists envio_referencia text;
