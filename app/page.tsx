import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ComoFunciona from "@/components/landing/ComoFunciona";
import Productos from "@/components/landing/Productos";
import ParaQuienEs from "@/components/landing/ParaQuienEs";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

// La landing se sirve desde el CDN en vez de armarse en cada visita. Las
// acciones de /admin/cms ya llaman revalidatePath("/") al tocar precios o
// textos, así que los cambios salen al instante; este techo de tiempo es solo
// la red de seguridad por si alguna revalidación se pierde.
export const revalidate = 300;

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf6e7]">
      <Header />
      <main>
        <Hero />
        <Productos />
        <ComoFunciona />
        <ParaQuienEs />
        <FAQ />
      </main>
      <Footer />
      {/* FAB solo en la home: en el resto del flujo (customizers, checkout)
          molesta la conversión, ahí WhatsApp queda accesible desde el footer. */}
      <WhatsAppFloat />
    </div>
  );
}
