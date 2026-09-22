// Header de la home: sin nav institucional. El nav de la home anterior ofrecía
// tres destinos que competían con los productos; acá lo único clickeable
// además del logo es el carrito y WhatsApp.
import Link from "next/link";
import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { waMeUrl } from "@/lib/contacto";
import CartBadge from "@/components/landing/CartBadge";

export default async function HeaderSimple() {
  const cfg = await getSiteConfig();
  const waUrl = waMeUrl(
    process.env.NEXT_PUBLIC_WHATSAPP ?? null,
    "Hola Minirutina, tengo una consulta sobre los tableros.",
  );

  return (
    <header className="sticky top-0 z-50 bg-[#faf6e7]/95 backdrop-blur-sm border-b border-[#e5e7eb]">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
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

        <div className="flex items-center gap-3">
          <CartBadge />
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-10 px-4 rounded-lg border border-[#e5e7eb] text-sm font-semibold text-[#22244e] hover:bg-[#22244e]/5 transition-colors"
            >
              Consultar
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
