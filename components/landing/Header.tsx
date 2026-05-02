"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#fffef6]/95 backdrop-blur-sm border-b border-[#e5e7eb]">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-xl text-[#233933] tracking-tight">
            minirutina
          </span>
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#233933]/70">
          <Link href="#como-funciona" className="hover:text-[#233933] transition-colors">
            Cómo funciona
          </Link>
          <Link href="#productos" className="hover:text-[#233933] transition-colors">
            Productos
          </Link>
          <Link href="#faq" className="hover:text-[#233933] transition-colors">
            Preguntas
          </Link>
        </nav>

        {/* CTA */}
        <Link href="#productos">
          <Button className="bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-lg shadow-none border-0 text-sm px-5">
            Crear mi tablero
          </Button>
        </Link>
      </div>
    </header>
  );
}
