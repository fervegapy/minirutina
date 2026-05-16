// Magic link callback (token_hash flow — no PKCE).
//
// Supabase's email template points directly here with `?token_hash=...&type=email`.
// We verify the hash server-side via verifyOtp, which sets the session cookie
// for the subsequent /admin navigation. No code-verifier / cookie surgery
// required.
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      // Re-check allowlist before letting them into /admin.
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isAdminEmail(user.email)) {
        return NextResponse.redirect(`${origin}/admin`);
      }
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/admin/login?error=not_allowed`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=invalid_link`);
}
