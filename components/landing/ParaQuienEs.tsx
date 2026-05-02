const razones = [
  {
    icon: "🧠",
    titulo: "Las rutinas les dan seguridad",
    desc: "Los niños necesitan predecibilidad. Cuando saben qué sigue, hay menos ansiedad, menos berrinches y más autonomía.",
  },
  {
    icon: "🎨",
    titulo: "Diseñado para que quieran usarlo",
    desc: "Colores suaves, íconos claros, el nombre de tu hijo. No es un tablero genérico — es el suyo.",
  },
  {
    icon: "📦",
    titulo: "Nosotros nos encargamos de todo",
    desc: "Lo diseñás en 5 minutos. Nosotros lo imprimimos, lo embalamos y lo enviamos. Vos solo colgás.",
  },
  {
    icon: "🎁",
    titulo: "El regalo perfecto",
    desc: "Ideal para baby showers, cumpleaños o para regalarle a una familia con hijos. Original, útil y personalizado.",
  },
];

export default function ParaQuienEs() {
  return (
    <section className="bg-[#233933] px-6 py-20 md:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#ecbc5d] mb-3 block">
            Por qué Minirutina
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Más que un tablero
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {razones.map((r) => (
            <div
              key={r.titulo}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4"
            >
              <span className="text-3xl shrink-0">{r.icon}</span>
              <div>
                <h3 className="font-bold text-white mb-1">{r.titulo}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
