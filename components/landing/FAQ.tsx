"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Qué recibo exactamente?",
    a: "Un tablero impreso en papel de 300g, plastificado mate, listo para colgar. Viene con los datos de tu hijo, los íconos que elegiste y el color que personalizaste.",
  },
  {
    q: "¿Cuánto tarda en llegar?",
    a: "En 48 horas hábiles desde que confirmamos el pago. Te mantenemos al tanto del envío.",
  },
  {
    q: "¿Puedo elegir imprimir yo mismo?",
    a: "Sí. Si preferís la versión digital, te enviamos un archivo PNG de alta resolución para que lo imprimás en cualquier imprenta o en casa. Es una opción más económica pero la impresión depende de vos.",
  },
  {
    q: "¿Cómo pago?",
    a: "Aceptamos pagos con cualquier tarjeta de crédito o débito.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-[#faf6e7] px-6 py-20 md:py-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#336aea] mb-3 block">
            Dudas frecuentes
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#22244e]">
            Preguntas frecuentes
          </h2>
        </div>
        <Accordion multiple={false} className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-white border border-[#e5e7eb] rounded-xl px-5"
            >
              <AccordionTrigger className="text-left font-semibold text-[#22244e] hover:no-underline py-4 text-sm">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[#22244e]/70 pb-4 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
