// Home. Versión simplificada y orientada a conversión: el tráfico de Meta
// entra acá y tiene que llegar al producto sin leer un sitio institucional.
// La home anterior quedó archivada en app/home-anterior/page.tsx (noindex).
//
// Decisiones de esta página, para que no se deshagan sin querer:
//   - Hero de texto, sin video. El video era lo más pesado de la home vieja y
//     empujaba las fotos de producto abajo del fold en 375px.
//   - Los dos productos van arriba, con foto grande y sin precio. El precio
//     aparece en el detalle del producto.
//   - Un solo CTA por pantalla y siempre el mismo texto: "Personalizar
//     tablero". No hay nav de secciones que compita con eso.
//   - "Cómo funciona" es una tira de tres pasos, no una sección.
//   - Debajo de los productos va el bloque de convicción (PorQueFunciona:
//     mecanismo, recomendaciones de uso y objeciones) para quien necesita
//     leer antes de decidir. El que ya venía decidido nunca llega ahí.
//   - El FAQ compartido queda al final para lo logístico (pago, envío,
//     versión digital), que es lo que no cubre el bloque de objeciones.
import Link from "next/link";
import HeaderSimple from "@/components/landing/simple/HeaderSimple";
import ProductosDestacados from "@/components/landing/simple/ProductosDestacados";
import PorQueFunciona from "@/components/landing/simple/PorQueFunciona";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

// La landing se sirve desde el CDN en vez de armarse en cada visita. Las
// acciones de /admin/cms ya llaman revalidatePath("/") al tocar precios o
// textos, así que los cambios salen al instante; este techo de tiempo es solo
// la red de seguridad por si alguna revalidación se pierde.
export const revalidate = 300;

export const metadata = {
  title: "Tableros de rutina personalizados para chicos | Minirutina",
  description:
    "Tableros visuales personalizados con el nombre y las actividades de tu hijo. Los recibís en 48 horas hábiles en todo Paraguay.",
};

const PASOS = [
  { icon: "✏️", texto: "Lo personalizás online en 5 minutos" },
  { icon: "🖨️", texto: "Lo imprimimos en papel 300g plastificado" },
  { icon: "📦", texto: "Te llega en 48 horas hábiles" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf6e7]">
      <HeaderSimple />
      <main>
        {/* Hero compacto: una promesa, una bajada y nada más. El CTA real son
            las tarjetas de producto, que arrancan apenas abajo. */}
        <section className="px-6 pt-6 pb-6 md:pt-12 md:pb-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-[#336aea]/20 text-[#22244e] text-xs md:text-sm font-bold px-3.5 py-1.5 rounded-full mb-4">
              100% personalizables · Te llega en 48hs
            </span>
            {/* Títular corto a propósito: en 375px cada línea extra empuja las
                fotos de los productos abajo del fold. */}
            <h1 className="text-2xl md:text-4xl font-bold text-[#22244e] leading-[1.15] mb-3">
              Que la mañana y la hora de dormir{" "}
              <span className="text-[#336aea]">dejen de ser una pelea</span>
            </h1>
            <p className="text-[#22244e]/70 text-sm md:text-lg leading-relaxed max-w-xl mx-auto">
              Tableros visuales con el nombre de tu hijo y sus actividades.
              Elegí el tuyo:
            </p>
          </div>
        </section>

        <ProductosDestacados />

        {/* Cómo funciona, en una tira. Sin título de sección ni numeración:
            es prueba de que el proceso es simple, no contenido para leer. */}
        <section className="px-6 pb-16">
          <div className="max-w-3xl mx-auto grid gap-3 sm:grid-cols-3">
            {PASOS.map((paso) => (
              <div
                key={paso.texto}
                className="flex items-center gap-3 bg-white border border-[#e5e7eb] rounded-xl px-4 py-3"
              >
                <span className="text-xl shrink-0">{paso.icon}</span>
                <p className="text-sm text-[#22244e]/70 leading-snug">
                  {paso.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        <PorQueFunciona />

        <FAQ />

        {/* Último empujón para quien bajó leyendo las preguntas: el único
            destino es volver a los productos. */}
        <section className="px-6 py-14 bg-white border-t border-[#e5e7eb]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#22244e] mb-6">
              Elegí el tablero de tu peque
            </h2>
            <Link
              href="#productos"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-[#336aea] text-white font-bold hover:bg-[#2856c7] transition-colors"
            >
              Personalizar tablero
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      {/* FAB solo en la home: en el resto del flujo (customizers, checkout)
          molesta la conversión, ahí WhatsApp queda accesible desde el footer. */}
      <WhatsAppFloat />
    </div>
  );
}
