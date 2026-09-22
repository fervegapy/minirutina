// Los dos productos de la home, arriba de todo y con la foto como
// protagonista.
// Diferencias contra components/landing/Productos.tsx:
//   - sin precio (hipótesis: el número frena antes de que entiendan qué es)
//   - foto vertical y grande en vez de 4:3 chica
//   - toda la tarjeta es un link, no solo el botón
//   - no consulta la tabla `precios`, así que la sección es HTML estático
import Link from "next/link";
import Image from "next/image";
import { productos as productosData } from "@/lib/productos";

const CARDS = [
  {
    slug: "rutinas",
    // Nombre más corto que el de lib/productos.ts: en la tarjeta el título
    // tiene que leerse de un vistazo, el detalle ya lo explica la página.
    titulo: "Rutina visual",
    bajada: "Dos tableros: uno para la mañana y uno para la noche. Tu peque sabe qué viene después sin que se lo repitas.",
  },
  {
    slug: "recompensas",
    titulo: "Tablero de recompensas",
    bajada: "10 o 20 pasos hasta el premio que vos elegís. Para instalar un hábito nuevo sin peleas ni castigos.",
  },
] as const;

export default function ProductosDestacados() {
  return (
    <section id="productos" className="px-6 pb-16">
      <div className="max-w-3xl mx-auto grid gap-6 md:grid-cols-2">
        {CARDS.map((card) => {
          const accent = productosData[card.slug].accentColor;
          return (
            <Link
              key={card.slug}
              href={`/productos/${card.slug}`}
              className="group flex flex-col bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden hover:border-[#336aea] transition-colors"
            >
              <div
                className="relative w-full aspect-[5/4] md:aspect-[4/5] border-b border-[#e5e7eb]"
                style={{ backgroundColor: accent + "33" }}
              >
                <Image
                  src={`/productos/${card.slug}.png`}
                  alt={card.titulo}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                  className="object-cover"
                />
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h2 className="font-bold text-xl text-[#22244e] mb-2">
                  {card.titulo}
                </h2>
                <p className="text-sm text-[#22244e]/60 leading-relaxed mb-5 flex-1">
                  {card.bajada}
                </p>
                {/* Botón visual, no <Button>: toda la tarjeta ya es el <Link>
                    y un botón real anidado sería un link dentro de otro. */}
                <span className="flex items-center justify-center h-12 rounded-lg bg-[#336aea] text-white font-bold group-hover:bg-[#2856c7] transition-colors">
                  Personalizar tablero
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
