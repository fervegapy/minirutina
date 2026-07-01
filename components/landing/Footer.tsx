import Link from "next/link";
import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { waMeUrl } from "@/lib/contacto";

export default async function Footer() {
  const cfg = await getSiteConfig();
  // WhatsApp lives here in the footer for the rest of the flow — the floating
  // button is only on the home so it doesn't block conversion CTAs.
  const waUrl = waMeUrl(
    process.env.NEXT_PUBLIC_WHATSAPP ?? null,
    "Hola Minirutina, les escribo desde la web y me gustaría hacer una consulta.",
  );
  return (
    <footer className="bg-[#22244e] px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {cfg.logo_url ? (
                <Image
                  src={cfg.logo_url}
                  alt={cfg.site_name}
                  width={160}
                  height={40}
                  unoptimized
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <>
                  <span className="text-2xl">🌿</span>
                  <span className="font-bold text-xl text-white">
                    {cfg.site_name.toLowerCase()}
                  </span>
                </>
              )}
            </div>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              {cfg.site_description}
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-white/30 uppercase text-xs tracking-widest mb-3">
                Productos
              </p>
              <div className="space-y-2">
                <Link href="/personalizar/rutinas" className="block text-white/60 hover:text-white transition-colors">
                  Tablero de Rutinas
                </Link>
                <Link href="/personalizar/recompensas" className="block text-white/60 hover:text-white transition-colors">
                  Tablero de Recompensas
                </Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-white/30 uppercase text-xs tracking-widest mb-3">
                Ayuda
              </p>
              <div className="space-y-2">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-white/60 hover:text-white transition-colors"
                  >
                    WhatsApp
                  </a>
                )}
                <Link href="/contacto" className="block text-white/60 hover:text-white transition-colors">
                  Contacto
                </Link>
                <Link href="/envios-y-devoluciones" className="block text-white/60 hover:text-white transition-colors">
                  Envíos y devoluciones
                </Link>
                <Link href="/terminos" className="block text-white/60 hover:text-white transition-colors">
                  Términos y condiciones
                </Link>
                <a
                  href="mailto:soporte@minirutina.com"
                  className="block text-white/60 hover:text-white transition-colors"
                >
                  soporte@minirutina.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Minirutina. Todos los derechos reservados.
          </p>
          <p className="text-white/20 text-xs">
            Hecho con ❤️ para familias paraguayas
          </p>
        </div>
      </div>
    </footer>
  );
}
