// Header del sitio público: home y detalle de producto.
//
// A propósito no tiene nav ni CTA. En la home, tres links de sección competían
// con las tarjetas de producto, que son lo único que queremos que se toque. En
// el detalle era peor: usaba el header de la home, así que ofrecía un
// "Personalizar tablero" que duplicaba el CTA propio de la página y links a
// #como-funciona y #faq, anclas que en /productos/* no existen y no llevaban a
// ninguna parte.
//
// Queda lo que sirve en las dos páginas: volver al inicio, el carrito (que
// puede tener items de otro chico) y WhatsApp.
import Link from "next/link";
import Logo from "@/components/landing/Logo";
import { waMeUrl } from "@/lib/contacto";
import CartBadge from "@/components/landing/CartBadge";
import { getHomeDict, type HomeDict } from "@/lib/i18n/home";
import type { Locale } from "@/lib/i18n";
import SelectorMercado from "@/components/mercado/SelectorMercado";
import AvisoPais from "@/components/mercado/AvisoPais";

export default function SiteHeader({
  // El contenedor acompaña el ancho del contenido de cada página, si no en
  // desktop el logo queda corrido respecto de lo que hay abajo: la home es
  // max-w-3xl y el detalle de producto max-w-5xl. Las clases van literales
  // porque Tailwind no ve las que se arman concatenando.
  ancho = "3xl",
  d = getHomeDict("es-py"),
  homeHref = "/",
  locale = "es",
}: {
  ancho?: "3xl" | "5xl";
  d?: HomeDict;
  homeHref?: string;
  // Idioma de la página: lo muestra el selector de país/idioma.
  locale?: Locale;
}) {
  const waUrl = waMeUrl(process.env.NEXT_PUBLIC_WHATSAPP ?? null, d.header.waMensaje);

  return (
    <>
    {/* Arriba de todo y solo si el país de la IP sugiere otro idioma. Fuera
        del header fijo para que no ocupe pantalla al scrollear. */}
    <AvisoPais locale={locale} />
    <header className="sticky top-0 z-50 bg-[#faf6e7]/95 backdrop-blur-sm border-b border-[#e5e7eb]">
      <div
        className={`${
          ancho === "5xl" ? "max-w-5xl" : "max-w-3xl"
        } mx-auto px-6 h-16 flex items-center justify-between`}
      >
        <Link href={homeHref} className="flex items-center gap-2">
          <Logo priority />
        </Link>

        <div className="flex items-center gap-2">
          <CartBadge />
          <SelectorMercado locale={locale} />
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              // En mobile no entra junto al selector: WhatsApp sigue en el
              // botón flotante y en el footer.
              className="hidden sm:inline-flex items-center h-10 px-4 rounded-lg border border-[#e5e7eb] text-sm font-semibold text-[#22244e] hover:bg-[#22244e]/5 transition-colors"
            >
              {d.header.consultar}
            </a>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
