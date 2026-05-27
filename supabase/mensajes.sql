-- Mensajes del formulario de contacto.
--
-- Cada submission del form en /contacto guarda una fila acá. La API route
-- también dispara un email a soporte@minirutina.com via Resend. El admin
-- los ve en /admin/mensajes y los marca como leídos / respondidos.

create table if not exists public.mensajes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text   not null,
  email         text   not null,
  mensaje       text   not null,
  ip            text,
  user_agent    text,
  leido         boolean not null default false,
  respondido    boolean not null default false,
  notas_admin   text,
  created_at    timestamptz not null default now()
);

create index if not exists mensajes_created_idx
  on public.mensajes (created_at desc);

create index if not exists mensajes_unread_idx
  on public.mensajes (created_at desc) where leido = false;

-- Rate-limit lookup support (we filter recent submissions by ip + email).
create index if not exists mensajes_recent_idx
  on public.mensajes (ip, created_at desc);

-- RLS — anyone can INSERT (the public contact form), but only authenticated
-- admins can SELECT / UPDATE / DELETE.
alter table public.mensajes enable row level security;

drop policy if exists "mensajes public insert" on public.mensajes;
create policy "mensajes public insert"
  on public.mensajes for insert
  with check (true);

drop policy if exists "mensajes auth select" on public.mensajes;
create policy "mensajes auth select"
  on public.mensajes for select
  using (auth.role() = 'authenticated');

drop policy if exists "mensajes auth update" on public.mensajes;
create policy "mensajes auth update"
  on public.mensajes for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "mensajes auth delete" on public.mensajes;
create policy "mensajes auth delete"
  on public.mensajes for delete
  using (auth.role() = 'authenticated');
