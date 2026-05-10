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
    nombre: "Tablero de Rutinas",
    tagline: "Mañana, siesta y noche. Sin peleas, sin recordatorios.",
    emoji: "🌅",
    accentColor: "#a8c5a0",
    precioDesde: "Gs. 149.000",
    descripcion:
      "Un tablero visual que organiza el día de tu hijo en tres momentos clave: mañana, siesta y noche. Con íconos claros y el nombre de tu hijo, los chicos saben exactamente qué viene después — sin que tengas que decírselo.",
    paraQuien:
      "Ideal para niños de 2 a 8 años que están aprendiendo a ser más autónomos. Funciona especialmente bien en la mañana antes del colegio y en la rutina de antes de dormir.",
    incluye: [
      "Tablero impreso en papel couché 300g",
      "Plastificado mate anti-reflejo",
      "Tamaño A4 (21 x 29 cm) o A3 (29 x 42 cm)",
      "Nombre personalizado del niño",
      "Hasta 6 íconos por bloque horario",
      "Color de acento a elección",
      "Envío a domicilio incluido",
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
        a: "Entre 3 y 5 días hábiles desde que confirmamos el pago. Te mandamos el seguimiento por WhatsApp.",
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
    tagline: "Estrellitas, hábitos y una recompensa que los motiva de verdad.",
    emoji: "⭐",
    accentColor: "#f5d78e",
    precioDesde: "Gs. 129.000",
    descripcion:
      "Un sistema de recompensas visual donde tu hijo va juntando estrellas hasta llegar a un premio que vos elegís. Funciona mucho mejor que los castigos — los chicos se enganchan, quieren completar las estrellas y los hábitos se instalan solos.",
    paraQuien:
      "Para niños de 3 a 9 años. Ideal para instalar un hábito nuevo, atravesar un momento difícil (destete, mudanza, hermano nuevo) o simplemente como sistema de motivación cotidiano.",
    incluye: [
      "Tablero impreso en papel couché 300g",
      "Plastificado mate anti-reflejo",
      "Tamaño A4 (21 x 29 cm)",
      "Nombre personalizado del niño",
      "Elección de 5, 10 o 15 estrellas",
      "Texto de recompensa personalizado",
      "Color de acento a elección",
      "Envío a domicilio incluido",
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
        q: "¿Cuántas estrellas recomiendan?",
        a: "Para niños menores de 5 años, 5 estrellas. Para 5-7 años, 10. Para mayores de 7, 15. La idea es que el premio no tarde demasiado.",
      },
      {
        q: "¿Cómo marcan las estrellas?",
        a: "El tablero viene con espacios para pegar stickers (los más populares son los de estrellitas doradas), o podés usar un marcador de pizarra si lo plastificás extra.",
      },
      {
        q: "¿Se puede usar para más de un hábito?",
        a: "El tablero está pensado para un hábito o comportamiento a la vez. Para múltiples hábitos, recomendamos el Tablero de Rutinas.",
      },
      {
        q: "¿En cuánto tiempo llega?",
        a: "Entre 3 y 5 días hábiles desde que confirmamos el pago.",
      },
    ],
    customizerHref: "/personalizar/recompensas",
  },
};
