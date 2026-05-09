"use client";
import { useState, useEffect, useRef } from "react";
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

const PASOS = ["Nombre", "Color", "Mañana", "Siesta", "Noche", "Vista previa", "Tu tablero"];

export default function PersonalizarRutinas() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#a8c5a0");
  const [manana, setManana] = useState<string[]>([]);
  const [siesta, setSiesta] = useState<string[]>([]);
  const [noche, setNoche] = useState<string[]>([]);

  // PDF generation state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  const next = () => setStep((s) => Math.min(s + 1, PASOS.length - 1));
  const back = () => {
    if (step === PASOS.length - 1) {
      // Reset PDF so it regenerates if user goes back and forward again
      setPdfUrl(null);
      generatedRef.current = false;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  // Auto-generate PDF when reaching the last step
  useEffect(() => {
    if (step === PASOS.length - 1 && !generatedRef.current) {
      generatedRef.current = true;
      generarPDF();
    }
  }, [step]);

  const generarPDF = async () => {
    setPdfLoading(true);
    setPdfError(null);
    setPdfUrl(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview: true,
          nombreNino: nombre,
          colorAcento: color,
          manana,
          siesta,
          noche,
        }),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (e: unknown) {
      setPdfError(e instanceof Error ? e.message : "Error desconocido");
      generatedRef.current = false;
    } finally {
      setPdfLoading(false);
    }
  };

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

          {step === 6 && (
            <div>
              <h2 className="font-bold text-lg mb-1 text-[#233933]">
                Tu tablero
              </h2>
              <p className="text-xs text-[#233933]/50 mb-5">
                Así va a quedar impreso el tablero de {nombre || "tu niño"}
              </p>

              {pdfLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-[3px] border-[#ecbc5d] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#233933]/50">Generando tu tablero...</p>
                </div>
              )}

              {pdfError && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-500 mb-4">{pdfError}</p>
                  <Button
                    variant="outline"
                    onClick={() => { generatedRef.current = false; generarPDF(); }}
                    className="border-[#233933] text-[#233933] rounded-lg"
                  >
                    Reintentar
                  </Button>
                </div>
              )}

              {pdfUrl && (
                <div className="space-y-3">
                  <a href={pdfUrl} download={`tablero-${nombre}.pdf`} className="block">
                    <Button className="w-full bg-[#233933] hover:bg-[#1a2b26] text-white font-bold rounded-xl shadow-none border-0">
                      📥 Descargar borrador
                    </Button>
                  </a>
                  <p className="text-center text-xs text-[#233933]/40">
                    Este es el borrador con los íconos incluidos que hayas cargado. El diseño final es idéntico.
                  </p>
                </div>
              )}
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
              disabled={pdfLoading}
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
