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

export const ICONOS_SEMANA = [
  { id: "dientes_s",  label: "Dientes" },
  { id: "desayuno_s", label: "Desayuno" },
  { id: "almuerzo_s", label: "Almuerzo" },
  { id: "cena_s",     label: "Cena" },
  { id: "tarea_s",    label: "Tarea" },
  { id: "lectura_s",  label: "Leer" },
  { id: "deporte_s",  label: "Deporte" },
  { id: "musica_s",   label: "Música" },
  { id: "bano_s",     label: "Baño" },
  { id: "colegio_s",  label: "Colegio" },
  { id: "juego_s",    label: "Jugar" },
  { id: "dibujo_s",   label: "Dibujar" },
  { id: "tv_s",       label: "TV" },
  { id: "merienda_s", label: "Merienda" },
  { id: "siesta_s",   label: "Descanso" },
  { id: "vestirse_s", label: "Vestirse" },
  { id: "mochila_s",  label: "Mochila" },
  { id: "rezar_s",    label: "Rezar" },
  { id: "abrazar_s",  label: "Abrazo" },
  { id: "desp_s",     label: "Despertar" },
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
  accentColor = "#ecbc5d",
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
      <p className="text-xs text-[#233933]/50 mb-3 text-center">
        Seleccioná hasta {max} actividades · el orden importa
      </p>
      <div className="grid grid-cols-2 gap-3">
        {iconos.map((icono) => {
          const isSelected = selected.includes(icono.id);
          const order = isSelected ? selected.indexOf(icono.id) + 1 : null;
          return (
            <button
              key={icono.id}
              type="button"
              onClick={() => toggle(icono.id)}
              className="relative w-full max-w-[200px] aspect-square mx-auto transition-all"
              style={
                isSelected
                  ? { outline: "3px solid #233933", backgroundColor: accentColor + "33" }
                  : {}
              }
            >
              {order !== null && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#233933] text-white text-[10px] font-bold flex items-center justify-center leading-none z-10">
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
    // semana variants
    dientes_s: "🦷",
    desayuno_s: "🥣",
    almuerzo_s: "🍽️",
    cena_s: "🍜",
    tarea_s: "✏️",
    lectura_s: "📖",
    deporte_s: "⚽",
    musica_s: "🎵",
    bano_s: "🛁",
    colegio_s: "🏫",
    juego_s: "🎮",
    dibujo_s: "🎨",
    tv_s: "📺",
    merienda_s: "🍎",
    siesta_s: "😴",
    vestirse_s: "👕",
    mochila_s: "🎒",
    rezar_s: "🙏",
    abrazar_s: "🤗",
    desp_s: "☀️",
  };
  return map[id] ?? "⭐";
}
