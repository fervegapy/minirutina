"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import ColorPicker from "@/components/customizer/ColorPicker";
import IconPicker, {
  ICONOS_MANANA,
  ICONOS_SIESTA,
  ICONOS_NOCHE,
} from "@/components/customizer/IconPicker";
import PreviewRutinas from "@/components/customizer/PreviewRutinas";

const PASOS = ["Nombre", "Color", "Mañana", "Siesta", "Noche", "Vista previa"];

export default function PersonalizarRutinas() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#a8c5a0");
  const [manana, setManana] = useState<string[]>([]);
  const [siesta, setSiesta] = useState<string[]>([]);
  const [noche, setNoche] = useState<string[]>([]);

  const next = () => setStep((s) => Math.min(s + 1, PASOS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const continuar = () => {
    const personalizacion = { manana, siesta, noche };
    const params = new URLSearchParams({
      producto: "rutinas",
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
            Tablero de Rutinas
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
                ☀️ Actividades de la mañana
              </h2>
              <IconPicker
                iconos={ICONOS_MANANA}
                selected={manana}
                onChange={setManana}
                max={6}
                accentColor={color}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-bold text-lg mb-2 text-[#233933]">
                🌤️ Actividades de la siesta
              </h2>
              <IconPicker
                iconos={ICONOS_SIESTA}
                selected={siesta}
                onChange={setSiesta}
                max={6}
                accentColor={color}
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-bold text-lg mb-2 text-[#233933]">
                🌙 Actividades de la noche
              </h2>
              <IconPicker
                iconos={ICONOS_NOCHE}
                selected={noche}
                onChange={setNoche}
                max={6}
                accentColor={color}
              />
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-[#233933]">
                Vista previa
              </h2>
              <PreviewRutinas
                nombreNino={nombre}
                colorAcento={color}
                manana={manana}
                siesta={siesta}
                noche={noche}
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
