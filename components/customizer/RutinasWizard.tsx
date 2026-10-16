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
import { metaTrack } from "@/lib/meta-pixel";
import { useCarrito } from "@/lib/carrito";
import { useWizardPersist } from "@/lib/useWizardPersist";
import { getCustomizerDict } from "@/lib/i18n/compra";
import { prefijo, type Locale } from "@/lib/i18n";

// react-pdf depends on browser DOM APIs (DOMMatrix, etc.) — load it client-only
// to avoid breaking the static prerender.
const PdfPagesPreview = dynamic(
  () => import("@/components/customizer/PdfPagesPreview"),
  { ssr: false },
);

// Se sirve en /personalizar/rutinas (español) y /en|/pt/personalizar/rutinas
// (app/[locale]/personalizar/rutinas). Los nombres de paso en español siguen
// yendo al tracking para que el embudo no se parta por idioma.
const PASOS = ["Nombre", "Color", "Mañana", "Noche", "Vista previa"];
const REQUIRED_ICONS = 7;

export default function RutinasWizard({ idioma = "es" }: { idioma?: Locale }) {
  const t = getCustomizerDict(idioma);
  // Per-step action title + supporting subhead. These promote the call to
  // action above the product name + progress bar so the user always sees
  // what to do next.
  const STEPS_META = t.rutinas.meta(REQUIRED_ICONS);
  const router = useRouter();
  const { addItem } = useCarrito();
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

  // Survive browser back / refresh: restore the draft when the page remounts.
  // (The PDF preview regenerates itself via the step effect below.)
  const persist = useWizardPersist(
    "wizard:rutinas",
    { step, nombre, genero, color, manana, noche },
    (s) => {
      if (typeof s.nombre === "string") setNombre(s.nombre);
      if (s.genero === "nino" || s.genero === "nina") setGenero(s.genero);
      if (typeof s.color === "string") setColor(s.color);
      if (Array.isArray(s.manana)) setManana(s.manana);
      if (Array.isArray(s.noche)) setNoche(s.noche);
      if (typeof s.step === "number") setStep(Math.min(Math.max(s.step, 0), PASOS.length - 1));
    },
  );

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
        t.rutinas.faltan(REQUIRED_ICONS, manana.length)
      );
      return;
    }
    if (step === 3 && noche.length !== REQUIRED_ICONS) {
      setValidationError(
        t.rutinas.faltan(REQUIRED_ICONS, noche.length)
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
    // Meta: the name step is the first real commitment — remarketing
    // audience for people who started customizing but didn't buy.
    if (step === 0) {
      metaTrack("CustomizeProduct", { content_name: "rutinas", content_ids: ["rutinas"], content_type: "product" });
    }
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
          idioma,
        }),
      });
      if (!res.ok) throw new Error(t.errorPdf);
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
      track({ evento: "preview_generated", producto: "rutinas" });
    } catch (e: unknown) {
      setPdfError(e instanceof Error ? e.message : t.errorDesconocido);
      generatedRef.current = false;
    } finally {
      setPdfLoading(false);
    }
  };

  const continuar = () => {
    // Add the personalised tablero to the cart. Format defaults to
    // 'fisico'; the customer can flip to digital per-item in /checkout.
    const item = addItem({
      producto:        "rutinas",
      nombre_nino:     nombre,
      color_acento:    color,
      genero,
      // El idioma viaja con el tablero: con él se arma el PDF y el email.
      personalizacion: { manana, noche, genero, idioma },
    });
    track({
      evento:   "checkout_started",
      producto: "rutinas",
      data:     { cart_item_id: item.id, formato: item.formato },
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
            {t.rutinas.tituloTablero(nombre)}
          </p>
          <StepIndicator steps={t.rutinas.pasos} current={step} pasoDe={t.pasoDe} />
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 md:p-6 mb-6">
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
                accentColor={color}
                idioma={idioma}
                etiquetas={{ nino: t.nino, nina: t.nina }}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <ColorPicker value={color} onChange={setColor} nombres={t.colores} />
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
                idioma={idioma}
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
                idioma={idioma}
              />
            </div>
          )}

          {step === 4 && (
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
                  {/* Renders pages as canvas via pdf.js — works on iOS Safari
                      and scales to the container width on mobile. The PDF
                      itself carries the watermark (real protection). */}
                  <PdfPagesPreview url={pdfUrl} cargando={t.cargandoPreview} />
                  <p className="text-center text-xs text-[#22244e]/50">
                    {t.marcaDeAgua}
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
