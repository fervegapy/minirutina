import Hero from "@/components/landing/Hero";
import ParaQuienEs from "@/components/landing/ParaQuienEs";
import Productos from "@/components/landing/Productos";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffef6]">
      <Hero />
      <ParaQuienEs />
      <Productos />
      <FAQ />
      <Footer />
    </main>
  );
}
