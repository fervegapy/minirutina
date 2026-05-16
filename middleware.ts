// Middleware: keeps the Supabase auth session fresh on every request and
// protects /admin (except /admin/login + auth callback) by checking that
// the logged-in user's email is in the ADMIN_EMAILS allowlist.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-emails";

export async function middleware(req: NextRequest) {
  // Build a response we can attach cookies to as the session refreshes.
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: req });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({ request: req });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const pathname = req.nextUrl.pathname;

  // Supabase sometimes falls back to the Site URL (e.g. /?code=xxx) when the
  // redirect URL isn't in the allowlist. Redirect BEFORE calling getUser()
  // so we don't accidentally clear the PKCE code-verifier cookie.
  const code = req.nextUrl.searchParams.get("code");
  if (code && pathname !== "/auth/callback") {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Refresh the session if needed.
  const { data: { user } } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";
  const isAuthCallback = pathname.startsWith("/auth/callback");

  if (isAdminRoute && !isLoginRoute && !isAuthCallback) {
    // Logged in and allowed? Continue.
    if (user && isAdminEmail(user.email)) return res;
    // Logged in but not on allowlist → sign out and bounce to login.
    if (user && !isAdminEmail(user.email)) {
      await supabase.auth.signOut();
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_allowed");
      return NextResponse.redirect(url);
    }
    // Not logged in → bounce to login.
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Apply on every page route except internal Next assets, the public API,
  // and static files. This keeps the session cookie refreshed on navigation.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
