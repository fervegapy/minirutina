import Link from "next/link";
import { Button } from "@/components/ui/button";

const productos = [
  {
    emoji: "🌅",
    tag: "El más pedido",
    nombre: "Tablero de Rutinas",
    desc: "Dos tableros: rutina al despertarse y a la hora de dormir. Tu hijo sabe qué sigue sin que tengas que recordárselo.",
    beneficio: "Menos conflictos a la hora de dormir y levantarse.",
    href: "/productos/rutinas",
    accent: "#a8c5a0",
  },
  {
    emoji: "⭐",
    tag: "Super motivador",
    nombre: "Tablero de Recompensas",
    desc: "Un sistema de estrellitas con una recompensa especial al final. Funciona mejor que cualquier castigo.",
    beneficio: "Hábitos nuevos en menos de 3 semanas.",
    href: "/productos/recompensas",
    accent: "#f5d78e",
  },
];

export default function Productos() {
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
              <div className="p-6 flex flex-col flex-1">
                {/* Tag */}
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#22244e]/40 mb-3">
                  {p.tag}
                </span>

                {/* Icon */}
                <div className="text-5xl mb-4">{p.emoji}</div>

                <h3 className="font-bold text-xl text-[#22244e] mb-2">
                  {p.nombre}
                </h3>
                <p className="text-sm text-[#22244e]/60 leading-relaxed mb-3 flex-1">
                  {p.desc}
                </p>

                {/* Benefit pill */}
                <div
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-[#22244e]/70 mb-5"
                  style={{ backgroundColor: p.accent + "33" }}
                >
                  💡 {p.beneficio}
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
