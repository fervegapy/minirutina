"use client";

// Selector manual de región — pisa la detección automática por IP. Vive en
// el Header y el Footer. Al cambiar, guarda la cookie y refresca los Server
// Components (precios, copy y disponibilidad de formato dependen de esto).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Region } from "@/lib/region";

const OPCIONES: { value: Region; label: string }[] = [
  { value: "py",   label: "🇵🇾 Paraguay · Gs." },
  { value: "intl", label: "🌎 Otro país · USD" },
];

export default function RegionSwitcher({
  region,
  variant = "light",
}: {
  region: Region;
  variant?: "light" | "dark";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<Region>(region);

  const cambiar = (nueva: Region) => {
    if (nueva === value) return;
    setValue(nueva);
    startTransition(async () => {
      await fetch("/api/region", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ region: nueva }),
      }).catch(() => {});
      router.refresh();
    });
  };

  const base =
    variant === "dark"
      ? "bg-white/10 text-white/70 border-white/15"
      : "bg-white text-[#22244e]/70 border-[#e5e7eb]";

  return (
    <select
      aria-label="Región"
      value={value}
      disabled={pending}
      onChange={(e) => cambiar(e.target.value as Region)}
      className={`text-xs font-semibold rounded-lg border px-2.5 h-9 cursor-pointer disabled:opacity-60 ${base}`}
    >
      {OPCIONES.map((o) => (
        <option key={o.value} value={o.value} className="text-[#22244e]">
          {o.label}
        </option>
      ))}
    </select>
  );
}
