-- Single-row configuration table for dLocal Go credentials and mode.
-- Lets the admin switch sandbox ↔ producción and embedded ↔ redirect
-- without editing Vercel env vars.

create table if not exists public.dlocal_config (
  id                       int primary key default 1 check (id = 1),
  ambiente                 text not null default 'sandbox' check (ambiente in ('sandbox', 'production')),
  checkout_mode            text not null default 'redirect' check (checkout_mode in ('redirect', 'embedded')),
  sandbox_api_key          text,
  sandbox_secret_key       text,
  sandbox_smartfields_key  text,
  prod_api_key             text,
  prod_secret_key          text,
  prod_smartfields_key     text,
  updated_at               timestamptz not null default now(),
  updated_by               text
);

alter table public.dlocal_config enable row level security;

-- No public read. The anon role must NEVER see api_key / secret_key.
-- Server-side helpers (lib/dlocal*.ts) read via the service role, which
-- bypasses RLS. The browser only gets the safe subset (ambiente + mode +
-- SmartFields key) through /api/dlocal/public-config, which reads via
-- the service role too and explicitly strips the secrets.
drop policy if exists "dlocal_config auth read" on public.dlocal_config;
create policy "dlocal_config auth read"
  on public.dlocal_config for select
  using (auth.role() = 'authenticated');

drop policy if exists "dlocal_config auth write" on public.dlocal_config;
create policy "dlocal_config auth write"
  on public.dlocal_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed the singleton row with current sandbox credentials.
insert into public.dlocal_config (
  id, ambiente, checkout_mode,
  sandbox_api_key, sandbox_secret_key, sandbox_smartfields_key
) values (
  1, 'sandbox', 'embedded',
  'PsGBmkCcetIoEewWPXUyrdaHIfTSzFJC',
  'LSyriwHreF4R91DlXIkOipkpUy8a1Uyi7QZfhOcf',
  '0cc6880c-1f11-472c-b06a-95c7053a1a24'
) on conflict (id) do nothing;
