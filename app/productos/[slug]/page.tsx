import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { productos } from "@/lib/productos";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export function generateStaticParams() {
  return Object.keys(productos).map((slug) => ({ slug }));
}

export default function ProductoPage({
  params,
}: {
  params: { slug: string };
}) {
  const producto = productos[params.slug];
  if (!producto) notFound();

  return (
    <div className="min-h-screen bg-[#fffef6]">
      <Header />
      <main>
        {/* Hero del producto */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Imagen placeholder */}
            <div
              className="rounded-3xl aspect-square flex flex-col items-center justify-center border border-[#e5e7eb]"
              style={{ backgroundColor: producto.accentColor + "22" }}
            >
              <span className="text-8xl mb-4">{producto.emoji}</span>
              <p className="text-sm text-[#233933]/30 font-medium">
                Foto del producto
              </p>
            </div>

            {/* Info */}
            <div>
              <Link
                href="/#productos"
                className="text-xs font-semibold text-[#233933]/40 hover:text-[#233933] uppercase tracking-widest mb-4 inline-flex items-center gap-1"
              >
                ← Todos los productos
              </Link>

              <h1 className="text-3xl md:text-4xl font-bold text-[#233933] mt-2 mb-3">
                {producto.nombre}
              </h1>
              <p className="text-[#233933]/60 text-lg mb-6 leading-relaxed">
                {producto.tagline}
              </p>

              {/* Precio */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-sm text-[#233933]/50 font-medium">desde</span>
                <span className="text-4xl font-bold text-[#233933]">
                  {producto.precioDesde}
                </span>
              </div>

              {/* Lo que incluye (resumen) */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 mb-6 space-y-2">
                {producto.incluye.slice(0, 4).map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-[#233933]/70">
                    <span
                      className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-[#233933]"
                      style={{ backgroundColor: producto.accentColor + "66" }}
                    >
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
                <p className="text-xs text-[#233933]/40 pt-1">
                  + {producto.incluye.length - 4} incluidos más
                </p>
              </div>

              {/* CTA */}
              <Link href={producto.customizerHref}>
                <Button className="w-full bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-xl shadow-none border-0 text-base py-3">
                  Personalizar mi tablero →
                </Button>
              </Link>
              <p className="text-center text-xs text-[#233933]/40 mt-3">
                Listo en 5 minutos · Enviamos en 3-5 días hábiles
              </p>
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section className="bg-white px-6 py-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-2xl font-bold text-[#233933] mb-4">
                ¿Qué es?
              </h2>
              <p className="text-[#233933]/70 leading-relaxed mb-6">
                {producto.descripcion}
              </p>
              <div
                className="rounded-2xl px-5 py-4 border"
                style={{
                  backgroundColor: producto.accentColor + "22",
                  borderColor: producto.accentColor + "55",
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[#233933]/50 mb-1">
                  Para quién es
                </p>
                <p className="text-sm text-[#233933]/80 leading-relaxed">
                  {producto.paraQuien}
                </p>
              </div>
            </div>

            {/* Incluye completo */}
            <div>
              <h2 className="text-2xl font-bold text-[#233933] mb-4">
                Qué incluye
              </h2>
              <div className="space-y-3">
                {producto.incluye.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm text-[#233933]/70"
                  >
                    <span
                      className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-[#233933]"
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

        {/* Beneficios */}
        <section className="px-6 py-16 bg-[#fffef6]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[#233933] text-center mb-10">
              Por qué funciona
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {producto.beneficios.map((b) => (
                <div
                  key={b.titulo}
                  className="bg-white border border-[#e5e7eb] rounded-2xl p-6 flex gap-4"
                >
                  <span className="text-3xl shrink-0">{b.icono}</span>
                  <div>
                    <h3 className="font-bold text-[#233933] mb-1">{b.titulo}</h3>
                    <p className="text-sm text-[#233933]/60 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ del producto */}
        <section className="bg-white px-6 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#233933] text-center mb-8">
              Preguntas sobre este tablero
            </h2>
            <div className="space-y-4">
              {producto.faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="border border-[#e5e7eb] rounded-xl p-5"
                >
                  <p className="font-bold text-sm text-[#233933] mb-2">
                    {faq.q}
                  </p>
                  <p className="text-sm text-[#233933]/60 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-[#233933] px-6 py-16 text-center">
          <div className="max-w-lg mx-auto">
            <span className="text-5xl mb-4 block">{producto.emoji}</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              ¿Listo para crear el de {"{nombre}"}?
            </h2>
            <p className="text-white/60 mb-8">
              Personalizás en 5 minutos. Nosotros lo imprimimos y enviamos.
            </p>
            <Link href={producto.customizerHref}>
              <Button className="bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-xl shadow-none border-0 text-base px-10 py-3">
                Crear mi {producto.nombre} →
              </Button>
            </Link>
            <p className="text-white/30 text-xs mt-4">
              desde {producto.precioDesde} · envío incluido
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
