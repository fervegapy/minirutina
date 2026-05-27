import type { Metadata } from "next";
import LegalLayout from "@/components/landing/LegalLayout";
import ContactForm from "@/components/landing/ContactForm";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title:       "Contacto",
  description: "Contactanos por dudas sobre pedidos, productos o consultas comerciales.",
};

export default function ContactoPage() {
  return (
    <LegalLayout
      title="Contacto"
      subtitle="Escribinos por consultas sobre pedidos, devoluciones, o cualquier duda comercial."
    >
      <div className="not-prose flex items-center gap-2 text-sm bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 mb-6">
        <Mail className="w-4 h-4 text-[#22244e]/50 shrink-0" />
        <span className="text-[#22244e]/70">
          También podés escribirnos directo a
        </span>
        <a
          href="mailto:soporte@minirutina.com"
          className="font-semibold text-[#22244e] hover:text-[#336aea] transition-colors"
        >
          soporte@minirutina.com
        </a>
      </div>
      <ContactForm />
    </LegalLayout>
  );
}
