"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import GenderPicker, { type Genero } from "@/components/customizer/GenderPicker";
import { track } from "@/lib/tracking";

// react-pdf needs DOM APIs at module load — client-only.
const PdfPagesPreview = dynamic(
  () => import("@/components/customizer/PdfPagesPreview"),
  { ssr: false },
);

const PASOS = ["Nombre", "Cantidad", "Sticker", "Vista previa"];
const OPCIONES: (10 | 20)[] = [10, 20];

// Per-step action title + subhead. Same pattern as the Rutinas wizard.
const STEPS_META: { title: string; sub: (nombre: string) => string }[] = [
  {
    title: "Contanos el nombre",
    sub:   () => "Y si es niño o niña, para personalizar los íconos",
  },
  {
    title: "¿Cuántos pasos va a tener?",
    sub:   () => "Es la cantidad de stickers que junta hasta llegar a la recompensa",
  },
  {
    title: "Elegí el sticker",
    sub:   () => "Es el que se pega cada vez que cumple un paso",
  },
  {
    title: "Mirá tu tablero",
    sub:   (n: string) => `Así va a quedar el de ${n || "tu niño"} · si te gusta, seguís al pago`,
  },
];

type StickerId = "estrella" | "check" | "corazon" | "brillante";
const STICKERS: { id: StickerId; emoji: string; label: string }[] = [
  { id: "estrella",  emoji: "⭐", label: "Estrella" },
  { id: "check",     emoji: "✅", label: "Check" },
  { id: "corazon",   emoji: "❤️", label: "Corazón" },
  { id: "brillante", emoji: "🌟", label: "Estrella con carita" },
];

export default function PersonalizarRecompensas() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState<Genero | null>(null);
  const [cantidad, setCantidad] = useState<10 | 20>(10);
  const [sticker, setSticker] = useState<StickerId>("estrella");

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Funnel: customizer entered (fires once on mount).
  useEffect(() => {
    track({ evento: "customizer_started", producto: "recompensas" });
  }, []);

  // Auto-generate PDF when entering preview step
  useEffect(() => {
    if (step === PASOS.length - 1 && !generatedRef.current) {
      generatedRef.current = true;
      generarPDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = () => {
    track({
      evento:   "step_completed",
      producto: "recompensas",
      paso:     PASOS[step],
    });
    setStep((s) => Math.min(s + 1, PASOS.length - 1));
  };
  const back = () => {
    if (step === PASOS.length - 1) {
      setPdfUrl(null);
      generatedRef.current = false;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const generarPDF = async () => {
    setPdfLoading(true);
    setPdfError(null);
    setPdfUrl(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview:    true,
          producto:   "recompensas",
          nombreNino: nombre,
          genero,
          cantidad,
        }),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
      track({ evento: "preview_generated", producto: "recompensas" });
    } catch (e: unknown) {
      setPdfError(e instanceof Error ? e.message : "Error desconocido");
      generatedRef.current = false;
    } finally {
      setPdfLoading(false);
    }
  };

  const continuar = () => {
    track({ evento: "checkout_started", producto: "recompensas" });
    const params = new URLSearchParams({
      producto: "recompensas",
      nombre_nino: nombre,
      // Color de acento se decide por género — guardamos el del género para compat.
      color_acento: genero === "nina" ? "#B86F60" : "#3D5C7E",
      personalizacion: JSON.stringify({ cantidad, genero, sticker }),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#faf6e7] px-4 py-10">
      <div className="max-w-lg mx-auto">
        {/* Subtítulo de contexto — medium weight, sin uppercase. */}
        <div className="text-center mb-5">
          <p className="text-base font-medium text-[#22244e]/70 mb-3">
            Tablero de Recompensas de {nombre || "tu niño"}
          </p>
          <StepIndicator steps={PASOS} current={step} />
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-6">
          {/* Título del paso — bold, dentro del card */}
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-[#22244e] mb-1">
              {STEPS_META[step]!.title}
            </h2>
            <p className="text-xs text-[#22244e]/50">
              {STEPS_META[step]!.sub(nombre)}
            </p>
          </div>

          {/* Paso 0: Nombre + género */}
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
              <GenderPicker value={genero} onChange={setGenero} />
            </div>
          )}

          {/* Paso 1: Cantidad de círculos */}
          {step === 1 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                {OPCIONES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCantidad(n)}
                    className={`rounded-2xl border-2 py-6 flex flex-col items-center gap-1 transition-all font-bold text-[#22244e] ${
                      cantidad === n
                        ? "border-[#22244e] bg-[#336aea]/20"
                        : "border-[#e5e7eb] hover:border-[#22244e]/40"
                    }`}
                  >
                    <span className="text-3xl">{n}</span>
                    <span className="text-xs font-semibold text-[#22244e]/60">pasos</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Sticker */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                {STICKERS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSticker(s.id)}
                    className={`relative rounded-2xl border-2 py-5 flex flex-col items-center gap-2 transition-all ${
                      sticker === s.id
                        ? "border-[#22244e] bg-[#336aea]/20"
                        : "border-[#e5e7eb] hover:border-[#22244e]/40"
                    }`}
                  >
                    <StickerImage id={s.id} emoji={s.emoji} />
                    <span className="text-sm font-semibold text-[#22244e]">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 3: Vista previa */}
          {step === 3 && (
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
                  <PdfPagesPreview url={pdfUrl} />
                  <p className="text-center text-xs text-[#22244e]/50">
                    🔒 Vista previa con marca de agua. La versión final y limpia se descarga después del pago.
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
    </main>
  );
}

// Renders the sticker illustration from /public/recompensas/stickers/{id}.png.
// Falls back to the emoji while the PNG hasn't been uploaded yet so the
// picker keeps working during the asset migration.
function StickerImage({ id, emoji }: { id: string; emoji: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="text-5xl leading-none">{emoji}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/recompensas/stickers/${id}.png`}
      alt=""
      className="w-16 h-16 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
