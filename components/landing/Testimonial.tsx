export default function Testimonial() {
  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-4xl mb-6">💬</div>
        <blockquote className="text-2xl md:text-3xl font-bold text-[#233933] leading-snug mb-8">
          "Desde que colgamos el tablero, mi hijo de 4 años se viste solo y va a lavarse los dientes sin que le diga nada. No lo podía creer."
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ecbc5d]/30 flex items-center justify-center text-lg">
            👩
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-[#233933]">Valentina M.</p>
            <p className="text-xs text-[#233933]/50">Mamá de Tomás, 4 años — Buenos Aires</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-1 mt-6">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[#ecbc5d] text-xl">★</span>
          ))}
        </div>
      </div>
    </section>
  );
}
