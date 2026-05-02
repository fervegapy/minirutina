"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center max-w-3xl mx-auto">
      <span className="inline-block text-sm font-semibold tracking-wide uppercase text-[#ecbc5d] mb-4">
        Tableros imprimibles para niños
      </span>
      <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-[#233933]">
        Rutinas que los niños <br className="hidden md:block" />
        aman seguir
      </h1>
      <p className="text-base md:text-lg text-[#233933]/70 mb-10 max-w-xl mx-auto">
        Crea tableros personalizados con el nombre y los colores favoritos de tu
        hijo. Descárgalos e imprímelos en casa.
      </p>
      <Link href="#productos">
        <Button
          size="lg"
          className="bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-lg px-10 py-3 text-base shadow-none border-0"
        >
          Ver productos
        </Button>
      </Link>
    </section>
  );
}
