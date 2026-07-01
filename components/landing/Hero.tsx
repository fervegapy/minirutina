"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
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

        {/* Right — hero video. Autoplays muted on loop so it works as an
            ambient loop without sound. preload=metadata keeps initial
            page weight low — the file only downloads once it's about to
            play. */}
        <div className="relative bg-[#efe9d6] min-h-[360px] md:min-h-0 order-1 md:order-2 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          >
            {/* WebM first — better quality at smaller size, preferred by
                Chrome/Firefox/Edge. MP4 fallback for Safari.
                Filenames are versioned so re-encodes bust the CDN/browser
                cache without having to wait for stale headers to expire. */}
            <source src="/hero-v2.webm" type="video/webm" />
            <source src="/hero-v2.mp4"  type="video/mp4"  />
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
