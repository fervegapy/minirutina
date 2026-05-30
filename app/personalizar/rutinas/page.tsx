"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import ColorPicker from "@/components/customizer/ColorPicker";
import IconPicker, {
  ICONOS_MANANA,
  ICONOS_NOCHE,
} from "@/components/customizer/IconPicker";
import GenderPicker, { type Genero } from "@/components/customizer/GenderPicker";
import { track } from "@/lib/tracking";

// react-pdf depends on browser DOM APIs (DOMMatrix, etc.) — load it client-only
// to avoid breaking the static prerender.
const PdfPagesPreview = dynamic(
  () => import("@/components/customizer/PdfPagesPreview"),
  { ssr: false },
);

const PASOS = ["Nombre", "Color", "Mañana", "Noche", "Vista previa"];
const REQUIRED_ICONS = 7;

// Per-step action title + supporting subhead. These promote the call to
// action above the product name + progress bar so the user always sees
// what to do next.
const STEPS_META: { title: string; sub: (nombre: string) => string }[] = [
  {
    title: "Contanos el nombre",
    sub:   () => "Y si es niño o niña, para personalizar los íconos",
  },
  {
    title: "Elegí el color",
    sub:   () => "Va a teñir la banda y los detalles del tablero",
  },
  {
    title: `Elegí ${REQUIRED_ICONS} actividades de la mañana`,
    sub:   () => "Tocá en el orden que querés que aparezcan",
  },
  {
    title: `Elegí ${REQUIRED_ICONS} actividades de la noche`,
    sub:   () => "Tocá en el orden que querés que aparezcan",
  },
  {
    title: "Mirá tu tablero",
    sub:   (n: string) => `Así va a quedar el de ${n || "tu niño"} · si te gusta, seguís al pago`,
  },
];

export default function PersonalizarRutinas() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState<Genero | null>(null);
  const [color, setColor] = useState("#a8c5a0");
  const [manana, setManana] = useState<string[]>([]);
  const [noche, setNoche] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  // Clear inline error when the user fixes the count
  useEffect(() => {
    if (step === 2 && manana.length === REQUIRED_ICONS) setValidationError(null);
    if (step === 3 && noche.length === REQUIRED_ICONS) setValidationError(null);
  }, [manana, noche, step]);

  // Scroll to top whenever the step changes — long pickers leave the user
  // halfway down the page when they advance.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Funnel: customizer entered (fires once on mount).
  useEffect(() => {
    track({ evento: "customizer_started", producto: "rutinas" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => {
    // Validation: mañana + noche must have exactly 7 icons
    if (step === 2 && manana.length !== REQUIRED_ICONS) {
      setValidationError(
        `Tenés que elegir ${REQUIRED_ICONS} actividades (llevás ${manana.length}).`
      );
      return;
    }
    if (step === 3 && noche.length !== REQUIRED_ICONS) {
      setValidationError(
        `Tenés que elegir ${REQUIRED_ICONS} actividades (llevás ${noche.length}).`
      );
      return;
    }
    setValidationError(null);
    // Track step completion (uses the current step's PASO label so we can
    // see which step the user finished, not which one they entered).
    track({
      evento: "step_completed",
      producto: "rutinas",
      paso: PASOS[step],
    });
    setStep((s) => Math.min(s + 1, PASOS.length - 1));
  };

  const back = () => {
    if (step === PASOS.length - 1) {
      setPdfUrl(null);
      generatedRef.current = false;
    }
    setValidationError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

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
          noche,
          genero,
        }),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
      track({ evento: "preview_generated", producto: "rutinas" });
    } catch (e: unknown) {
      setPdfError(e instanceof Error ? e.message : "Error desconocido");
      generatedRef.current = false;
    } finally {
      setPdfLoading(false);
    }
  };

  const continuar = () => {
    track({ evento: "checkout_started", producto: "rutinas" });
    const params = new URLSearchParams({
      producto: "rutinas",
      nombre_nino: nombre,
      color_acento: color,
      personalizacion: JSON.stringify({ manana, noche, genero }),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#faf6e7] px-4 py-10 pb-32 md:pb-10">
      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* Subtítulo de contexto — medium weight, sin uppercase. */}
        <div className="text-center mb-5">
          <p className="text-base font-medium text-[#22244e]/70 mb-3">
            Tablero de Rutinas de {nombre || "tu niño"}
          </p>
          <StepIndicator steps={PASOS} current={step} />
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-6">
          {/* Título del paso — bold, dentro del card, la acción principal */}
          <div className="mb-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-xl md:text-2xl font-bold text-[#22244e] leading-tight">
                {STEPS_META[step]!.title}
              </h2>
              {(step === 2 || step === 3) && (
                <span className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-[#336aea] text-white text-sm font-bold tabular-nums shadow-sm">
                  {(step === 2 ? manana : noche).length} / {REQUIRED_ICONS}
                </span>
              )}
            </div>
            <p className="text-xs text-[#22244e]/50">
              {STEPS_META[step]!.sub(nombre)}
            </p>
          </div>

          {step === 0 && (
            <div>
              <Input
                placeholder="Nombre del niño/a"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="text-base mb-6"
                autoFocus
              />
              <h3 className="font-bold text-sm mb-3 text-[#22244e]">
                ¿Es niño o niña?
              </h3>
              <GenderPicker value={genero} onChange={setGenero} accentColor={color} />
            </div>
          )}

          {step === 1 && (
            <div>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          )}

          {step === 2 && (
            <div>
              <IconPicker
                iconos={ICONOS_MANANA}
                selected={manana}
                onChange={setManana}
                max={REQUIRED_ICONS}
                accentColor={color}
                genero={genero}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <IconPicker
                iconos={ICONOS_NOCHE}
                selected={noche}
                onChange={setNoche}
                max={REQUIRED_ICONS}
                accentColor={color}
                genero={genero}
              />
            </div>
          )}

          {step === 4 && (
            <div>
              {pdfLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-[3px] border-[#336aea] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#22244e]/50">Generando tu tablero...</p>
                </div>
              )}

              {pdfError && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-500 mb-4">{pdfError}</p>
                  <Button
                    variant="outline"
                    onClick={() => { generatedRef.current = false; generarPDF(); }}
                    className="border-[#22244e] text-[#22244e] rounded-lg h-12 px-5"
                  >
                    Reintentar
                  </Button>
                </div>
              )}

              {pdfUrl && (
                <div className="space-y-3">
                  {/* Renders pages as canvas via pdf.js — works on iOS Safari
                      and scales to the container width on mobile. The PDF
                      itself carries the watermark (real protection). */}
                  <PdfPagesPreview url={pdfUrl} />
                  <p className="text-center text-xs text-[#22244e]/50">
                    🔒 Vista previa con marca de agua. La versión final y limpia se descarga después del pago.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {validationError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
            {validationError}
          </div>
        )}

        {/* Botones de navegación — sticky en mobile (siempre visibles para
            facilitar avanzar), inline en desktop. */}
        <div className="
          fixed bottom-0 left-0 right-0 z-30 px-4 py-3
          bg-[#faf6e7]/95 backdrop-blur-sm border-t border-[#e5e7eb]
          md:relative md:bottom-auto md:left-auto md:right-auto md:px-0 md:py-0
          md:bg-transparent md:backdrop-blur-none md:border-0
        ">
          <div className="flex gap-3 justify-between max-w-lg md:max-w-none mx-auto">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={back}
                className="border-[#22244e] text-[#22244e] rounded-lg h-12 px-5"
              >
                Atrás
              </Button>
            ) : (
              <div />
            )}

            {step < PASOS.length - 1 ? (
              <Button
                onClick={next}
                disabled={step === 0 && (!nombre.trim() || !genero)}
                className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 h-12 px-6"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={continuar}
                disabled={pdfLoading}
                className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 h-12 px-6"
              >
                Continuar al pago
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
