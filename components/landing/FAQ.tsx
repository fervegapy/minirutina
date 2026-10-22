"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getHomeDict, type HomeDict } from "@/lib/i18n/home";

// Sin `d` usa el copy de Paraguay (la home anterior y otras páginas en
// español lo usan así).
export default function FAQ({ d = getHomeDict("es-py") }: { d?: HomeDict }) {
  const faqs = d.faq.items;
  return (
    <section id="faq" className="bg-[#faf6e7] px-6 py-20 md:py-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#336aea] mb-3 block">
            {d.faq.volanta}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#22244e]">
            {d.faq.titulo}
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
