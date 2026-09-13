"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import GenderPicker, { type Genero } from "@/components/customizer/GenderPicker";
import { track } from "@/lib/tracking";
import { useCarrito } from "@/lib/carrito";
import { useWizardPersist } from "@/lib/useWizardPersist";
import { getRegionClient } from "@/lib/region";

// react-pdf needs DOM APIs at module load — client-only.
const PdfPagesPreview = dynamic(
  () => import("@/components/customizer/PdfPagesPreview"),
  { ssr: false },
);

type PasoKind = "nombre" | "cantidad" | "sticker" | "preview";
const OPCIONES: (10 | 20)[] = [10, 20];

// Per-step action title + subhead. Same pattern as the Rutinas wizard.
const STEPS_META: Record<PasoKind, { label: string; title: string; sub: (nombre: string) => string }> = {
  nombre: {
    label: "Nombre",
    title: "Contanos el nombre",
    sub:   () => "Y si es niño o niña, para personalizar los íconos",
  },
  cantidad: {
    label: "Cantidad",
    title: "¿Cuántos pasos va a tener?",
    sub:   () => "Es la cantidad de stickers que junta hasta llegar a la recompensa",
  },
  sticker: {
    label: "Sticker",
    title: "Elegí el sticker",
    sub:   () => "Es el que se pega cada vez que cumple un paso",
  },
  preview: {
    label: "Vista previa",
    title: "Mirá tu tablero",
    sub:   (n: string) => `Así va a quedar el de ${n || "tu niño"} · si te gusta, seguís al pago`,
  },
};

type StickerId = "estrella" | "check" | "corazon" | "brillante";
const STICKERS: { id: StickerId; emoji: string; label: string }[] = [
  { id: "estrella",  emoji: "⭐", label: "Estrella" },
  { id: "check",     emoji: "✅", label: "Check" },
  { id: "corazon",   emoji: "❤️", label: "Corazón" },
  { id: "brillante", emoji: "🌟", label: "Estrella con carita" },
];

function PersonalizarRecompensasInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCarrito();

  // Si llegamos desde el detalle del producto con ?cantidad=10|20 ya elegida,
  // nos saltamos el paso "Cantidad" del wizard.
  const cantidadQuery = searchParams.get("cantidad");
  const cantidadFija: 10 | 20 | null =
    cantidadQuery === "10" ? 10 : cantidadQuery === "20" ? 20 : null;
  const PASOS: PasoKind[] = cantidadFija
    ? ["nombre", "sticker", "preview"]
    : ["nombre", "cantidad", "sticker", "preview"];

  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState<Genero | null>(null);
  const [cantidad, setCantidad] = useState<10 | 20>(cantidadFija ?? 10);
  const [sticker, setSticker] = useState<StickerId>("estrella");

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  const kind = PASOS[step]!;

  // Survive browser back / refresh: restore the draft when the page remounts.
  const persist = useWizardPersist(
    "wizard:recompensas",
    { step, nombre, genero, cantidad, sticker },
    (s) => {
      if (typeof s.nombre === "string") setNombre(s.nombre);
      if (s.genero === "nino" || s.genero === "nina") setGenero(s.genero);
      if (!cantidadFija && (s.cantidad === 10 || s.cantidad === 20)) setCantidad(s.cantidad);
      if (s.sticker && STICKERS.some((st) => st.id === s.sticker)) setSticker(s.sticker);
      if (typeof s.step === "number") setStep(Math.min(Math.max(s.step, 0), PASOS.length - 1));
    },
  );

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
      paso:     STEPS_META[kind].label,
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
    // Color de acento se decide por género — guardamos el del género para compat.
    const colorAcento = genero === "nina" ? "#B86F60" : "#3D5C7E";
    // En el exterior el tablero es siempre digital — no se ofrece impreso.
    const formato = getRegionClient() === "intl" ? "digital" : undefined;
    const item = addItem({
      producto:        "recompensas",
      nombre_nino:     nombre,
      color_acento:    colorAcento,
      genero,
      personalizacion: { cantidad, genero, sticker },
      formato,
    });
    track({
      evento:   "checkout_started",
      producto: "recompensas",
      data:     { cart_item_id: item.id, formato: item.formato, cantidad },
    });
    // The tablero is in the cart now — next visit starts a fresh wizard.
    persist.clear();
    router.push("/checkout");
  };

  return (
    <main className="min-h-screen bg-[#faf6e7] px-4 py-10 pb-32 md:pb-10">
      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* Subtítulo de contexto — medium weight, sin uppercase. */}
        <div className="text-center mb-5">
          <p className="text-base font-medium text-[#22244e]/70 mb-3">
            Tablero de Recompensas de {nombre || "tu niño"}
          </p>
          <StepIndicator steps={PASOS.map((k) => STEPS_META[k].label)} current={step} />
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 md:p-6 mb-6">
          {/* Título del paso — bold, dentro del card */}
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-[#22244e] mb-1">
              {STEPS_META[kind].title}
            </h2>
            <p className="text-xs text-[#22244e]/50">
              {STEPS_META[kind].sub(nombre)}
            </p>
          </div>

          {/* Nombre + género */}
          {kind === "nombre" && (
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

          {/* Cantidad de círculos — solo si no vino ya fijada por el detalle del producto */}
          {kind === "cantidad" && (
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
          {kind === "sticker" && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          {kind === "preview" && (
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

        {/* Botones de navegación — sticky en mobile */}
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

export default function PersonalizarRecompensas() {
  return (
    <Suspense>
      <PersonalizarRecompensasInner />
    </Suspense>
  );
}
