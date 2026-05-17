// Header — server component. Reads the logo URL + site name from
// site_config so admin can swap them without a deploy.
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/lib/site-config";

export default async function Header() {
  const cfg = await getSiteConfig();

  return (
    <header className="sticky top-0 z-50 bg-[#faf6e7]/95 backdrop-blur-sm border-b border-[#e5e7eb]">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {cfg.logo_url ? (
            <Image
              src={cfg.logo_url}
              alt={cfg.site_name}
              width={160}
              height={40}
              priority
              unoptimized
              className="h-8 w-auto object-contain"
            />
          ) : (
            <>
              <span className="text-2xl">🌿</span>
              <span className="font-bold text-xl text-[#22244e] tracking-tight">
                {cfg.site_name.toLowerCase()}
              </span>
            </>
          )}
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

        {/* CTA */}
        <Link href="#productos">
          <Button className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 text-sm px-5 h-12">
            Personalizar tablero
          </Button>
        </Link>
      </div>
    </header>
  );
}
