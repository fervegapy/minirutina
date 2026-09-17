"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // El video del hero no se carga hasta que la página terminó de cargar. Con
  // `autoPlay` el navegador ignora `preload` y baja el archivo entero compitiendo
  // con el JS y las fuentes: así el tráfico de campaña en 4G veía un recuadro
  // vacío varios segundos y rebotaba antes de que el Pixel disparara.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefiereMenosMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const ahorroDatos = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    // En ambos casos queda la imagen fija, que ya es el diseño final.
    if (prefiereMenosMovimiento || ahorroDatos) return;

    const cargar = () => {
      video
        .querySelectorAll<HTMLSourceElement>("source[data-src]")
        .forEach((source) => {
          source.src = source.dataset.src!;
          source.removeAttribute("data-src");
        });
      video.load();
      // Puede rechazar por políticas de autoplay; si pasa, queda la imagen.
      video.play().catch(() => {});
    };

    if (document.readyState === "complete") {
      cargar();
      return;
    }
    window.addEventListener("load", cargar, { once: true });
    return () => window.removeEventListener("load", cargar);
  }, []);

  return (
    <section className="bg-[#faf6e7] overflow-hidden">
      {/* Two-column edge-to-edge layout. Image is the dominant half on the
          right and bleeds to the page edge. Text sits on the left with
          internal padding so it doesn't kiss the screen edge. */}
      <div className="grid md:grid-cols-[1fr_1.1fr] items-stretch min-h-[560px] md:min-h-[680px]">
        {/* Left — copy + CTAs */}
        <div className="flex items-center px-6 py-14 md:py-20 md:px-12 lg:px-16 order-2 md:order-1">
          <div className="max-w-md">
            <span className="inline-block bg-[#336aea]/20 text-[#22244e] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              Personalizá y te enviamos en 48hs
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#22244e] leading-[1.05] mb-6">
              Hacé que las actividades del día a día{" "}
              <span className="text-[#336aea]">dejen de ser una pelea.</span>
            </h1>
            <p className="text-[#22244e]/70 text-lg leading-relaxed mb-8">
              Tableros visuales personalizados que le muestran a tu peque el paso a paso al despertar y a la noche, y le ayudan a crear buenos hábitos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="#productos">
                <Button className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 text-base px-8 h-12 w-full sm:w-auto transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#336aea]/30 active:translate-y-0 active:scale-[0.98]">
                  Personalizar tablero
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button variant="outline" className="border-[#22244e]/30 text-[#22244e] hover:bg-[#22244e]/5 rounded-lg font-semibold text-base px-8 h-12 w-full sm:w-auto transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
                  Ver cómo funciona
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-sm text-[#22244e]/50">
              <div className="flex items-center gap-1.5">
                <span>✓</span>
                <span>Envío a todo el país</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>✓</span>
                <span>Impresión premium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>✓</span>
                <span>100% personalizado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — loop ambiental sin sonido. La imagen es el frame 0 del propio
            video, así cuando arranca no se nota el cambio. */}
        <div className="relative bg-[#efe9d6] min-h-[360px] md:min-h-0 order-1 md:order-2 overflow-hidden">
          {/* Va como imagen y no como atributo `poster` del video: Chrome mide
              como LCP el primer frame del video e ignora el poster, así que
              diferir el video se llevaba el LCP a 5s. Una imagen sí es candidata
              LCP, y como el video termina del mismo tamaño renderizado su frame
              no la reemplaza (el LCP solo se actualiza si es más grande). */}
          <Image
            src="/hero/v3/poster.webp"
            alt="Un nene marcando como lista una actividad en su tablero de rutinas"
            fill
            sizes="(max-width: 767px) 100vw, 55vw"
            priority
            unoptimized
            className="object-cover"
          />
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            onCanPlay={(e) => e.currentTarget.classList.remove("opacity-0")}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500"
          >
            {/* `data-src` en vez de `src`: el efecto de arriba las activa recién
                después del load. El navegador toma la primera fuente cuyo media
                coincida y cuyo formato soporte, así que mobile va primero y el
                MP4 queda de fallback para Safari. La versión va en la carpeta
                (/hero/v3/) porque se sirve con cache immutable: un re-encode
                tiene que ir a /hero/v4/ para que el navegador lo vea. */}
            <source data-src="/hero/v3/mobile.webm"  media="(max-width: 767px)" type="video/webm" />
            <source data-src="/hero/v3/mobile.mp4"   media="(max-width: 767px)" type="video/mp4"  />
            <source data-src="/hero/v3/desktop.webm" type="video/webm" />
            <source data-src="/hero/v3/desktop.mp4"  type="video/mp4"  />
          </video>

          {/* Floating delivery pill — top-right. Warm golden accent so
              it contrasts with the blue CTAs/text without competing. */}
          <div className="hidden md:block absolute top-8 right-8 bg-[#ecbc5d] rounded-2xl px-4 py-2.5 shadow-sm">
            <p className="text-xs font-bold text-[#22244e]">Te llega en 48 hs</p>
          </div>
        </div>
      </div>
    </section>
  );
}
