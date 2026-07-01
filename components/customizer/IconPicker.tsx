"use client";

import { useState } from "react";
import { iconUrl, type Genero } from "@/lib/iconAssets";

export const ICONOS_MANANA = [
  { id: "levantarse", label: "Levantarse" },
  { id: "cama",       label: "Hacer cama" },
  { id: "ir_bano",    label: "Ir al baño" },
  { id: "bano",       label: "Bañarse" },
  { id: "cepillo",    label: "Cepillarse" },
  { id: "peinarse",   label: "Peinarse" },
  { id: "vestirse",   label: "Vestirse" },
  { id: "zapatos",    label: "Ponerse los zapatos" },
  { id: "desayunar",  label: "Desayunar" },
  { id: "manos",      label: "Lavarse las manos" },
  { id: "agua",       label: "Tomar agua" },
  { id: "remedios",   label: "Remedios" },
  { id: "ordenar",    label: "Ordenar" },
  { id: "calendario", label: "Calendario" },
  { id: "mochila",    label: "Mochila" },
  { id: "leer",       label: "Leer" },
  { id: "orar",       label: "Orar" },
  { id: "guarde",     label: "Ir a la guarde" },
  { id: "cole",       label: "Ir al cole" },
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
  { id: "mamallega",      label: "Mamá llega" },
  { id: "papallega",      label: "Papá llega" },
  { id: "papamamallegan", label: "Papá y mamá llegan" },
  { id: "manos",          label: "Lavarse las manos" },
  { id: "ordenar",        label: "Guardar juguetes" },
  { id: "cena",           label: "Cena" },
  { id: "bano",           label: "Bañarse" },
  { id: "cara",           label: "Lavarse la cara" },
  { id: "pijama",         label: "Pijama" },
  { id: "cepillarse",     label: "Cepillarse" },
  { id: "ir_bano",        label: "Ir al baño" },
  { id: "leche",          label: "Leche" },
  { id: "remedios",       label: "Remedios" },
  { id: "calma",          label: "Tiempo de calma" },
  { id: "cuento",         label: "Cuento" },
  { id: "cancion",        label: "Canción" },
  { id: "charla",         label: "Charla del día" },
  { id: "preparar",       label: "Preparar para mañana" },
  { id: "orar",           label: "Orar" },
  { id: "luces",          label: "Apagar luces" },
  { id: "dormir",         label: "Dormir" },
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
      {/* 2 cols en mobile (mín 150px por card, más legibles), 4 en desktop */}
      <div className="grid grid-cols-[repeat(2,minmax(150px,1fr))] md:grid-cols-4 gap-2.5 md:gap-3 pt-3">
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
    peinarse: "💇",
    vestirse: "👕",
    desayunar: "🥣",
    agua: "💧",
    remedios: "💊",
    mochila: "🎒",
    leer: "📖",
    orar: "🙏",
    guarde: "🧸",
    cole: "🏫",
    almuerzo: "🍽️",
    siesta: "😴",
    lectura: "📖",
    juego: "🎮",
    tarea: "✏️",
    merienda: "🍎",
    tv: "📺",
    dibujo: "🎨",
    ir_bano:   "🚽",
    zapatos:   "👟",
    manos:     "🤲",
    ordenar:   "🧹",
    calendario:"📅",
    cara:      "🫧",
    calma:     "🧘",
    charla:    "💬",
    preparar:  "🎒",
    mamallega: "👩",
    papallega: "👨",
    papamamallegan: "👨‍👩‍👧",
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
