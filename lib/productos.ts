export interface Producto {
  slug: string;
  nombre: string;
  tagline: string;
  emoji: string;
  accentColor: string;
  precioDesde: string;
  descripcion: string;
  paraQuien: string;
  incluye: string[];
  beneficios: { icono: string; titulo: string; desc: string }[];
  faqs: { q: string; a: string }[];
  customizerHref: string;
}

export const productos: Record<string, Producto> = {
  rutinas: {
    slug: "rutinas",
    nombre: "Tablero de Rutinas (×2)",
    tagline: "Son DOS tableros: uno para la rutina al despertarse y otro para la hora de dormir. Sin peleas, sin recordatorios.",
    emoji: "🌅",
    accentColor: "#a8c5a0",
    precioDesde: "Gs. 149.000",
    descripcion:
      "El producto incluye DOS tableros visuales — uno para cada momento clave del día. El primero organiza la rutina al despertarse (vestirse, lavarse los dientes, desayunar, mochila). El segundo, la rutina a la hora de dormir (baño, pijama, cuento, luz apagada). Con íconos claros y el nombre de tu hijo, los chicos saben qué viene después sin que tengas que decírselo.",
    paraQuien:
      "Ideal para niños de 2 a 8 años que están aprendiendo a ser más autónomos. Funciona especialmente bien en la mañana antes del colegio y en la rutina de antes de dormir.",
    incluye: [
      "2 tableros impresos en papel couché 300g (mañana + noche)",
      "Plastificado mate anti-reflejo",
      "Tamaño A4 (21 x 29 cm) cada uno",
      "Nombre personalizado del niño",
      "Hasta 7 actividades por tablero",
      "Color de acento a elección",
      "Tiempo de entrega: 48 horas",
    ],
    beneficios: [
      {
        icono: "😌",
        titulo: "Menos conflictos",
        desc: "Cuando el niño sabe qué sigue, no hay sorpresas ni negociaciones. El tablero es la autoridad, no vos.",
      },
      {
        icono: "💪",
        titulo: "Más autonomía",
        desc: "Los chicos pueden revisar solos qué toca hacer. Se visten, se lavan los dientes y agarran la mochila sin que nadie se los pida.",
      },
      {
        icono: "😴",
        titulo: "Mejor calidad de sueño",
        desc: "Una rutina de noche visual reduce la ansiedad y acelera el proceso de ir a dormir hasta un 40%.",
      },
      {
        icono: "🎨",
        titulo: "100% personalizado",
        desc: "Su nombre, sus actividades, su color favorito. No es un tablero genérico — es el suyo.",
      },
    ],
    faqs: [
      {
        q: "¿En cuánto tiempo llega?",
        a: "En 48 horas desde que confirmamos el pago. Te mandamos el seguimiento por WhatsApp.",
      },
      {
        q: "¿Qué tamaño tiene?",
        a: "A4 (21x29cm) por defecto. Si querés A3, avisanos por WhatsApp antes de confirmar el pedido.",
      },
      {
        q: "¿Necesita marco?",
        a: "No. Viene listo para colgar con cinta doble faz o imanes de heladera. Aunque en una moldura queda muy lindo.",
      },
      {
        q: "¿Puedo pedir más de uno?",
        a: "Sí, y hacemos precio especial a partir de 2 unidades. Escribinos por WhatsApp.",
      },
    ],
    customizerHref: "/personalizar/rutinas",
  },

  recompensas: {
    slug: "recompensas",
    nombre: "Tablero de Recompensas",
    tagline: "Un tablero de 10 o 20 pasos con figuritas a elección. Para instalar un hábito o motivar un comportamiento.",
    emoji: "⭐",
    accentColor: "#f5d78e",
    precioDesde: "Gs. 149.000",
    descripcion:
      "Un tablero visual con 10 o 20 pasos (vos elegís cuántos), donde tu hijo va juntando figuritas hasta llegar a la recompensa que vos definís. Las figuritas las elegís a gusto y se compran aparte. Funciona mucho mejor que los castigos — los chicos se enganchan, quieren llenar el tablero y los hábitos se instalan solos.",
    paraQuien:
      "Para niños de 3 a 9 años. Ideal para instalar un hábito nuevo, atravesar un momento difícil (destete, mudanza, hermano nuevo) o simplemente como sistema de motivación cotidiano.",
    incluye: [
      "1 tablero impreso en papel couché 300g",
      "Plastificado mate anti-reflejo",
      "Tamaño A4 (21 x 29 cm)",
      "Nombre personalizado del niño",
      "Elección de 10 o 20 pasos",
      "Texto de recompensa personalizado",
      "Color de acento a elección",
      "Figuritas a elección (se compran aparte)",
      "Tiempo de entrega: 48 horas",
    ],
    beneficios: [
      {
        icono: "🌟",
        titulo: "Motivación intrínseca",
        desc: "Las estrellas hacen que el niño quiera cumplir — no porque lo obliguen, sino porque disfruta el proceso de completar.",
      },
      {
        icono: "🏆",
        titulo: "La recompensa la elegís vos",
        desc: "No tiene que ser un regalo caro. Puede ser una salida al parque, elegir la cena, o una película especial.",
      },
      {
        icono: "📈",
        titulo: "Hábitos en 3 semanas",
        desc: "Con constancia, los nuevos comportamientos se vuelven automáticos en menos de un mes.",
      },
      {
        icono: "❤️",
        titulo: "Sin culpa, sin castigos",
        desc: "El sistema es positivo por definición. Si no cumplió, simplemente no suma estrella — sin drama ni negatividad.",
      },
    ],
    faqs: [
      {
        q: "¿Cuántos pasos recomiendan?",
        a: "Para niños menores de 5 años, 10 pasos. Para mayores de 5, 20. La idea es que el premio no tarde demasiado en llegar.",
      },
      {
        q: "¿Cómo marcan los pasos?",
        a: "El tablero viene con espacios para pegar las figuritas que vos elegís y comprás aparte. Las figuritas doradas o de personajes son las que más enganchan.",
      },
      {
        q: "¿Se puede usar para más de un hábito?",
        a: "El tablero está pensado para un hábito o comportamiento a la vez. Para múltiples hábitos, recomendamos el Tablero de Rutinas.",
      },
      {
        q: "¿En cuánto tiempo llega?",
        a: "En 48 horas desde que confirmamos el pago.",
      },
    ],
    customizerHref: "/personalizar/recompensas",
  },
};
