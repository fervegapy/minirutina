const pasos = [
  {
    num: "01",
    icon: "✏️",
    titulo: "Personalizás",
    desc: "Elegís el tipo de tablero, el nombre de tu hijo y los colores. Todo online, en menos de 5 minutos.",
  },
  {
    num: "02",
    icon: "🖨️",
    titulo: "Nosotros lo producimos",
    desc: "Imprimimos tu tablero en papel premium, plastificado y listo para colgar. Sin que hagas nada más.",
  },
  {
    num: "03",
    icon: "📦",
    titulo: "Lo recibís en casa",
    desc: "Te lo enviamos a domicilio en 48 horas. Solo tenés que colgarlo.",
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-white px-6 py-20 md:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#336aea] mb-3 block">
            Así funciona
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#22244e]">
            Elegí y nos encargamos de todo
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pasos.map((paso, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < pasos.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%-16px)] w-8 border-t-2 border-dashed border-[#e5e7eb] z-10" />
              )}
              <div className="bg-[#faf6e7] border border-[#e5e7eb] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{paso.icon}</span>
                  <span className="text-4xl font-bold text-[#336aea]/30 leading-none">
                    {paso.num}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-[#22244e] mb-2">
                  {paso.titulo}
                </h3>
                <p className="text-sm text-[#22244e]/60 leading-relaxed">
                  {paso.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
