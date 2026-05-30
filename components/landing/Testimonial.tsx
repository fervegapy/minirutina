// Server component — reads testimonios from Supabase. Shows up to two
// active ones (ordered by `orden`). Falls back to hardcoded entries if
// the table is empty or query fails, so the landing never goes blank.
import { supabase } from "@/lib/supabase";

interface Testimonio {
  texto:  string;
  autor:  string;
  activo: boolean;
  orden:  number;
}

const FALLBACK: Testimonio[] = [
  {
    texto:  "Después de dos semanas con el tablero, Tomás ya no me discute para vestirse. Se levanta, mira el tablero y va. Es magia.",
    autor:  "Mamá de Tomás, 4 años — Asunción",
    activo: true,
    orden:  1,
  },
  {
    texto:  "Vi muchísimos en Instagram y me re costaba encontrar y después encargarme de imprimir y armar. Desde que probé, a mi hija le encantan.",
    autor:  "Mamá de Lara, 6 años — Lambaré",
    activo: true,
    orden:  2,
  },
];

export default async function Testimonial() {
  const { data } = await supabase
    .from("testimonios")
    .select("texto, autor, activo, orden")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .limit(2);

  const testimonios: Testimonio[] = (data && data.length > 0)
    ? (data as Testimonio[])
    : FALLBACK;

  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-center gap-1 mb-10">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[#336aea] text-xl">★</span>
          ))}
        </div>

        <div className={`grid gap-6 ${testimonios.length > 1 ? "md:grid-cols-2" : "max-w-2xl mx-auto"}`}>
          {testimonios.map((t, i) => (
            <figure
              key={i}
              className="bg-[#faf6e7] border border-[#e5e7eb] rounded-2xl p-6 md:p-8 flex flex-col"
            >
              <blockquote className="text-lg md:text-xl font-bold text-[#22244e] leading-snug mb-5 flex-1">
                &ldquo;{t.texto}&rdquo;
              </blockquote>
              <figcaption className="text-xs text-[#22244e]/50">
                — {t.autor}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
