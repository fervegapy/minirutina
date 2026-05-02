const items = [
  {
    icon: "🌸",
    title: "Para mamás y papás",
    desc: "Ayuda a tus hijos a construir hábitos sanos con rutinas visuales fáciles de entender y seguir.",
  },
  {
    icon: "🏫",
    title: "Para educadores",
    desc: "Ideal para salas de kínder y primaria. Organiza el día y las tareas de manera visual y atractiva.",
  },
  {
    icon: "🎁",
    title: "Como regalo",
    desc: "Un regalo original y útil para bebés y niños. Personalizado con su nombre y colores favoritos.",
  },
];

export default function ParaQuienEs() {
  return (
    <section className="px-6 py-16 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#233933]">
          ¿Para quién es Minirutina?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-[#fffef6] border border-[#e5e7eb] rounded-xl p-6 text-center"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-lg mb-2 text-[#233933]">
                {item.title}
              </h3>
              <p className="text-sm text-[#233933]/70 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
