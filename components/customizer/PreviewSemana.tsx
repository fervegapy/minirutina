import { getIconEmoji, ICONOS_SEMANA } from "./IconPicker";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface PreviewSemanaProps {
  nombreNino: string;
  colorAcento: string;
  figuritas: string[];
}

export default function PreviewSemana({
  nombreNino,
  colorAcento,
  figuritas,
}: PreviewSemanaProps) {
  if (figuritas.length === 0) {
    return (
      <p className="text-center text-xs text-[#233933]/40 py-6">
        Seleccioná al menos una figurita para ver la vista previa
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Página 1: grilla de días */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
        <div
          className="rounded-xl px-4 py-2 mb-4 text-center"
          style={{ backgroundColor: colorAcento + "44" }}
        >
          <h3 className="font-bold text-sm text-[#233933]">
            Plan de {nombreNino || "tu niño"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                {DIAS.map((d) => (
                  <th key={d} className="pb-1 px-0.5">
                    <span
                      className="block rounded-md py-0.5 text-[10px] font-bold text-[#233933]"
                      style={{ backgroundColor: colorAcento + "55" }}
                    >
                      {d}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {figuritas.map((id) => (
                <tr key={id}>
                  {DIAS.map((d) => (
                    <td key={d} className="px-0.5 py-0.5">
                      <div
                        className="rounded border border-[#e5e7eb] bg-[#fffef6]"
                        style={{ width: "100%", aspectRatio: "1", minWidth: "20px", minHeight: "20px" }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-[9px] text-[#233933]/30 mt-3 uppercase tracking-widest">
          minirutina.com
        </p>
      </div>

      {/* Página 2: lista de actividades para recortar */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
        <p className="text-[10px] font-bold text-[#233933]/50 uppercase tracking-wide mb-3 text-center">
          Estas actividades van en cada día de la semana
        </p>
        <div className="grid grid-cols-2 gap-2">
          {figuritas.map((id, i) => {
            const label = ICONOS_SEMANA.find((ic) => ic.id === id)?.label ?? id;
            return (
              <div
                key={id}
                className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] px-3 py-2 bg-[#fffef6]"
                style={{ borderLeftColor: colorAcento, borderLeftWidth: "3px" }}
              >
                <span className="text-lg leading-none">{getIconEmoji(id)}</span>
                <span className="text-xs font-semibold text-[#233933]">{label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-center text-[9px] text-[#233933]/30 mt-3 uppercase tracking-widest">
          minirutina.com
        </p>
      </div>
    </div>
  );
}
