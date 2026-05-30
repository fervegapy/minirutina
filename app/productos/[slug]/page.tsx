import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { productos } from "@/lib/productos";
import { supabase } from "@/lib/supabase";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ProductGallery from "@/components/ProductGallery";

// Force per-request so admin edits to FAQs and the "pause product"
// toggle are visible immediately (no stale SSG/ISR cache).
export const dynamic = "force-dynamic";

export default async function ProductoPage({
  params,
}: {
  params: { slug: string };
}) {
  const producto = productos[params.slug];
  if (!producto) notFound();

  // CMS lookups: config (active + label overrides), faqs, precios — all in
  // parallel.
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
      .select("id, pregunta, respuesta, orden")
      .eq("producto", params.slug)
      .order("orden", { ascending: true }),
    supabase
      .from("precios")
      .select("precio_impreso, precio_digital, precio_impreso_20, precio_digital_20")
      .eq("producto", params.slug)
      .maybeSingle(),
  ]);

  // Product paused → behave like it doesn't exist.
  if (cfg && cfg.activo === false) notFound();

  // Use DB faqs if present, otherwise fall back to the hardcoded ones
  // (covers the case where the CMS table hasn't been seeded yet).
  const faqs =
    faqRows && faqRows.length > 0
      ? faqRows.map((r) => ({ q: r.pregunta, a: r.respuesta }))
      : producto.faqs;

  // Merge CMS overrides + derived precio over the hardcoded base.
  // Card shows ONE representative price: the lowest variant available
  // (variant selection — impreso/digital and 10/20 stickers — happens
  // later in the customizer / checkout).
  const minPositive = (values: (number | null | undefined)[]) => {
    const nums = values.filter((n): n is number => typeof n === "number" && n > 0);
    return nums.length > 0 ? Math.min(...nums) : null;
  };

  const precioDb = (() => {
    if (!precioRow) return null;
    const m = minPositive([
      precioRow.precio_impreso,
      precioRow.precio_digital,
      precioRow.precio_impreso_20,
      precioRow.precio_digital_20,
    ]);
    return m !== null ? "Gs. " + m.toLocaleString("es-PY") : null;
  })();

  const nombre  = (cfg?.nombre  && cfg.nombre.trim())  || producto.nombre;
  const tagline = (cfg?.tagline && cfg.tagline.trim()) || producto.tagline;
  const precio  = precioDb ?? producto.precioDesde;

  return (
    <div className="min-h-screen bg-[#faf6e7]">
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
                  + {producto.incluye.length - 4} incluidos más
                </p>
              </div>

              {/* CTA */}
              <Link href={producto.customizerHref}>
                <Button className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl shadow-none border-0 text-base h-12">
                  Personalizar tablero
                </Button>
              </Link>
              <p className="text-center text-xs text-[#22244e]/40 mt-3">
                Listo en 5 minutos · Te llega en 48 horas
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

      </main>
      <Footer />
    </div>
  );
}
