// Server-side Supabase client. Reads/writes cookies via Next's cookies() API
// so server components and route handlers see the same auth session as the
// browser. Use this in server components and server actions; the legacy
// `supabase` export in lib/supabase.ts is still fine for code that doesn't
// need an authenticated session (e.g. anonymous customer flows).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — Next disallows mutating
            // cookies here. Middleware refreshes the session instead.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // see above
          }
        },
      },
    },
  );
}
