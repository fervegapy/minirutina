const DIAS = [
  { key: "lunes", label: "Lun" },
  { key: "martes", label: "Mar" },
  { key: "miercoles", label: "Mié" },
  { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" },
  { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
] as const;

type DiaKey = (typeof DIAS)[number]["key"];

interface PreviewSemanaProps {
  nombreNino: string;
  colorAcento: string;
  actividades: Record<DiaKey, string[]>;
}

export default function PreviewSemana({
  nombreNino,
  colorAcento,
  actividades,
}: PreviewSemanaProps) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 max-w-sm mx-auto">
      <div
        className="rounded-xl px-4 py-2 mb-5 text-center"
        style={{ backgroundColor: colorAcento + "44" }}
      >
        <h3 className="font-bold text-base text-[#233933]">
          Plan de {nombreNino || "tu niño"}
        </h3>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS.map((dia) => (
          <div key={dia.key}>
            <div
              className="rounded-t-lg py-1 text-[11px] font-bold text-[#233933] mb-1"
              style={{ backgroundColor: colorAcento + "55" }}
            >
              {dia.label}
            </div>
            <div className="space-y-1 min-h-[60px]">
              {(actividades[dia.key] || []).map((act, i) => (
                <div
                  key={i}
                  className="rounded text-[9px] px-1 py-0.5 text-[#233933] font-medium border border-[#e5e7eb] bg-[#fffef6] truncate"
                >
                  {act}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[9px] text-[#233933]/30 mt-4 uppercase tracking-widest">
        minirutina.com
      </p>
    </div>
  );
}
