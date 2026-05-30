-- SECURITY FIX: previously this table had a public-read RLS policy that
-- exposed the api_key + secret_key columns to anyone with the anon key.
-- Drop the public-read policy. From now on:
--   - server-side code reads via the service role (bypasses RLS),
--   - the only public-facing data (SmartFields key + ambiente + mode) is
--     returned via /api/dlocal/public-config, which uses the service role
--     and explicitly returns only the safe subset.

drop policy if exists "dlocal_config public read" on public.dlocal_config;

-- Auth-only read for the admin UI. Service role still bypasses RLS, so
-- the server-side helpers keep working.
drop policy if exists "dlocal_config auth read" on public.dlocal_config;
create policy "dlocal_config auth read"
  on public.dlocal_config for select
  using (auth.role() = 'authenticated');
