-- site_config: singleton table (one row) that holds branding/metadata.
-- The admin /admin/branding page edits this row.

create table if not exists public.site_config (
  id                int          primary key default 1,
  site_name         text         not null default 'Minirutina',
  site_description  text         not null default 'Tableros personalizados para que los niños construyan hábitos con alegría.',
  logo_url          text,
  favicon_url       text,
  og_image_url      text,
  support_image_url text,
  theme_color       text         not null default '#336aea',
  updated_at        timestamptz  not null default now(),
  constraint site_config_singleton check (id = 1)
);

-- Seed the singleton row if it doesn't exist yet.
insert into public.site_config (id) values (1)
on conflict (id) do nothing;

-- Public-read storage bucket for logo / favicon / OG image / support image.
-- (Manual step in dashboard if SQL not allowed):
--   Storage → New bucket → name: "branding" → Public: ON
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Allow anonymous read on the branding bucket (logos shown publicly).
create policy "branding public read"
  on storage.objects for select
  using (bucket_id = 'branding');

-- Allow authenticated (admin) users to upload / replace / delete.
-- Admin-email enforcement happens in the server action; here we just
-- require a session.
create policy "branding auth write"
  on storage.objects for insert
  with check (bucket_id = 'branding' and auth.role() = 'authenticated');

create policy "branding auth update"
  on storage.objects for update
  using (bucket_id = 'branding' and auth.role() = 'authenticated');

create policy "branding auth delete"
  on storage.objects for delete
  using (bucket_id = 'branding' and auth.role() = 'authenticated');
