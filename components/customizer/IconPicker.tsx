"use client";

export const ICONOS_MANANA = [
  { id: "despertar", label: "Despertar" },
  { id: "dientes", label: "Dientes" },
  { id: "desayuno", label: "Desayuno" },
  { id: "vestirse", label: "Vestirse" },
  { id: "mochila", label: "Mochila" },
  { id: "colegio", label: "Colegio" },
  { id: "pelo", label: "Peinarse" },
  { id: "lavarse", label: "Lavarse" },
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
  { id: "cena", label: "Cena" },
  { id: "bano", label: "Baño" },
  { id: "pijama", label: "Pijama" },
  { id: "cuento", label: "Cuento" },
  { id: "dientes_noche", label: "Dientes" },
  { id: "dormir", label: "Dormir" },
  { id: "rezar", label: "Rezar" },
  { id: "abrazar", label: "Abrazo" },
];

interface IconPickerProps {
  iconos: { id: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  accentColor?: string;
}

export default function IconPicker({
  iconos,
  selected,
  onChange,
  max = 6,
  accentColor = "#ecbc5d",
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
      <div className="grid grid-cols-4 gap-3">
        {iconos.map((icono) => {
          const isSelected = selected.includes(icono.id);
          const order = isSelected ? selected.indexOf(icono.id) + 1 : null;
          return (
            <button
              key={icono.id}
              type="button"
              onClick={() => toggle(icono.id)}
              className={`relative rounded-xl p-3 flex flex-col items-center gap-1 border-2 transition-all text-center ${
                isSelected
                  ? "border-[#233933]"
                  : "border-[#e5e7eb] hover:border-[#233933]/30"
              }`}
              style={isSelected ? { backgroundColor: accentColor + "33" } : {}}
            >
              {order !== null && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#233933] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {order}
                </span>
              )}
              <span className="text-2xl">{getIconEmoji(icono.id)}</span>
              <span className="text-[11px] font-semibold text-[#233933] leading-tight">
                {icono.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getIconEmoji(id: string): string {
  const map: Record<string, string> = {
    despertar: "☀️",
    dientes: "🦷",
    desayuno: "🥣",
    vestirse: "👕",
    mochila: "🎒",
    colegio: "🏫",
    pelo: "💇",
    lavarse: "🧼",
    almuerzo: "🍽️",
    siesta: "😴",
    lectura: "📖",
    juego: "🎮",
    tarea: "✏️",
    merienda: "🍎",
    tv: "📺",
    dibujo: "🎨",
    cena: "🍜",
    bano: "🛁",
    pijama: "🌙",
    cuento: "📚",
    dientes_noche: "🪥",
    dormir: "💤",
    rezar: "🙏",
    abrazar: "🤗",
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
