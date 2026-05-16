"use client";

// Magic-link callback — runs in the browser so the PKCE code verifier
// (stored in a browser cookie by signInWithOtp) is accessible during
// the exchangeCodeForSession call.
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");

    if (!code) {
      router.replace("/admin/login?error=invalid_link");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error || !data.session) {
        router.replace("/admin/login?error=invalid_link");
        return;
      }

      // Check allowlist client-side before redirecting.
      const email = data.session.user.email ?? "";
      const allowed = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .includes(email.toLowerCase());

      if (!allowed) {
        supabase.auth.signOut();
        router.replace("/admin/login?error=not_allowed");
        return;
      }

      router.replace("/admin");
    });
  }, [params, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-400">Verificando sesión…</p>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
