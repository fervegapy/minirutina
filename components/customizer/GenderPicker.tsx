"use client";

import { useState } from "react";
import type { Genero } from "@/lib/iconAssets";

export type { Genero };

const OPCIONES: { id: Genero; label: string; emoji: string }[] = [
  { id: "nino", label: "Niño", emoji: "👦" },
  { id: "nina", label: "Niña", emoji: "👧" },
];

interface GenderPickerProps {
  value: Genero | null;
  onChange: (g: Genero) => void;
  accentColor?: string;
}

export default function GenderPicker({
  value,
  onChange,
  accentColor = "#ecbc5d",
}: GenderPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPCIONES.map((op) => {
        const isSelected = value === op.id;
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onChange(op.id)}
            className="relative w-full max-w-[200px] aspect-square mx-auto transition-all"
            style={
              isSelected
                ? { outline: "3px solid #233933", backgroundColor: accentColor + "33" }
                : {}
            }
          >
            <GenderImage id={op.id} label={op.label} emoji={op.emoji} />
          </button>
        );
      })}
    </div>
  );
}

// Renders the PNG at /public/icons/{id}.png; falls back to emoji + label if missing.
function GenderImage({
  id,
  label,
  emoji,
}: {
  id: Genero;
  label: string;
  emoji: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2">
        <span className="text-7xl leading-none">{emoji}</span>
        <span className="text-sm font-semibold text-[#233933]">{label}</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/${id}.png`}
      alt={label}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
