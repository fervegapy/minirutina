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
        Seleccioná hasta {max} actividades
      </p>
      <div className="grid grid-cols-4 gap-3">
        {iconos.map((icono) => {
          const isSelected = selected.includes(icono.id);
          return (
            <button
              key={icono.id}
              type="button"
              onClick={() => toggle(icono.id)}
              className={`rounded-xl p-3 flex flex-col items-center gap-1 border-2 transition-all text-center ${
                isSelected
                  ? "border-[#233933]"
                  : "border-[#e5e7eb] hover:border-[#233933]/30"
              }`}
              style={isSelected ? { backgroundColor: accentColor + "33" } : {}}
            >
              <span className="text-2xl">
                {getIconEmoji(icono.id)}
              </span>
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

function getIconEmoji(id: string): string {
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
  };
  return map[id] ?? "⭐";
}
