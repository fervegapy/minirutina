import { ICONOS_MANANA, ICONOS_SIESTA, ICONOS_NOCHE } from "./IconPicker";

interface PreviewRutinasProps {
  nombreNino: string;
  colorAcento: string;
  manana: string[];
  siesta: string[];
  noche: string[];
}

const BLOQUES = [
  { key: "manana" as const, label: "☀️ Mañana", iconos: ICONOS_MANANA },
  { key: "siesta" as const, label: "🌤️ Siesta", iconos: ICONOS_SIESTA },
  { key: "noche" as const, label: "🌙 Noche", iconos: ICONOS_NOCHE },
];

function getIconEmoji(id: string): string {
  const map: Record<string, string> = {
    despertar: "☀️", dientes: "🦷", desayuno: "🥣", vestirse: "👕",
    mochila: "🎒", colegio: "🏫", pelo: "💇", lavarse: "🧼",
    almuerzo: "🍽️", siesta: "😴", lectura: "📖", juego: "🎮",
    tarea: "✏️", merienda: "🍎", tv: "📺", dibujo: "🎨",
    cena: "🍜", bano: "🛁", pijama: "🌙", cuento: "📚",
    dientes_noche: "🪥", dormir: "💤", rezar: "🙏", abrazar: "🤗",
  };
  return map[id] ?? "⭐";
}

export default function PreviewRutinas({
  nombreNino,
  colorAcento,
  manana,
  siesta,
  noche,
}: PreviewRutinasProps) {
  const selected = { manana, siesta, noche };

  return (
    <div
      className="rounded-2xl border border-[#e5e7eb] bg-white p-6 max-w-sm mx-auto"
      style={{ fontFamily: "Nunito, sans-serif" }}
    >
      <div
        className="rounded-xl px-4 py-3 mb-5 text-center"
        style={{ backgroundColor: colorAcento + "44" }}
      >
        <h3 className="font-bold text-lg text-[#233933]">
          Rutina de {nombreNino || "tu niño"}
        </h3>
      </div>
      <div className="space-y-4">
        {BLOQUES.map((bloque) => {
          const ids = selected[bloque.key];
          const allIconos = bloque.iconos;
          const iconosSeleccionados = ids
            .map((id) => allIconos.find((ic) => ic.id === id))
            .filter(Boolean) as { id: string; label: string }[];

          return (
            <div key={bloque.key}>
              <div
                className="rounded-lg px-3 py-1.5 mb-2 inline-block text-sm font-bold text-[#233933]"
                style={{ backgroundColor: colorAcento + "55" }}
              >
                {bloque.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {iconosSeleccionados.length === 0 ? (
                  <span className="text-xs text-[#233933]/30 italic">
                    Sin actividades
                  </span>
                ) : (
                  iconosSeleccionados.map((ic) => (
                    <div
                      key={ic.id}
                      className="rounded-lg border border-[#e5e7eb] px-3 py-2 flex flex-col items-center gap-1 bg-[#fffef6]"
                    >
                      <span className="text-xl">{getIconEmoji(ic.id)}</span>
                      <span className="text-[10px] font-semibold text-[#233933]">
                        {ic.label}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[9px] text-[#233933]/30 mt-5 uppercase tracking-widest">
        minirutina.com
      </p>
    </div>
  );
}
