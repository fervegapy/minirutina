// Server-only Supabase client using the SERVICE_ROLE key. Bypasses RLS.
//
// Lazily instantiated via a Proxy so that importing this module never
// touches createClient() — otherwise `next build` (which loads route
// modules to collect page data) throws "supabaseKey is required" when the
// env var isn't present at build time. The real client is created on first
// property access at runtime, when the env var is available.
//
// NEVER import this from the browser or any client component.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    _client = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
