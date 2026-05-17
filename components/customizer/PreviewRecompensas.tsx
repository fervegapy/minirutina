interface PreviewRecompensasProps {
  nombreNino: string;
  colorAcento: string;
  pasos: number;
  recompensa: string;
  sticker?: string;
}

export default function PreviewRecompensas({
  nombreNino,
  colorAcento,
  pasos,
  recompensa,
  sticker = "⭐",
}: PreviewRecompensasProps) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 max-w-sm mx-auto">
      <div
        className="rounded-xl px-4 py-2 mb-5 text-center"
        style={{ backgroundColor: colorAcento + "44" }}
      >
        <h3 className="font-bold text-base text-[#22244e]">
          ¡Tablero de {nombreNino || "tu niño"}!
        </h3>
      </div>
      <p className="text-center text-xs text-[#22244e]/60 mb-4">
        Completá los {pasos} {sticker} para ganar tu recompensa
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-5">
        {Array.from({ length: pasos }).map((_, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-xl border-2 border-[#e5e7eb] flex items-center justify-center text-xl bg-[#faf6e7]"
          >
            {sticker}
          </div>
        ))}
      </div>
      {recompensa ? (
        <div
          className="rounded-xl px-4 py-3 text-center"
          style={{ backgroundColor: colorAcento + "33" }}
        >
          <p className="text-xs font-bold text-[#22244e]/60 uppercase tracking-wide mb-1">
            Tu recompensa
          </p>
          <p className="font-bold text-[#22244e] text-sm">{recompensa}</p>
        </div>
      ) : (
        <div
          className="rounded-xl px-4 py-3 text-center border border-dashed border-[#22244e]/20"
          style={{ backgroundColor: colorAcento + "11" }}
        >
          <p className="text-xs font-bold text-[#22244e]/40 uppercase tracking-wide mb-1">
            Tu recompensa
          </p>
          <p className="text-xs text-[#22244e]/30 italic">Se completa a mano ✏️</p>
        </div>
      )}
      <p className="text-center text-[9px] text-[#22244e]/30 mt-4 uppercase tracking-widest">
        minirutina.com
      </p>
    </div>
  );
}
