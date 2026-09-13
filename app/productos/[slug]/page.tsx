import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProductoCopy } from "@/lib/productos";
import { supabase } from "@/lib/supabase";
import { getRegion } from "@/lib/region";
import { precioUsd, fmtUsd } from "@/lib/precios";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ProductGallery from "@/components/ProductGallery";
import CantidadPicker from "@/components/producto/CantidadPicker";

// Force per-request so admin edits to FAQs and the "pause product"
// toggle are visible immediately (no stale SSG/ISR cache).
export const dynamic = "force-dynamic";

export default async function ProductoPage({
  params,
}: {
  params: { slug: string };
}) {
  const region = await getRegion();
  const producto = getProductoCopy(params.slug, region);
  if (!producto) notFound();

  const esRecompensas = params.slug === "recompensas";

  // CMS lookups: config (active + label overrides), faqs, precios — all in
  // parallel. FAQs se filtran por región (o "ambas") desde el admin.
  const [
    { data: cfg },
    { data: faqRows },
    { data: precioRow },
  ] = await Promise.all([
    supabase
      .from("productos_config")
      .select("activo, nombre, tagline")
      .eq("producto", params.slug)
      .maybeSingle(),
    supabase
      .from("faqs")
      .select("id, pregunta, respuesta, orden, region")
      .eq("producto", params.slug)
      .order("orden", { ascending: true }),
    supabase
      .from("precios")
      .select("precio_impreso, precio_digital, precio_impreso_20, precio_digital_20, precio_digital_usd, precio_digital_20_usd")
      .eq("producto", params.slug)
      .maybeSingle(),
  ]);

  // Product paused → behave like it doesn't exist.
  if (cfg && cfg.activo === false) notFound();

  // En el exterior solo vendemos lo que tiene precio USD cargado a mano —
  // si no está configurado, el producto no existe para esa región.
  const usd10 = region === "intl" ? precioUsd(precioRow ?? undefined, false) : null;
  if (region === "intl" && usd10 === null) notFound();
  const usd20 = region === "intl" && esRecompensas ? precioUsd(precioRow ?? undefined, true) : null;

  const faqs =
    faqRows && faqRows.length > 0
      ? faqRows
          .filter((r) => r.region === "ambas" || r.region === region)
          .map((r) => ({ q: r.pregunta, a: r.respuesta }))
      : producto.faqs;
  const faqsFinal = faqs.length > 0 ? faqs : producto.faqs;

  const nombre  = (cfg?.nombre  && cfg.nombre.trim())  || producto.nombre;
  const tagline = (cfg?.tagline && cfg.tagline.trim()) || producto.tagline;

  // Precio impreso (Gs.) — de la DB, o el fallback hardcoded si la tabla
  // todavía no responde (p. ej. antes de correr la migración de columnas USD).
  const precioImpresoNum =
    typeof precioRow?.precio_impreso === "number" && precioRow.precio_impreso > 0
      ? precioRow.precio_impreso
      : parseInt(producto.precioDesde.replace(/\D/g, ""), 10) || 0;

  // Precio mostrado: Gs. impreso en Paraguay, USD digital en el exterior.
  const precio = region === "intl"
    ? fmtUsd(usd10!)
    : "Gs. " + precioImpresoNum.toLocaleString("es-PY");

  return (
    <div className="min-h-screen bg-[#faf6e7] pb-24 md:pb-0">
      <Header />
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
                href="/#productos"
                className="text-xs font-semibold text-[#22244e]/40 hover:text-[#22244e] uppercase tracking-widest mb-4 inline-flex items-center gap-1"
              >
                ← Todos los productos
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
                {region === "intl" && esRecompensas && usd20 !== null && (
                  <span className="block text-sm text-[#22244e]/50 mt-1">
                    20 pasos: {fmtUsd(usd20)}
                  </span>
                )}
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
                {producto.incluye.length > 4 && (
                  <p className="text-xs text-[#22244e]/40 pt-1">
                    + {producto.incluye.length - 4} incluidos más
                  </p>
                )}
              </div>

              {/* Recompensas: elegí la cantidad de pasos antes de personalizar */}
              {esRecompensas ? (
                <CantidadPicker
                  slug={params.slug}
                  precio10={region === "intl" ? usd10! : precioImpresoNum}
                  precio20={region === "intl" ? usd20 : (precioRow?.precio_impreso_20 ?? null)}
                  moneda={region === "intl" ? "usd" : "pyg"}
                />
              ) : (
                <Link href={producto.customizerHref}>
                  <Button className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl shadow-none border-0 text-base h-12">
                    Personalizar tablero
                  </Button>
                </Link>
              )}
              <p className="text-center text-xs text-[#22244e]/40 mt-3">
                {region === "intl"
                  ? "Listo en 5 minutos · Lo recibís por email al instante"
                  : "Listo en 5 minutos · Te llega en 48 horas"}
              </p>
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section className="bg-white px-6 py-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-2xl font-bold text-[#22244e] mb-4">
                ¿Qué es?
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
                  Para quién es
                </p>
                <p className="text-sm text-[#22244e]/80 leading-relaxed">
                  {producto.paraQuien}
                </p>
              </div>
            </div>

            {/* Incluye completo */}
            <div>
              <h2 className="text-2xl font-bold text-[#22244e] mb-4">
                Qué incluye
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

        {/* FAQs */}
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#22244e] mb-6 text-center">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {faqsFinal.map((f) => (
                <div key={f.q} className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                  <p className="font-bold text-sm text-[#22244e] mb-1">{f.q}</p>
                  <p className="text-sm text-[#22244e]/60 leading-relaxed">{f.a}</p>
                </div>
              ))}
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
            {region === "intl" ? "Versión digital" : "Versión impresa"}
          </p>
          <p className="text-base font-bold text-[#22244e] leading-tight truncate">
            {precio}
          </p>
        </div>
        <Link href={producto.customizerHref} className="shrink-0">
          <Button className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 h-12 px-6 transition-all duration-200 ease-out active:scale-[0.98]">
            Personalizar
          </Button>
        </Link>
      </div>

      <Footer />
    </div>
  );
}
