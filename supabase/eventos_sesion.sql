-- Tracking table for the conversion funnel. Run this once in the
-- Supabase SQL editor.
--
-- Stores anonymous session-scoped events. session_id is a random UUID
-- generated client-side and persisted in localStorage; no personal info
-- is captured until the user voluntarily fills the checkout form, at
-- which point we store their email/whatsapp in the `data` jsonb of the
-- `checkout_filled` event so the operator can follow up.

create table if not exists public.eventos_sesion (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  session_id  text not null,
  evento      text not null,
  producto    text,
  paso        text,
  data        jsonb,
  pedido_id   uuid references public.pedidos(id) on delete set null
);

create index if not exists eventos_sesion_session_idx on public.eventos_sesion(session_id);
create index if not exists eventos_sesion_evento_idx  on public.eventos_sesion(evento);
create index if not exists eventos_sesion_created_idx on public.eventos_sesion(created_at desc);

-- Allow anon inserts (the customer-facing pages need to write events).
-- Reads stay restricted to authenticated admin clients.
alter table public.eventos_sesion enable row level security;

drop policy if exists "anon can insert events" on public.eventos_sesion;
create policy "anon can insert events"
  on public.eventos_sesion
  for insert
  to anon
  with check (true);

drop policy if exists "authenticated can read events" on public.eventos_sesion;
create policy "authenticated can read events"
  on public.eventos_sesion
  for select
  to authenticated
  using (true);
