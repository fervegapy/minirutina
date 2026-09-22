// Header de la home anterior, archivada en /home-anterior. El header del sitio
// vivo es components/landing/SiteHeader.tsx — este queda solo para poder abrir
// la versión vieja y compararlas.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/landing/Logo";
import CartBadge from "@/components/landing/CartBadge";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#faf6e7]/95 backdrop-blur-sm border-b border-[#e5e7eb]">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo priority />
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#22244e]/70">
          <Link href="#como-funciona" className="hover:text-[#22244e] transition-colors">
            Cómo funciona
          </Link>
          <Link href="#productos" className="hover:text-[#22244e] transition-colors">
            Productos
          </Link>
          <Link href="#faq" className="hover:text-[#22244e] transition-colors">
            Preguntas
          </Link>
        </nav>

        {/* CTA + carrito */}
        <div className="flex items-center gap-2">
          <CartBadge />
          <Link href="#productos">
            <Button className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 text-sm px-5 h-12 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#336aea]/30 active:translate-y-0 active:scale-[0.98]">
              Personalizar tablero
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
