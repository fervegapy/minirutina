import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ComoFunciona from "@/components/landing/ComoFunciona";
import Productos from "@/components/landing/Productos";
import ParaQuienEs from "@/components/landing/ParaQuienEs";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getRegion } from "@/lib/region";

export default async function Home() {
  const region = await getRegion();
  return (
    <div className="min-h-screen bg-[#faf6e7]">
      <Header />
      <main>
        <Hero region={region} />
        <Productos />
        <ComoFunciona region={region} />
        <ParaQuienEs region={region} />
        <FAQ region={region} />
      </main>
      <Footer />
      {/* FAB solo en la home: en el resto del flujo (customizers, checkout)
          molesta la conversión, ahí WhatsApp queda accesible desde el footer. */}
      <WhatsAppFloat />
    </div>
  );
}
