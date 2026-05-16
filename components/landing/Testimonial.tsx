// Server component — reads testimonios from Supabase. Picks the first
// active one (ordered by `orden`). Falls back to a hardcoded text if the
// table is empty or query fails, so the landing never goes blank.
import { supabase } from "@/lib/supabase";

interface Testimonio {
  texto:  string;
  autor:  string;
  activo: boolean;
  orden:  number;
}

const FALLBACK = {
  texto: "Desde que colgamos el tablero, mi hijo de 4 años se viste solo y va a lavarse los dientes sin que le diga nada. No lo podía creer.",
  autor: "Mamá de Tomás, 4 años — Asunción",
};

export default async function Testimonial() {
  const { data } = await supabase
    .from("testimonios")
    .select("texto, autor, activo, orden")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .limit(1);

  const t = (data?.[0] as Testimonio | undefined) ?? FALLBACK;
  // First word of the author string ("Mamá", "Papá", etc.) → display name
  const firstName = t.autor.split(/[,—-]/)[0]?.trim() ?? "";

  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-4xl mb-6">💬</div>
        <blockquote className="text-2xl md:text-3xl font-bold text-[#233933] leading-snug mb-8">
          &ldquo;{t.texto}&rdquo;
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ecbc5d]/30 flex items-center justify-center text-lg">
            👩
          </div>
          <div className="text-left">
            {firstName && (
              <p className="font-bold text-sm text-[#233933]">{firstName}</p>
            )}
            <p className="text-xs text-[#233933]/50">{t.autor}</p>
          </div>
        </div>

        <div className="flex justify-center gap-1 mt-6">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[#ecbc5d] text-xl">★</span>
          ))}
        </div>
      </div>
    </section>
  );
}
