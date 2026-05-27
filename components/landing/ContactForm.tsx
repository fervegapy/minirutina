"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
  const [nombre,  setNombre]  = useState("");
  const [email,   setEmail]   = useState("");
  const [mensaje, setMensaje] = useState("");
  // Honeypot — should stay empty. If a bot fills it, we silently drop the
  // request server-side.
  const [website, setWebsite] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err,    setErr]    = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
      setErr("Por favor completá nombre, email y mensaje.");
      return;
    }
    setStatus("sending");
    setErr(null);
    try {
      const res = await fetch("/api/contacto", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nombre, email, mensaje, website }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "No se pudo enviar el mensaje.");
      }
      setStatus("sent");
      setNombre(""); setEmail(""); setMensaje("");
    } catch (e) {
      setStatus("error");
      setErr(e instanceof Error ? e.message : "Error desconocido.");
    }
  };

  if (status === "sent") {
    return (
      <div className="not-prose bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">✅</div>
        <p className="font-semibold text-emerald-900 mb-1">¡Recibimos tu mensaje!</p>
        <p className="text-sm text-emerald-800">
          Te respondemos a la brevedad al email que dejaste.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="not-prose space-y-4">
      {/* Honeypot — visually hidden, ignored by humans, often filled by bots */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
      >
        <label>
          Si sos humano, dejá este campo vacío
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-widest text-[#22244e]/60 font-bold block mb-1.5">
          Nombre
        </label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          required
          maxLength={120}
          className="text-base"
        />
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-widest text-[#22244e]/60 font-bold block mb-1.5">
          Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          maxLength={200}
          className="text-base"
        />
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-widest text-[#22244e]/60 font-bold block mb-1.5">
          Mensaje
        </label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Contanos en qué podemos ayudarte..."
          required
          rows={6}
          maxLength={3000}
          className="w-full text-base px-3 py-2.5 rounded-md border border-[#e5e7eb] bg-white text-[#22244e] focus:outline-none focus:ring-2 focus:ring-[#336aea]/50 focus:border-[#336aea] resize-y"
        />
      </div>

      {err && (
        <p className="text-sm text-red-600">{err}</p>
      )}

      <Button
        type="submit"
        disabled={status === "sending"}
        className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 text-base h-12 px-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#336aea]/30 active:translate-y-0 active:scale-[0.98]"
      >
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </Button>
    </form>
  );
}
