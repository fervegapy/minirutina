"use client";

import { useState } from "react";
import { iconUrl, type Genero } from "@/lib/iconAssets";

export const ICONOS_MANANA = [
  { id: "levantarse", label: "Levantarse" },
  { id: "cama",       label: "Hacer cama" },
  { id: "bano",       label: "Bañarse" },
  { id: "cepillo",    label: "Cepillarse" },
  { id: "vestirse",   label: "Vestirse" },
  { id: "desayunar",  label: "Desayunar" },
  { id: "agua",       label: "Tomar agua" },
  { id: "remedios",   label: "Remedios" },
  { id: "mochila",    label: "Mochila" },
  { id: "leer",       label: "Leer" },
  { id: "orar",       label: "Orar" },
  { id: "guarde",     label: "Guardar" },
];

export const ICONOS_SIESTA = [
  { id: "almuerzo", label: "Almuerzo" },
  { id: "siesta", label: "Siesta" },
  { id: "lectura", label: "Leer" },
  { id: "juego", label: "Jugar" },
  { id: "tarea", label: "Tarea" },
  { id: "merienda", label: "Merienda" },
  { id: "tv", label: "TV" },
  { id: "dibujo", label: "Dibujar" },
];

export const ICONOS_NOCHE = [
  { id: "mamallega",   label: "Mamá llega" },
  { id: "papallega",   label: "Papá llega" },
  { id: "cena",        label: "Cena" },
  { id: "bano",        label: "Bañarse" },
  { id: "pijama",      label: "Pijama" },
  { id: "cepillarse",  label: "Cepillarse" },
  { id: "leche",       label: "Leche" },
  { id: "cuento",      label: "Cuento" },
  { id: "cancion",     label: "Canción" },
  { id: "orar",        label: "Orar" },
  { id: "luces",       label: "Apagar luces" },
  { id: "dormir",      label: "Dormir" },
];

interface IconPickerProps {
  iconos: { id: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  accentColor?: string;
  genero?: Genero | null;
}

export default function IconPicker({
  iconos,
  selected,
  onChange,
  max = 6,
  accentColor = "#336aea",
  genero = null,
}: IconPickerProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      {/* 3 cols en mobile, 4 en desktop — cards más grandes en celulares */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 pt-3">
        {iconos.map((icono) => {
          const isSelected = selected.includes(icono.id);
          const order = isSelected ? selected.indexOf(icono.id) + 1 : null;
          return (
            <button
              key={icono.id}
              type="button"
              onClick={() => toggle(icono.id)}
              className={`relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-200 ease-out ${
                isSelected
                  ? "-translate-y-2 shadow-lg shadow-[#22244e]/20 ring-2 ring-[#22244e]"
                  : "hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#22244e]/10"
              }`}
              style={isSelected ? { backgroundColor: accentColor + "33" } : {}}
            >
              {order !== null && (
                <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#22244e] text-white text-[11px] font-bold flex items-center justify-center leading-none z-10 shadow-sm ring-2 ring-white">
                  {order}
                </span>
              )}
              <IconImage id={icono.id} label={icono.label} genero={genero} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Renders the PNG illustration at /public/icons/{id}.png; falls back to emoji
// if the file doesn't exist yet (so the picker keeps working while you upload).
function IconImage({
  id,
  label,
  genero,
}: {
  id: string;
  label: string;
  genero: Genero | null;
}) {
  // Re-key on (id, genero) so changing gender re-mounts and clears the failed state
  const src = iconUrl(id, genero);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="w-full h-full flex items-center justify-center text-7xl leading-none">
        {getIconEmoji(id)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={label}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function getIconEmoji(id: string): string {
  const map: Record<string, string> = {
    levantarse: "☀️",
    cama: "🛏️",
    bano: "🛁",
    cepillo: "🦷",
    vestirse: "👕",
    desayunar: "🥣",
    agua: "💧",
    remedios: "💊",
    mochila: "🎒",
    leer: "📖",
    orar: "🙏",
    guarde: "🧸",
    almuerzo: "🍽️",
    siesta: "😴",
    lectura: "📖",
    juego: "🎮",
    tarea: "✏️",
    merienda: "🍎",
    tv: "📺",
    dibujo: "🎨",
    mamallega: "👩",
    papallega: "👨",
    cena: "🍜",
    pijama: "🌙",
    cepillarse: "🪥",
    leche: "🥛",
    cuento: "📚",
    cancion: "🎵",
    luces: "💡",
    dormir: "💤",
  };
  return map[id] ?? "⭐";
}
