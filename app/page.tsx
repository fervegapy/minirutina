import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ComoFunciona from "@/components/landing/ComoFunciona";
import Productos from "@/components/landing/Productos";
import ParaQuienEs from "@/components/landing/ParaQuienEs";
import Testimonial from "@/components/landing/Testimonial";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fffef6]">
      <Header />
      <main>
        <Hero />
        <ComoFunciona />
        <Productos />
        <ParaQuienEs />
        <Testimonial />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
