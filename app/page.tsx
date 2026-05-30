import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ComoFunciona from "@/components/landing/ComoFunciona";
import Productos from "@/components/landing/Productos";
import ParaQuienEs from "@/components/landing/ParaQuienEs";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

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
    </div>
  );
}
