import { ICONOS_MANANA, ICONOS_SIESTA, ICONOS_NOCHE, getIconEmoji } from "./IconPicker";

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

export default function PreviewRutinas({
  nombreNino,
  colorAcento,
  manana,
  siesta,
  noche,
}: PreviewRutinasProps) {
  const selected = { manana, siesta, noche };

  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }}>
      {/* Title header */}
      <div
        className="rounded-xl px-4 py-3 mb-4 text-center"
        style={{ backgroundColor: colorAcento + "44" }}
      >
        <h3 className="font-bold text-base text-[#233933]">
          Rutina de {nombreNino || "tu niño"}
        </h3>
      </div>

      {/* One card per block */}
      <div className="space-y-3">
        {BLOQUES.map((bloque) => {
          const ids = selected[bloque.key];
          const iconosSeleccionados = ids
            .map((id) => bloque.iconos.find((ic) => ic.id === id))
            .filter(Boolean) as { id: string; label: string }[];

          return (
            <div
              key={bloque.key}
              className="rounded-xl border border-[#e5e7eb] overflow-hidden"
            >
              {/* Block header */}
              <div
                className="px-4 py-2 text-sm font-bold text-[#233933]"
                style={{ backgroundColor: colorAcento + "55" }}
              >
                {bloque.label}
              </div>

              {/* Icons row */}
              <div className="bg-white px-4 py-3">
                {iconosSeleccionados.length === 0 ? (
                  <span className="text-xs text-[#233933]/30 italic">
                    Sin actividades seleccionadas
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {iconosSeleccionados.map((ic, i) => (
                      <div
                        key={ic.id}
                        className="flex flex-col items-center gap-1 relative"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-[#e5e7eb]"
                          style={{ backgroundColor: colorAcento + "22" }}
                        >
                          {getIconEmoji(ic.id)}
                        </div>
                        <span className="text-[9px] font-bold text-[#233933]/50 w-12 text-center leading-tight">
                          {i + 1}. {ic.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[9px] text-[#233933]/30 mt-4 uppercase tracking-widest">
        minirutina.com
      </p>
    </div>
  );
}
