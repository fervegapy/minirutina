"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="bg-[#faf6e7] px-6 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <span className="inline-block bg-[#336aea]/20 text-[#22244e] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
            📦 Impreso y enviado a tu puerta
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#22244e] leading-tight mb-6">
            Tableros para niños
            <br />
            <span className="text-[#336aea]">listos para colgar.</span>
          </h1>
          <p className="text-[#22244e]/70 text-lg leading-relaxed mb-8 max-w-md">
            Personalizás el diseño en minutos. Nosotros lo imprimimos en alta calidad y lo enviamos directo a tu casa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="#productos">
              <Button className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 text-base px-8 h-12 w-full sm:w-auto">
                Personalizar tablero
              </Button>
            </Link>
            <Link href="#como-funciona">
              <Button variant="outline" className="border-[#22244e]/30 text-[#22244e] hover:bg-[#22244e]/5 rounded-lg font-semibold text-base px-8 h-12 w-full sm:w-auto">
                Ver cómo funciona
              </Button>
            </Link>
          </div>
          {/* Trust signals */}
          <div className="flex items-center gap-6 mt-10 text-sm text-[#22244e]/50">
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

        {/* Visual placeholder — swap for real photo */}
        <div className="relative">
          <div className="bg-[#f5f0e8] rounded-3xl aspect-square flex flex-col items-center justify-center text-center p-8 border border-[#e5e7eb]">
            <div className="text-7xl mb-4">🖼️</div>
            <p className="text-[#22244e]/40 text-sm font-medium">
              Foto de producto<br />va acá
            </p>
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-4 bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-xs font-bold text-[#22244e]">+200 familias</p>
                <p className="text-[10px] text-[#22244e]/50">ya tienen su tablero</p>
              </div>
            </div>
          </div>
          {/* Floating color badge */}
          <div className="absolute -top-4 -right-4 bg-[#336aea] rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-[#22244e]">Listo en 3-5 días</p>
          </div>
        </div>
      </div>
    </section>
  );
}
