// Magic-link callback: Supabase redirects here with a `code` query param
// after the user clicks the email link. We exchange it for a session cookie
// and bounce to /admin (or to /admin/login with an error on failure).
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Re-check the allowlist before letting the user into /admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isAdminEmail(user.email)) {
        return NextResponse.redirect(`${origin}/admin`);
      }
      // Email not on allowlist → sign out and bounce
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/admin/login?error=not_allowed`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=invalid_link`);
}
