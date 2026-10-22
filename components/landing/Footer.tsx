import Link from "next/link";
import Logo from "@/components/landing/Logo";
import { getSiteConfig } from "@/lib/site-config";
import { waMeUrl } from "@/lib/contacto";
import { getHomeDict, type HomeDict } from "@/lib/i18n/home";
import { prefijo, type Locale } from "@/lib/i18n";

// Selector de idioma. Va con ?idioma= para que el middleware guarde la
// elección en la cookie: sin eso, un visitante con el navegador en inglés que
// elige "Español" volvería a ser redirigido a /en.
const IDIOMAS: { locale: Locale; label: string; href: string }[] = [
  { locale: "es", label: "Español",   href: "/?idioma=es" },
  { locale: "en", label: "English",   href: "/en?idioma=en" },
  { locale: "pt", label: "Português", href: "/pt?idioma=pt" },
];

export default async function Footer({
  d = getHomeDict("es-py"),
  locale,
}: {
  d?: HomeDict;
  // Solo las páginas traducidas lo pasan; sin él no se muestra el selector.
  locale?: Locale;
} = {}) {
  const cfg = await getSiteConfig();
  // WhatsApp lives here in the footer for the rest of the flow — the floating
  // button is only on the home so it doesn't block conversion CTAs.
  const waUrl = waMeUrl(process.env.NEXT_PUBLIC_WHATSAPP ?? null, d.waFab.mensaje);
  return (
    <footer className="bg-[#22244e] px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo invert />
            </div>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              {d.footer.descripcion || cfg.site_description}
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-white/30 uppercase text-xs tracking-widest mb-3">
                {d.footer.productos}
              </p>
              <div className="space-y-2">
                <Link href={`${locale ? prefijo(locale) : ""}/personalizar/rutinas`} className="block text-white/60 hover:text-white transition-colors">
                  {d.footer.rutinas}
                </Link>
                <Link href={`${locale ? prefijo(locale) : ""}/personalizar/recompensas`} className="block text-white/60 hover:text-white transition-colors">
                  {d.footer.recompensas}
                </Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-white/30 uppercase text-xs tracking-widest mb-3">
                {d.footer.ayuda}
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
                  {d.footer.contacto}
                </Link>
                <Link href="/envios-y-devoluciones" className="block text-white/60 hover:text-white transition-colors">
                  {d.footer.envios}
                </Link>
                <Link href="/terminos" className="block text-white/60 hover:text-white transition-colors">
                  {d.footer.terminos}
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

        {locale && (
          <nav aria-label={d.footer.idioma} className="flex flex-wrap items-center gap-2 mb-6">
            {IDIOMAS.map((i) => (
              <Link
                key={i.locale}
                href={i.href}
                hrefLang={i.locale}
                aria-current={i.locale === locale ? "true" : undefined}
                className={`inline-flex items-center h-10 px-4 rounded-lg border text-sm font-semibold transition-colors ${
                  i.locale === locale
                    ? "border-white/40 text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {i.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Minirutina. {d.footer.derechos}
          </p>
          <p className="text-white/20 text-xs">
            {d.footer.hecho}
          </p>
        </div>
      </div>
    </footer>
  );
}
