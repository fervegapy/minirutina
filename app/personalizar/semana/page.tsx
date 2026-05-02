"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import ColorPicker from "@/components/customizer/ColorPicker";
import PreviewSemana from "@/components/customizer/PreviewSemana";

const PASOS = ["Nombre", "Color", "Actividades", "Vista previa"];

const DIAS = [
  { key: "lunes" as const, label: "Lunes" },
  { key: "martes" as const, label: "Martes" },
  { key: "miercoles" as const, label: "Miércoles" },
  { key: "jueves" as const, label: "Jueves" },
  { key: "viernes" as const, label: "Viernes" },
  { key: "sabado" as const, label: "Sábado" },
  { key: "domingo" as const, label: "Domingo" },
];

type DiaKey = (typeof DIAS)[number]["key"];

const emptyActividades = (): Record<DiaKey, string[]> => ({
  lunes: [],
  martes: [],
  miercoles: [],
  jueves: [],
  viernes: [],
  sabado: [],
  domingo: [],
});

export default function PersonalizarSemana() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#a8c5a0");
  const [actividades, setActividades] = useState<Record<DiaKey, string[]>>(
    emptyActividades()
  );

  const next = () => setStep((s) => Math.min(s + 1, PASOS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const setActividad = (dia: DiaKey, idx: number, val: string) => {
    setActividades((prev) => {
      const arr = [...(prev[dia] || [])];
      arr[idx] = val;
      return { ...prev, [dia]: arr };
    });
  };

  const getActividades = (dia: DiaKey) => {
    const arr = actividades[dia] || [];
    return [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[3] ?? ""];
  };

  const continuar = () => {
    const clean: Record<DiaKey, string[]> = emptyActividades();
    DIAS.forEach(({ key }) => {
      clean[key] = (actividades[key] || []).filter((a) => a.trim());
    });
    const params = new URLSearchParams({
      producto: "semana",
      nombre_nino: nombre,
      color_acento: color,
      personalizacion: JSON.stringify(clean),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#fffef6] px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#233933] mb-1">
            Plan de la Semana
          </h1>
          <p className="text-sm text-[#233933]/60">
            Personalizá el plan semanal para {nombre || "tu niño"}
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
              <h2 className="font-bold text-lg mb-1 text-[#233933]">
                Actividades de la semana
              </h2>
              <p className="text-xs text-[#233933]/50 mb-4">
                Hasta 4 actividades por día
              </p>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {DIAS.map((dia) => (
                  <div key={dia.key}>
                    <p className="font-bold text-sm text-[#233933] mb-2">
                      {dia.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {getActividades(dia.key).map((val, i) => (
                        <Input
                          key={i}
                          placeholder={`Actividad ${i + 1}`}
                          value={val}
                          onChange={(e) =>
                            setActividad(dia.key, i, e.target.value)
                          }
                          className="text-sm"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-[#233933]">
                Vista previa
              </h2>
              <PreviewSemana
                nombreNino={nombre}
                colorAcento={color}
                actividades={actividades}
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
