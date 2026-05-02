"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import ColorPicker from "@/components/customizer/ColorPicker";
import PreviewRecompensas from "@/components/customizer/PreviewRecompensas";

const PASOS = ["Nombre", "Color", "Sticker", "Cantidad", "Recompensa", "Vista previa"];
const OPCIONES_PASOS = [5, 10, 15, 20];

const STICKERS = [
  { id: "estrella",   emoji: "⭐", label: "Estrella" },
  { id: "check",      emoji: "✅", label: "Check" },
  { id: "corazon",    emoji: "❤️", label: "Corazón" },
  { id: "brillante",  emoji: "🌟", label: "Brillante" },
  { id: "trofeo",     emoji: "🏆", label: "Trofeo" },
  { id: "cohete",     emoji: "🚀", label: "Cohete" },
  { id: "fiesta",     emoji: "🎉", label: "Fiesta" },
  { id: "arcoiris",   emoji: "🌈", label: "Arcoíris" },
];

export default function PersonalizarRecompensas() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#f5d78e");
  const [sticker, setSticker] = useState("estrella");
  const [pasos, setPasos] = useState(10);
  const [recompensa, setRecompensa] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, PASOS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const continuar = () => {
    const personalizacion = { pasos, recompensa, sticker };
    const params = new URLSearchParams({
      producto: "recompensas",
      nombre_nino: nombre,
      color_acento: color,
      personalizacion: JSON.stringify(personalizacion),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const stickerEmoji = STICKERS.find((s) => s.id === sticker)?.emoji ?? "⭐";

  return (
    <main className="min-h-screen bg-[#fffef6] px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#233933] mb-1">
            Tablero de Recompensas
          </h1>
          <p className="text-sm text-[#233933]/60">
            Personalizá el tablero para {nombre || "tu niño"}
          </p>
        </div>

        <StepIndicator steps={PASOS} current={step} />

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-6">
          {/* Paso 0: Nombre */}
          {step === 0 && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-[#233933]">
                ¿Cómo se llama?
              </h2>
              <Input
                placeholder="Nombre del niño"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="text-base"
                autoFocus
              />
            </div>
          )}

          {/* Paso 1: Color */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-lg mb-6 text-[#233933]">
                Elegí un color
              </h2>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          )}

          {/* Paso 2: Sticker */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-lg mb-2 text-[#233933]">
                ¿Qué sticker va a usar?
              </h2>
              <p className="text-xs text-[#233933]/50 mb-5">
                Este es el que se pega cada vez que cumple un paso
              </p>
              <div className="grid grid-cols-4 gap-3">
                {STICKERS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSticker(s.id)}
                    className={`rounded-xl p-3 flex flex-col items-center gap-1.5 border-2 transition-all ${
                      sticker === s.id
                        ? "border-[#233933]"
                        : "border-[#e5e7eb] hover:border-[#233933]/30"
                    }`}
                    style={sticker === s.id ? { backgroundColor: color + "33" } : {}}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="text-[11px] font-semibold text-[#233933]">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 3: Cantidad */}
          {step === 3 && (
            <div>
              <h2 className="font-bold text-lg mb-2 text-[#233933]">
                ¿Cuántos {stickerEmoji} para la recompensa?
              </h2>
              <p className="text-xs text-[#233933]/50 mb-6">
                La cantidad de pasos que debe completar tu niño
              </p>
              <div className="grid grid-cols-4 gap-3">
                {OPCIONES_PASOS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPasos(n)}
                    className={`rounded-2xl border-2 py-4 flex flex-col items-center gap-1 transition-all font-bold text-[#233933] ${
                      pasos === n
                        ? "border-[#233933]"
                        : "border-[#e5e7eb] hover:border-[#233933]/40"
                    }`}
                    style={pasos === n ? { backgroundColor: color + "44" } : {}}
                  >
                    <span className="text-2xl">{stickerEmoji}</span>
                    <span className="text-sm mt-0.5">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 4: Recompensa (opcional) */}
          {step === 4 && (
            <div>
              <h2 className="font-bold text-lg mb-2 text-[#233933]">
                ¿Cuál es la recompensa?
              </h2>
              <p className="text-xs text-[#233933]/50 mb-4">
                Podés escribirla o dejarlo en blanco y completarlo después a mano
              </p>
              <Input
                placeholder="Ej: ¡Salida al parque! (opcional)"
                value={recompensa}
                onChange={(e) => setRecompensa(e.target.value)}
                className="text-base"
                autoFocus
              />
              {!recompensa.trim() && (
                <p className="text-xs text-[#233933]/40 mt-3 text-center">
                  Si lo dejás en blanco, el tablero tendrá un espacio para escribir a mano ✏️
                </p>
              )}
            </div>
          )}

          {/* Paso 5: Vista previa */}
          {step === 5 && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-[#233933]">
                Vista previa
              </h2>
              <PreviewRecompensas
                nombreNino={nombre}
                colorAcento={color}
                pasos={pasos}
                recompensa={recompensa}
                sticker={stickerEmoji}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-between">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={back}
              className="border-[#233933] text-[#233933] rounded-lg"
            >
              Atrás
            </Button>
          ) : (
            <div />
          )}

          {step < PASOS.length - 1 ? (
            <Button
              onClick={next}
              disabled={step === 0 && !nombre.trim()}
              className="bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-lg shadow-none border-0"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={continuar}
              className="bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-lg shadow-none border-0"
            >
              Continuar al pago →
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
