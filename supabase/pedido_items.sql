-- Multi-item cart support.
--
-- Before: 1 pedido = 1 producto. The product columns (producto,
-- nombre_nino, color_acento, personalizacion, tipo_entrega) lived on
-- the pedido row.
--
-- After: 1 pedido = an ORDER (contacto, dirección, totales, pago, cupón).
-- The actual products are rows in pedido_items, one per cart item, each
-- with its own personalization + format + price.
--
-- Legacy pedidos are backfilled: each existing pedido gets one matching
-- pedido_items row with its current product info, so all existing admin
-- views keep working transparently.

create table if not exists public.pedido_items (
  id            uuid primary key default gen_random_uuid(),
  pedido_id     uuid not null references public.pedidos(id) on delete cascade,
  producto      text not null,                  -- 'rutinas' | 'recompensas'
  nombre_nino   text not null,
  color_acento  text not null,
  personalizacion jsonb not null,
  tipo_entrega  text not null check (tipo_entrega in ('fisico', 'digital')),
  precio_pyg    int  not null,                  -- snapshot at order time
  orden         int  not null default 0,        -- display order within the pedido
  created_at    timestamptz not null default now()
);

create index if not exists pedido_items_pedido_idx
  on public.pedido_items (pedido_id, orden);

alter table public.pedido_items enable row level security;

-- Public can INSERT (the anon checkout flow uses the regular client to
-- write items alongside the pedido). The server-side checkout endpoint
-- uses the service role anyway, so this is for the legacy path.
drop policy if exists "pedido_items public insert" on public.pedido_items;
create policy "pedido_items public insert"
  on public.pedido_items for insert with check (true);

drop policy if exists "pedido_items auth read" on public.pedido_items;
create policy "pedido_items auth read"
  on public.pedido_items for select using (auth.role() = 'authenticated');

drop policy if exists "pedido_items auth all" on public.pedido_items;
create policy "pedido_items auth all"
  on public.pedido_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Backfill: for every existing pedido, create exactly one pedido_items
-- row mirroring its product info. Idempotent — only inserts when the
-- pedido has no items yet.
insert into public.pedido_items (
  pedido_id, producto, nombre_nino, color_acento,
  personalizacion, tipo_entrega, precio_pyg, orden, created_at
)
select
  p.id,
  p.producto,
  p.nombre_nino,
  p.color_acento,
  p.personalizacion,
  p.tipo_entrega,
  -- We don't know the exact historical price; use precios.precio_impreso
  -- as a best-effort snapshot, falling back to 0 if missing.
  coalesce(
    (select pr.precio_impreso from public.precios pr where pr.producto = p.producto),
    0
  ) as precio_pyg,
  0 as orden,
  p.created_at
from public.pedidos p
where not exists (
  select 1 from public.pedido_items pi where pi.pedido_id = p.id
);

-- Make the legacy single-product columns on pedidos nullable so future
-- orders don't need to populate them (they live on pedido_items now).
-- We keep them for now — old admin / PDF code paths still read them as
-- a fallback. They can be dropped later once everything reads from
-- pedido_items.
alter table public.pedidos alter column producto       drop not null;
alter table public.pedidos alter column nombre_nino    drop not null;
alter table public.pedidos alter column color_acento   drop not null;
alter table public.pedidos alter column personalizacion drop not null;
alter table public.pedidos alter column tipo_entrega   drop not null;
