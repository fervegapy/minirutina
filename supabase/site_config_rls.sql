-- RLS policies for site_config. The public site (anon key) needs to READ
-- branding to render logo/favicon/title; only authenticated admin users
-- should be able to write (write checks happen in the server action too).

alter table public.site_config enable row level security;

-- Public read (anon + authenticated).
drop policy if exists "site_config public read" on public.site_config;
create policy "site_config public read"
  on public.site_config
  for select
  using (true);

-- Authenticated write (insert / update). Admin enforcement is also done in
-- the server action via the email allowlist.
drop policy if exists "site_config auth update" on public.site_config;
create policy "site_config auth update"
  on public.site_config
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "site_config auth insert" on public.site_config;
create policy "site_config auth insert"
  on public.site_config
  for insert
  with check (auth.role() = 'authenticated');
