// Server-only Supabase client using the SERVICE_ROLE key. Bypasses RLS,
// so it can update any table regardless of policies.
//
// NEVER expose this client to the browser or to any client component.
// Only import it from:
//   - API routes (app/api/.../route.ts)
//   - server actions ("use server")
//   - server components running on the server
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
  },
});
