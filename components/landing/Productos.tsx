import Link from "next/link";
import { Button } from "@/components/ui/button";

const productos = [
  {
    emoji: "🌅",
    nombre: "Tablero de Rutinas",
    desc: "Organiza el día en bloques de mañana, siesta y noche. El niño elige sus íconos favoritos para cada momento.",
    href: "/personalizar/rutinas",
  },
  {
    emoji: "📅",
    nombre: "Plan de la Semana",
    desc: "Muestra las actividades de cada día de la semana de forma clara y colorida. Perfecto para la heladera.",
    href: "/personalizar/semana",
  },
  {
    emoji: "⭐",
    nombre: "Tablero de Recompensas",
    desc: "Motiva a tu hijo a completar sus tareas con un sistema de estrellas y una recompensa especial al final.",
    href: "/personalizar/recompensas",
  },
];

export default function Productos() {
  return (
    <section id="productos" className="px-6 py-16 md:py-20 bg-[#fffef6]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-[#233933]">
          Nuestros tableros
        </h2>
        <p className="text-center text-[#233933]/60 mb-12 text-sm">
          Cada uno se personaliza con el nombre y colores de tu hijo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {productos.map((p) => (
            <div
              key={p.nombre}
              className="bg-white border border-[#e5e7eb] rounded-xl p-6 flex flex-col"
            >
              <div className="text-5xl mb-4">{p.emoji}</div>
              <h3 className="font-bold text-lg mb-2 text-[#233933]">
                {p.nombre}
              </h3>
              <p className="text-sm text-[#233933]/70 leading-relaxed flex-1 mb-6">
                {p.desc}
              </p>
              <Link href={p.href}>
                <Button
                  variant="outline"
                  className="w-full border-[#233933] text-[#233933] hover:bg-[#233933] hover:text-white rounded-lg font-semibold"
                >
                  Personalizar
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
