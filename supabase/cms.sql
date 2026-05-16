-- CMS tables: product activation, FAQs, testimonios.
-- Run once in the Supabase SQL editor.

-- ─── productos_config ────────────────────────────────────────────────────────
create table if not exists public.productos_config (
  producto    text primary key,
  activo      boolean not null default true,
  updated_at  timestamptz not null default now()
);

insert into public.productos_config (producto, activo) values
  ('rutinas', true),
  ('recompensas', true)
on conflict (producto) do nothing;

-- ─── faqs ─────────────────────────────────────────────────────────────────────
create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  producto    text not null,
  pregunta    text not null,
  respuesta   text not null,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists faqs_producto_idx on public.faqs(producto, orden);

-- Seed with the FAQs that were hardcoded in lib/productos.ts.
-- Skipped if the table already has rows so re-running is idempotent.
insert into public.faqs (producto, pregunta, respuesta, orden)
select 'rutinas', p, r, o
from (values
  (1, '¿En cuánto tiempo llega?',  'Entre 3 y 5 días hábiles desde que confirmamos el pago. Te mandamos el seguimiento por WhatsApp.'),
  (2, '¿Qué tamaño tiene?',         'A4 (21x29cm) por defecto. Si querés A3, avisanos por WhatsApp antes de confirmar el pedido.'),
  (3, '¿Necesita marco?',           'No. Viene listo para colgar con cinta doble faz o imanes de heladera. Aunque en una moldura queda muy lindo.'),
  (4, '¿Puedo pedir más de uno?',   'Sí, y hacemos precio especial a partir de 2 unidades. Escribinos por WhatsApp.')
) as t(o, p, r)
where not exists (select 1 from public.faqs where producto = 'rutinas');

insert into public.faqs (producto, pregunta, respuesta, orden)
select 'recompensas', p, r, o
from (values
  (1, '¿Cuántas estrellas recomiendan?',     'Para niños menores de 5 años, 5 estrellas. Para 5-7 años, 10. Para mayores de 7, 15. La idea es que el premio no tarde demasiado.'),
  (2, '¿Cómo marcan las estrellas?',          'El tablero viene con espacios para pegar stickers (los más populares son los de estrellitas doradas), o podés usar un marcador de pizarra si lo plastificás extra.'),
  (3, '¿Se puede usar para más de un hábito?', 'El tablero está pensado para un hábito o comportamiento a la vez. Para múltiples hábitos, recomendamos el Tablero de Rutinas.'),
  (4, '¿En cuánto tiempo llega?',             'Entre 3 y 5 días hábiles desde que confirmamos el pago.')
) as t(o, p, r)
where not exists (select 1 from public.faqs where producto = 'recompensas');

-- ─── testimonios ──────────────────────────────────────────────────────────────
create table if not exists public.testimonios (
  id          uuid primary key default gen_random_uuid(),
  texto       text not null,
  autor       text not null,
  activo      boolean not null default true,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists testimonios_activo_orden_idx on public.testimonios(activo, orden);

-- Seed with the testimonial that was hardcoded in components/landing/Testimonial.tsx
insert into public.testimonios (texto, autor, orden, activo)
select t, a, 1, true
from (values
  ('Después de dos semanas con el tablero, Tomás ya no me discute para vestirse. Se levanta, mira el tablero y va. Es magia.',
   'Mamá de Tomás, 4 años — Asunción')
) as v(t, a)
where not exists (select 1 from public.testimonios);

-- ─── RLS: anon reads (public pages), authenticated writes (admin) ────────────
alter table public.productos_config enable row level security;
alter table public.faqs               enable row level security;
alter table public.testimonios        enable row level security;

drop policy if exists "anon read productos_config" on public.productos_config;
create policy "anon read productos_config"
  on public.productos_config for select to anon using (true);

drop policy if exists "auth write productos_config" on public.productos_config;
create policy "auth write productos_config"
  on public.productos_config for all to authenticated using (true) with check (true);

drop policy if exists "anon read faqs" on public.faqs;
create policy "anon read faqs"
  on public.faqs for select to anon using (true);

drop policy if exists "auth write faqs" on public.faqs;
create policy "auth write faqs"
  on public.faqs for all to authenticated using (true) with check (true);

drop policy if exists "anon read testimonios" on public.testimonios;
create policy "anon read testimonios"
  on public.testimonios for select to anon using (true);

drop policy if exists "auth write testimonios" on public.testimonios;
create policy "auth write testimonios"
  on public.testimonios for all to authenticated using (true) with check (true);

-- And while we're here: precios should be readable by anon too (used in checkout)
alter table public.precios enable row level security;

drop policy if exists "anon read precios" on public.precios;
create policy "anon read precios"
  on public.precios for select to anon using (true);

drop policy if exists "auth write precios" on public.precios;
create policy "auth write precios"
  on public.precios for all to authenticated using (true) with check (true);
