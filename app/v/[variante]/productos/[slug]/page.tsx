import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/landing/SiteHeader";
import Footer from "@/components/landing/Footer";
import ProductGallery from "@/components/ProductGallery";
import MetaViewContent from "@/components/meta/MetaViewContent";
import PrecioProducto from "@/components/producto/PrecioProducto";
import { isVariante, localeDeVariante, prefijo, HTML_LANG, VARIANTES, type Variante } from "@/lib/i18n";
import { getHomeDict } from "@/lib/i18n/home";
import { getProducto, getProductoUI } from "@/lib/i18n/producto";
import { formatPrecio, precioEn, type PreciosProducto } from "@/lib/mercado";
import { leerTasas } from "@/lib/tasas";

// Se sirve en /productos/<slug>, /en/productos/<slug> y /pt/productos/<slug>:
// el middleware reescribe a /v/<variante>/productos/<slug> (ver lib/i18n).
//
// Se sirve desde el CDN. Las ediciones de precios y el toggle de pausa siguen
// saliendo al instante porque las acciones de /admin/cms revalidan esta
// ruta al guardar; el techo de tiempo es la red de seguridad si eso falla.
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return VARIANTES.flatMap((variante) =>
    ["rutinas", "recompensas"].map((slug) => ({ variante, slug })),
  );
}

export function generateMetadata({ params }: { params: { variante: string; slug: string } }): Metadata {
  if (!isVariante(params.variante)) return {};
  const producto = getProducto(params.slug, params.variante);
  if (!producto) return {};
  return {
    title: producto.nombre,
    description: producto.tagline,
    alternates: {
      canonical: `${prefijo(localeDeVariante(params.variante))}/productos/${params.slug}`,
      languages: {
        es: `/productos/${params.slug}`,
        en: `/en/productos/${params.slug}`,
        "pt-BR": `/pt/productos/${params.slug}`,
      },
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: { variante: string; slug: string };
}) {
  if (!isVariante(params.variante)) notFound();
  const variante: Variante = params.variante;
  const locale = localeDeVariante(variante);
  const producto = getProducto(params.slug, variante);
  if (!producto) notFound();
  const ui = getProductoUI(variante);
  const d = getHomeDict(variante);

  // CMS lookups: config (active + label overrides) y precios, en paralelo.
  // precios va con "*" para que la página no se rompa si todavía no se corrió
  // supabase/i18n_monedas.sql (las columnas ARS/BRL/USD no existirían).
  const [{ data: cfg }, { data: precioRow }, tasas] = await Promise.all([
    supabase
      .from("productos_config")
      .select("activo, nombre, tagline")
      .eq("producto", params.slug)
      .maybeSingle(),
    supabase
      .from("precios")
      .select("*")
      .eq("producto", params.slug)
      .maybeSingle(),
    // Solo hace falta afuera (ARS/BRL se calculan desde el USD).
    variante === "es-py" ? Promise.resolve({}) : leerTasas(supabase),
  ]);

  // Product paused → behave like it doesn't exist.
  if (cfg && cfg.activo === false) notFound();

  const precios = (precioRow ?? null) as PreciosProducto | null;

  // Los overrides de nombre/tagline del CMS están en español de Paraguay: solo
  // se aplican a esa variante (el tagline del impreso no sirve para el digital).
  const usaCms = variante === "es-py";
  const nombre  = (usaCms && cfg?.nombre  && cfg.nombre.trim())  || producto.nombre;
  const tagline = (usaCms && cfg?.tagline && cfg.tagline.trim()) || producto.tagline;

  // En es-py la moneda es siempre Gs. (el middleware solo manda ahí a quien
  // tiene moneda PYG), así que el precio sale en el HTML. En el resto lo elige
  // el cliente según la cookie de moneda.
  const precioPy = precioEn(precios, "PYG", "fisico");
  const precioFijo = usaCms
    ? (precioPy !== null ? formatPrecio(precioPy, "PYG") : producto.precioDesde)
    : null;
  const precio = precioFijo ?? <PrecioProducto precios={precios} tasas={tasas} />;

  return (
    <div className="min-h-screen bg-[#faf6e7] pb-24 md:pb-0">
      {locale !== "es" && (
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(HTML_LANG[locale])}` }}
        />
      )}
      <SiteHeader ancho="5xl" d={d} homeHref={prefijo(locale) || "/"} />
      <MetaViewContent
        producto={params.slug}
        precio={usaCms && precioPy !== null ? precioPy : undefined}
      />
      <main>
        {/* Hero del producto */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Carrusel de imágenes — 3 fotos por producto, naming
                convention: /public/productos/{slug}-{1,2,3}.png */}
            <ProductGallery
              images={[
                `/productos/${params.slug}-1.png`,
                `/productos/${params.slug}-2.png`,
                `/productos/${params.slug}-3.png`,
              ]}
              alt={nombre}
              accentColor={producto.accentColor}
            />

            {/* Info */}
            <div>
              <Link
                href={`${prefijo(locale)}/#productos`}
                className="text-xs font-semibold text-[#22244e]/40 hover:text-[#22244e] uppercase tracking-widest mb-4 inline-flex items-center gap-1"
              >
                {ui.volver}
              </Link>

              <h1 className="text-3xl md:text-4xl font-bold text-[#22244e] mt-2 mb-3">
                {nombre}
              </h1>
              <p className="text-[#22244e]/60 text-lg mb-6 leading-relaxed">
                {tagline}
              </p>

              {/* Precio — un solo número, sin 'desde' ni tachado */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#22244e]">
                  {precio}
                </span>
              </div>

              {/* Lo que incluye (resumen) */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 mb-6 space-y-2">
                {producto.incluye.slice(0, 4).map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-[#22244e]/70">
                    <span
                      className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-[#22244e]"
                      style={{ backgroundColor: producto.accentColor + "66" }}
                    >
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
                <p className="text-xs text-[#22244e]/40 pt-1">
                  {ui.incluidosMas(producto.incluye.length - 4)}
                </p>
              </div>

              {/* CTA */}
              <Link href={`${prefijo(locale)}${producto.customizerHref}`}>
                <Button className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl shadow-none border-0 text-base h-12">
                  {ui.cta}
                </Button>
              </Link>
              <p className="text-center text-xs text-[#22244e]/40 mt-3">
                {ui.bajoCta}
              </p>
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section className="bg-white px-6 py-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-2xl font-bold text-[#22244e] mb-4">
                {ui.queEs}
              </h2>
              <p className="text-[#22244e]/70 leading-relaxed mb-6">
                {producto.descripcion}
              </p>
              <div
                className="rounded-2xl px-5 py-4 border"
                style={{
                  backgroundColor: producto.accentColor + "22",
                  borderColor: producto.accentColor + "55",
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[#22244e]/50 mb-1">
                  {ui.paraQuien}
                </p>
                <p className="text-sm text-[#22244e]/80 leading-relaxed">
                  {producto.paraQuien}
                </p>
              </div>
            </div>

            {/* Incluye completo */}
            <div>
              <h2 className="text-2xl font-bold text-[#22244e] mb-4">
                {ui.queIncluye}
              </h2>
              <div className="space-y-3">
                {producto.incluye.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm text-[#22244e]/70"
                  >
                    <span
                      className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-[#22244e]"
                      style={{ backgroundColor: producto.accentColor + "66" }}
                    >
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Sticky mobile CTA — siempre visible al fondo en mobile para no
          obligar al usuario a scrollear al hero. Oculta en desktop (la CTA
          ya está en el hero). */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e7eb] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-[#22244e]/40 font-bold">
            {ui.etiquetaPrecio}
          </p>
          <p className="text-base font-bold text-[#22244e] leading-tight truncate">
            {precio}
          </p>
        </div>
        <Link href={`${prefijo(locale)}${producto.customizerHref}`} className="shrink-0">
          <Button className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 h-12 px-6 transition-all duration-200 ease-out active:scale-[0.98]">
            {ui.ctaCorto}
          </Button>
        </Link>
      </div>

      <Footer d={d} locale={locale} />
    </div>
  );
}
