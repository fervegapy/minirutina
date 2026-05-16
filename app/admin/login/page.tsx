"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed:
    "Ese email no está autorizado para acceder al admin. Pedí permiso al equipo.",
  invalid_link:
    "El código expiró o no es válido. Pedí uno nuevo.",
};

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get("error");

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "verifying">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const enviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrMsg(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setStep("code");
      setStatus("idle");
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Error desconocido");
      setStatus("idle");
    }
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("verifying");
    setErrMsg(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "email",
      });
      if (error || !data.session) throw error ?? new Error("Sesión inválida.");

      // Allowlist check (client-side; server middleware enforces too).
      const userEmail = data.session.user.email ?? "";
      const allowed = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .includes(userEmail.toLowerCase());

      if (!allowed) {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=not_allowed");
        return;
      }

      router.replace("/admin");
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Código inválido");
      setStatus("idle");
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
            {step === "email"
              ? "Te mandamos un código de 6 dígitos al email."
              : `Pegá el código que mandamos a ${email}.`}
          </p>
        </div>

        {error && ERROR_MESSAGES[error] && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {ERROR_MESSAGES[error]}
          </div>
        )}

        {step === "email" ? (
          <form
            onSubmit={enviarCodigo}
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
              {status === "sending" ? "Enviando..." : "Mandame el código"}
            </Button>
            {errMsg && (
              <p className="text-xs text-red-500 text-center">{errMsg}</p>
            )}
          </form>
        ) : (
          <form
            onSubmit={verificarCodigo}
            className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
          >
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-base text-center tracking-widest font-mono"
              maxLength={6}
              required
              autoFocus
            />
            <Button
              type="submit"
              disabled={code.length < 6 || status === "verifying"}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md shadow-none border-0"
            >
              {status === "verifying" ? "Verificando..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setErrMsg(null); }}
              className="block mx-auto text-xs text-zinc-500 hover:text-zinc-900"
            >
              ← Cambiar email
            </button>
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
