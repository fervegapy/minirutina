-- Sistema de cupones de descuento.
--
-- cupones      → definición de cada código (tipo, valor, vigencia, topes, usos)
-- cupon_usos   → un registro por cada vez que se aplica un cupón en un pago
--                exitoso (para monitoreo / campañas con creadores).

create table if not exists public.cupones (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null,
  tipo            text not null check (tipo in ('monto', 'porcentaje')),
  valor           numeric not null,            -- Gs. si tipo='monto', % si tipo='porcentaje'
  tope_descuento  int,                          -- tope en Gs. (solo aplica a %). null = sin tope
  monto_minimo    int,                          -- compra mínima para aplicar. null = sin mínimo
  vigencia_desde  timestamptz,                  -- null = desde siempre
  vigencia_hasta  timestamptz,                  -- null = sin vencimiento
  max_usos        int,                          -- null = ilimitado. 1 = un solo uso
  usos            int not null default 0,       -- contador de usos exitosos
  activo          boolean not null default true,
  descripcion     text,                          -- ej. "Campaña @creador, IG mayo"
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Código único, case-insensitive (guardamos siempre en MAYÚSCULAS).
create unique index if not exists cupones_codigo_unique
  on public.cupones (upper(codigo));

create table if not exists public.cupon_usos (
  id               uuid primary key default gen_random_uuid(),
  cupon_id         uuid references public.cupones(id) on delete set null,
  codigo           text not null,
  pedido_id        uuid,
  email            text,
  monto_original   int not null,
  monto_descuento  int not null,
  monto_final      int not null,
  created_at       timestamptz not null default now()
);

create index if not exists cupon_usos_cupon_idx on public.cupon_usos (cupon_id, created_at desc);
create index if not exists cupon_usos_codigo_idx on public.cupon_usos (codigo, created_at desc);

-- Snapshot del cupón aplicado en cada pedido.
alter table public.pedidos
  add column if not exists cupon_codigo    text,
  add column if not exists cupon_descuento int;

-- RLS. La validación pública y el cobro se hacen con el service role
-- (bypassa RLS), así que NO exponemos la lista de cupones al anon. Solo
-- damos lectura/escritura a usuarios autenticados (admin UI).
alter table public.cupones    enable row level security;
alter table public.cupon_usos enable row level security;

drop policy if exists "cupones auth all" on public.cupones;
create policy "cupones auth all" on public.cupones for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "cupon_usos auth read" on public.cupon_usos;
create policy "cupon_usos auth read" on public.cupon_usos for select
  using (auth.role() = 'authenticated');
