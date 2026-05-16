"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed:
    "Ese email no está autorizado para acceder al admin. Pedí permiso al equipo.",
  invalid_link:
    "El link expiró o no es válido. Pedí uno nuevo.",
};

function LoginInner() {
  const params = useSearchParams();
  const error = params.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const enviarMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrMsg(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Error desconocido");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-xl">🌿</span>
            <span className="font-semibold">minirutina</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
              admin
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Iniciá sesión</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Te mandamos un link al email para entrar.
          </p>
        </div>

        {error && ERROR_MESSAGES[error] && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {ERROR_MESSAGES[error]}
          </div>
        )}

        {status === "sent" ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">📩</div>
            <p className="font-semibold text-zinc-900 mb-2">Revisá tu email</p>
            <p className="text-sm text-zinc-500">
              Mandamos el link a <strong className="text-zinc-900">{email}</strong>.
              Hacé click ahí para entrar.
            </p>
          </div>
        ) : (
          <form
            onSubmit={enviarMagicLink}
            className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
          >
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-base"
              required
              autoFocus
            />
            <Button
              type="submit"
              disabled={!email.trim() || status === "sending"}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md shadow-none border-0"
            >
              {status === "sending" ? "Enviando..." : "Mandame el link"}
            </Button>
            {errMsg && (
              <p className="text-xs text-red-500 text-center">{errMsg}</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
