"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepIndicator from "@/components/customizer/StepIndicator";
import GenderPicker, { type Genero } from "@/components/customizer/GenderPicker";
import { track } from "@/lib/tracking";
import { metaTrack } from "@/lib/meta-pixel";
import { useCarrito } from "@/lib/carrito";
import { useWizardPersist } from "@/lib/useWizardPersist";
import { getCustomizerDict } from "@/lib/i18n/compra";
import { prefijo, type Locale } from "@/lib/i18n";

// react-pdf needs DOM APIs at module load — client-only.
const PdfPagesPreview = dynamic(
  () => import("@/components/customizer/PdfPagesPreview"),
  { ssr: false },
);

// Se sirve en /personalizar/recompensas (español) y en /en|/pt/… (ver
// app/[locale]/personalizar/recompensas). PASOS en español es para el tracking.
const PASOS = ["Nombre", "Cantidad", "Sticker", "Vista previa"];
const OPCIONES: (10 | 20)[] = [10, 20];

type StickerId = "estrella" | "check" | "corazon" | "brillante";
const STICKERS: { id: StickerId; emoji: string }[] = [
  { id: "estrella",  emoji: "⭐" },
  { id: "check",     emoji: "✅" },
  { id: "corazon",   emoji: "❤️" },
  { id: "brillante", emoji: "🌟" },
];

export default function RecompensasWizard({ idioma = "es" }: { idioma?: Locale }) {
  const t = getCustomizerDict(idioma);
  // Per-step action title + subhead. Same pattern as the Rutinas wizard.
  const STEPS_META = t.recompensas.meta;
  const router = useRouter();
  const { addItem } = useCarrito();
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState<Genero | null>(null);
  const [cantidad, setCantidad] = useState<10 | 20>(10);
  const [sticker, setSticker] = useState<StickerId>("estrella");

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  // Survive browser back / refresh: restore the draft when the page remounts.
  const persist = useWizardPersist(
    "wizard:recompensas",
    { step, nombre, genero, cantidad, sticker },
    (s) => {
      if (typeof s.nombre === "string") setNombre(s.nombre);
      if (s.genero === "nino" || s.genero === "nina") setGenero(s.genero);
      if (s.cantidad === 10 || s.cantidad === 20) setCantidad(s.cantidad);
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
      paso:     PASOS[step],
    });
    // Meta: the name step is the first real commitment — remarketing
    // audience for people who started customizing but didn't buy.
    if (step === 0) {
      metaTrack("CustomizeProduct", { content_name: "recompensas", content_ids: ["recompensas"], content_type: "product" });
    }
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
          idioma,
        }),
      });
      if (!res.ok) throw new Error(t.errorPdf);
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
      track({ evento: "preview_generated", producto: "recompensas" });
    } catch (e: unknown) {
      setPdfError(e instanceof Error ? e.message : t.errorDesconocido);
      generatedRef.current = false;
    } finally {
      setPdfLoading(false);
    }
  };

  const continuar = () => {
    // Color de acento se decide por género — guardamos el del género para compat.
    const colorAcento = genero === "nina" ? "#B86F60" : "#3D5C7E";
    const item = addItem({
      producto:        "recompensas",
      nombre_nino:     nombre,
      color_acento:    colorAcento,
      genero,
      // El idioma viaja con el tablero: con él se arma el PDF y el email.
      personalizacion: { cantidad, genero, sticker, idioma },
    });
    track({
      evento:   "checkout_started",
      producto: "recompensas",
      data:     { cart_item_id: item.id, formato: item.formato, cantidad },
    });
    // The tablero is in the cart now — next visit starts a fresh wizard.
    persist.clear();
    router.push(`${prefijo(idioma)}/checkout`);
  };

  return (
    <main className="min-h-screen bg-[#faf6e7] px-4 py-10 pb-32 md:pb-10">
      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* Subtítulo de contexto — medium weight, sin uppercase. */}
        <div className="text-center mb-5">
          <p className="text-base font-medium text-[#22244e]/70 mb-3">
            {t.recompensas.tituloTablero(nombre)}
          </p>
          <StepIndicator steps={t.recompensas.pasos} current={step} pasoDe={t.pasoDe} />
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 md:p-6 mb-6">
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
                placeholder={t.placeholderNombre}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="text-base mb-6"
                autoFocus
              />
              <h3 className="font-bold text-sm mb-3 text-[#22244e]">
                {t.esNinoONina}
              </h3>
              <GenderPicker
                value={genero}
                onChange={setGenero}
                idioma={idioma}
                etiquetas={{ nino: t.nino, nina: t.nina }}
              />
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
                    <span className="text-xs font-semibold text-[#22244e]/60">{t.recompensas.pasosUnidad}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Sticker */}
          {step === 2 && (
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
                      {t.recompensas.stickers[s.id]}
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
                  <p className="text-sm text-[#22244e]/50">{t.generando}</p>
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
                    {t.reintentar}
                  </Button>
                </div>
              )}

              {pdfUrl && (
                <div className="space-y-3">
                  <PdfPagesPreview url={pdfUrl} cargando={t.cargandoPreview} />
                  <p className="text-center text-xs text-[#22244e]/50">
                    {t.marcaDeAgua}
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
                {t.atras}
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
                {t.siguiente}
              </Button>
            ) : (
              <Button
                onClick={continuar}
                disabled={pdfLoading}
                className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 h-12 px-6"
              >
                {t.continuarPago}
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
