import Link from "next/link";
import { Button } from "@/components/ui/button";
import { productos as productosData } from "@/lib/productos";
import { supabase } from "@/lib/supabase";

interface CardData {
  slug:                 string;
  tag:                  string;
  nombre:               string;
  desc:                 string;
  beneficio:            string;
  href:                 string;
  accent:               string;
  precioDesde:          string;
  precioAnteriorDesde:  string | null;
}

const COPY: Record<string, Pick<CardData, "tag" | "desc" | "beneficio">> = {
  rutinas: {
    tag:       "El más pedido",
    desc:      "Dos tableros: rutina al despertarse y a la hora de dormir. Tu hijo sabe qué sigue sin que tengas que recordárselo.",
    beneficio: "Menos conflictos a la hora de dormir y levantarse.",
  },
  recompensas: {
    tag:       "Super motivador",
    desc:      "Un tablero de 10 o 20 pasos con figuritas a elección. Para instalar un hábito o motivar un comportamiento.",
    beneficio: "Hábitos nuevos en menos de 3 semanas.",
  },
};

async function getCards(): Promise<CardData[]> {
  const slugs = ["rutinas", "recompensas"] as const;
  const { data: precios } = await supabase
    .from("precios")
    .select("producto, precio_impreso, precio_digital, precio_anterior_impreso, precio_anterior_digital");
  const preciosBySlug = new Map(
    (precios ?? []).map((p) => [p.producto as string, p]),
  );

  const minPositive = (vs: (number | null | undefined)[]) => {
    const nums = vs.filter((n): n is number => typeof n === "number" && n > 0);
    return nums.length > 0 ? Math.min(...nums) : null;
  };
  const fmt = (n: number) => "Gs. " + n.toLocaleString("es-PY");

  return slugs.map((slug) => {
    const base = productosData[slug];
    const row  = preciosBySlug.get(slug);
    const cur  = row ? minPositive([row.precio_impreso, row.precio_digital]) : null;
    const ant  = row ? minPositive([row.precio_anterior_impreso, row.precio_anterior_digital]) : null;
    return {
      slug,
      nombre:              base.nombre,
      href:                `/productos/${slug}`,
      accent:              base.accentColor,
      precioDesde:         cur !== null ? fmt(cur) : base.precioDesde,
      precioAnteriorDesde: ant !== null ? fmt(ant) : (base.precioAnteriorDesde ?? null),
      ...COPY[slug],
    };
  });
}

export default async function Productos() {
  const productos = await getCards();

  return (
    <section id="productos" className="bg-[#faf6e7] px-6 py-20 md:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#336aea] mb-3 block">
            Dos opciones
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#22244e] mb-4">
            Elegí el tablero ideal
          </h2>
          <p className="text-[#22244e]/60 max-w-md mx-auto">
            Cada uno se personaliza con el nombre, los colores y las actividades de tu hijo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {productos.map((p) => (
            <div
              key={p.nombre}
              className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden flex flex-col group hover:border-[#22244e]/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#22244e]/5"
            >
              {/* Color bar */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: p.accent }}
              />

              {/* Image placeholder — swap for a real <Image> when ready.
                  Tinted with the accent color so the card already feels
                  branded even before the photo lands. */}
              <div
                className="relative w-full aspect-[4/3] flex flex-col items-center justify-center border-b border-[#e5e7eb]"
                style={{ backgroundColor: p.accent + "22" }}
              >
                <div className="text-5xl mb-1.5 opacity-40">🖼️</div>
                <p className="text-[10px] uppercase tracking-widest text-[#22244e]/30 font-bold">
                  Foto del producto
                </p>
              </div>

              <div className="p-6 flex flex-col flex-1">
                {/* Tag */}
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#22244e]/40 mb-3">
                  {p.tag}
                </span>

                <h3 className="font-bold text-xl text-[#22244e] mb-2">
                  {p.nombre}
                </h3>
                <p className="text-sm text-[#22244e]/60 leading-relaxed mb-3 flex-1">
                  {p.desc}
                </p>

                {/* Benefit pill */}
                <div
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-[#22244e]/70 mb-4"
                  style={{ backgroundColor: p.accent + "33" }}
                >
                  💡 {p.beneficio}
                </div>

                {/* Precio */}
                <div className="flex flex-wrap items-baseline gap-2 mb-5">
                  <span className="text-[11px] uppercase tracking-widest text-[#22244e]/50 font-bold">
                    desde
                  </span>
                  <span className="text-2xl font-bold text-[#22244e]">
                    {p.precioDesde}
                  </span>
                  {p.precioAnteriorDesde && p.precioAnteriorDesde !== p.precioDesde && (
                    <>
                      <span className="text-sm text-[#22244e]/40 line-through">
                        {p.precioAnteriorDesde}
                      </span>
                      <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest bg-[#336aea] text-white px-1.5 py-0.5 rounded-full">
                        Oferta
                      </span>
                    </>
                  )}
                </div>

                <Link href={p.href}>
                  <Button className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg shadow-none border-0 h-12 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#336aea]/30 active:translate-y-0 active:scale-[0.98]">
                    Personalizar tablero
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
