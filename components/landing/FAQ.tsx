"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿El tablero es digital o físico?",
    a: "Podés elegir: descarga digital (PDF/PNG para imprimir en casa) o impresión y envío físico. La opción digital se entrega en minutos; la física llega en 3-5 días hábiles.",
  },
  {
    q: "¿Cómo imprimo el tablero en casa?",
    a: "Recibirás un archivo PNG de alta resolución. Imprimilo en hoja A4 en cualquier impresora de tinta. Para mejor resultado, usá papel fotográfico o couché.",
  },
  {
    q: "¿Cuánto tarda en llegar el pedido?",
    a: "La versión digital llega en menos de 24 horas. La versión física tarda entre 3 y 5 días hábiles dependiendo de tu zona.",
  },
  {
    q: "¿Cómo puedo pagar?",
    a: "Aceptamos transferencia bancaria, Mercado Pago y tarjeta de crédito/débito. El pago se realiza de forma segura a través de nuestra plataforma.",
  },
  {
    q: "¿Qué puedo personalizar en cada tablero?",
    a: "Podés elegir el nombre del niño, el color de acento y las actividades o íconos de cada sección. Cada producto tiene sus propias opciones de personalización.",
  },
];

export default function FAQ() {
  return (
    <section className="px-6 py-16 md:py-20 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-[#233933]">
          Preguntas frecuentes
        </h2>
        <Accordion multiple={false} className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-[#e5e7eb] rounded-xl px-4"
            >
              <AccordionTrigger className="text-left font-semibold text-[#233933] hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[#233933]/70 pb-4 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
