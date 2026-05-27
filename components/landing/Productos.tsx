import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { productos as productosData } from "@/lib/productos";
import { supabase } from "@/lib/supabase";

interface CardData {
  slug:        string;
  nombre:      string;
  desc:        string;
  href:        string;
  accent:      string;
  precio:      string;
}

const COPY: Record<string, Pick<CardData, "desc">> = {
  rutinas: {
    desc: "Dos tableros: rutina al despertarse y a la hora de dormir. Tu hijo sabe qué sigue sin que tengas que recordárselo.",
  },
  recompensas: {
    desc: "Un tablero de 10 o 20 pasos con figuritas a elección. Para instalar un hábito o motivar un comportamiento.",
  },
};

async function getCards(): Promise<CardData[]> {
  const slugs = ["rutinas", "recompensas"] as const;
  const { data: precios } = await supabase
    .from("precios")
    .select("producto, precio_impreso, precio_digital, precio_impreso_20, precio_digital_20");
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
    // Card shows a single representative price — the lowest variant
    // available for that product. Variant selection happens later in the
    // customizer / checkout.
    const cur = row
      ? minPositive([
          row.precio_impreso,
          row.precio_digital,
          row.precio_impreso_20,
          row.precio_digital_20,
        ])
      : null;
    return {
      slug,
      nombre: base.nombre,
      href:   `/productos/${slug}`,
      accent: base.accentColor,
      precio: cur !== null ? fmt(cur) : base.precioDesde,
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
              {/* Product photo — 4:3, accent-tinted backdrop so it sits
                  cleanly even if the PNG has transparency. */}
              <div
                className="relative w-full aspect-[4/3] border-b border-[#e5e7eb]"
                style={{ backgroundColor: p.accent + "22" }}
              >
                <Image
                  src={`/productos/${p.slug}.png`}
                  alt={p.nombre}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-xl text-[#22244e] mb-2">
                  {p.nombre}
                </h3>
                <p className="text-sm text-[#22244e]/60 leading-relaxed mb-5 flex-1">
                  {p.desc}
                </p>

                {/* Precio — un solo número, sin 'desde' ni tachado */}
                <div className="mb-5">
                  <span className="text-2xl font-bold text-[#22244e]">
                    {p.precio}
                  </span>
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
