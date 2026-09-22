// Home anterior, archivada. La home viva es app/page.tsx (la landing
// simplificada que salió del tráfico de Meta de septiembre 2026).
//
// Se guarda como ruta y no solo en el historial de git para poder abrirla al
// lado de la nueva y comparar. No está enlazada desde ningún lado y va con
// noindex para que no compita en Google con la home real.
//
// Si se vuelve a esta versión: mover este archivo a app/page.tsx, sacarle el
// noindex, y archivar la landing simplificada del mismo modo.
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ComoFunciona from "@/components/landing/ComoFunciona";
import Productos from "@/components/landing/Productos";
import ParaQuienEs from "@/components/landing/ParaQuienEs";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const revalidate = 300;

export const metadata = {
  title: "Home anterior | Minirutina",
  robots: { index: false, follow: false },
};

export default function HomeAnterior() {
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
      <WhatsAppFloat />
    </div>
  );
}
