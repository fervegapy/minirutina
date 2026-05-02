"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import ColorPicker from "@/components/customizer/ColorPicker";
import PreviewRecompensas from "@/components/customizer/PreviewRecompensas";

const PASOS = ["Nombre", "Color", "Estrellas", "Recompensa", "Vista previa"];
const OPCIONES_PASOS = [5, 10, 15];

export default function PersonalizarRecompensas() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#a8c5a0");
  const [pasos, setPasos] = useState(10);
  const [recompensa, setRecompensa] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, PASOS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const continuar = () => {
    const personalizacion = { pasos, recompensa };
    const params = new URLSearchParams({
      producto: "recompensas",
      nombre_nino: nombre,
      color_acento: color,
      personalizacion: JSON.stringify(personalizacion),
    });
    router.push(`/checkout?${params.toString()}`);
  };

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

          {step === 1 && (
            <div>
              <h2 className="font-bold text-lg mb-6 text-[#233933]">
                Elegí un color
              </h2>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-bold text-lg mb-2 text-[#233933]">
                ¿Cuántas estrellas para la recompensa?
              </h2>
              <p className="text-xs text-[#233933]/50 mb-6">
                Elegí la cantidad de pasos que debe completar tu niño
              </p>
              <div className="flex gap-4 justify-center">
                {OPCIONES_PASOS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPasos(n)}
                    className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all font-bold text-[#233933] ${
                      pasos === n
                        ? "border-[#233933] text-[#233933]"
                        : "border-[#e5e7eb] hover:border-[#233933]/40"
                    }`}
                    style={
                      pasos === n ? { backgroundColor: color + "44" } : {}
                    }
                  >
                    <span className="text-3xl">⭐</span>
                    <span className="text-sm mt-1">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-bold text-lg mb-2 text-[#233933]">
                ¿Cuál es la recompensa?
              </h2>
              <p className="text-xs text-[#233933]/50 mb-4">
                Escribí lo que gana cuando completa todas las estrellas
              </p>
              <Input
                placeholder="Ej: ¡Salida al parque!"
                value={recompensa}
                onChange={(e) => setRecompensa(e.target.value)}
                className="text-base"
                autoFocus
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-[#233933]">
                Vista previa
              </h2>
              <PreviewRecompensas
                nombreNino={nombre}
                colorAcento={color}
                pasos={pasos}
                recompensa={recompensa}
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
