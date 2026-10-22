// Textos del detalle de producto por variante (ver lib/i18n).
//
// es-py usa lo de lib/productos.ts tal cual (y los overrides del CMS). Las
// otras variantes son solo digital: nada de papel, plastificado, velcro ni
// envío. El copy de es-intl viene de la rama feat/region-exterior.
import { productos, type Producto } from "@/lib/productos";
import type { Variante } from "@/lib/i18n";

type CopyProducto = Pick<Producto, "nombre" | "tagline" | "descripcion" | "paraQuien" | "incluye">;

export interface ProductoUI {
  volver: string;
  incluidosMas: (n: number) => string;
  cta: string;
  ctaCorto: string;
  bajoCta: string;
  queEs: string;
  paraQuien: string;
  queIncluye: string;
  etiquetaPrecio: string;
}

const UI: Record<Variante, ProductoUI> = {
  "es-py": {
    volver: "← Todos los productos",
    incluidosMas: (n) => `+ ${n} incluidos más`,
    cta: "Personalizar tablero",
    ctaCorto: "Personalizar",
    bajoCta: "Listo en 5 minutos · Te llega en 48 horas",
    queEs: "¿Qué es?",
    paraQuien: "Para quién es",
    queIncluye: "Qué incluye",
    etiquetaPrecio: "Versión impresa",
  },
  "es-intl": {
    volver: "← Todos los productos",
    incluidosMas: (n) => `+ ${n} incluidos más`,
    cta: "Personalizar tablero",
    ctaCorto: "Personalizar",
    bajoCta: "Listo en 5 minutos · Lo recibís por email al pagar",
    queEs: "¿Qué es?",
    paraQuien: "Para quién es",
    queIncluye: "Qué incluye",
    etiquetaPrecio: "Versión digital",
  },
  en: {
    volver: "← All products",
    incluidosMas: (n) => `+ ${n} more included`,
    cta: "Personalize chart",
    ctaCorto: "Personalize",
    bajoCta: "Ready in 5 minutes · Delivered by email when you pay",
    queEs: "What is it?",
    paraQuien: "Who it's for",
    queIncluye: "What's included",
    etiquetaPrecio: "Digital version",
  },
  pt: {
    volver: "← Todos os produtos",
    incluidosMas: (n) => `+ ${n} itens inclusos`,
    cta: "Personalizar quadro",
    ctaCorto: "Personalizar",
    bajoCta: "Pronto em 5 minutos · Chega no seu e-mail ao pagar",
    queEs: "O que é?",
    paraQuien: "Para quem é",
    queIncluye: "O que inclui",
    etiquetaPrecio: "Versão digital",
  },
};

const COPY: Record<Exclude<Variante, "es-py">, Record<string, CopyProducto>> = {
  "es-intl": {
    rutinas: {
      nombre: productos.rutinas!.nombre,
      tagline: "Dos tableros digitales: uno para la mañana y otro para la noche.",
      descripcion:
        "Son dos tableros en un mismo PDF: uno para la rutina al despertarse (vestirse, lavarse los dientes, desayunar, mochila) y otro para la de la noche (baño, pijama, cuento, luz apagada). Van con el nombre de tu hijo y los íconos que elijas, para que sepa qué sigue sin que tengas que repetírselo. Lo recibís por email apenas confirmás el pago, listo para imprimir en tu casa o en cualquier imprenta.",
      paraQuien: productos.rutinas!.paraQuien,
      incluye: [
        "2 tableros digitales en PDF de alta resolución (mañana + noche)",
        "Nombre de tu niño",
        "Hasta 7 actividades por tablero",
        "Color a elección",
        "Tamaño A4, se ajusta a Letter u otros formatos al imprimir",
        "Lo recibís por email en minutos",
      ],
    },
    recompensas: {
      nombre: productos.recompensas!.nombre,
      tagline: "Motivá a tu hijo a lograr lo que se proponga, paso a paso.",
      descripcion:
        "Un tablero digital con 10 o 20 pasos, vos elegís cuántos, donde tu hijo va juntando figuritas hasta llegar a la recompensa que definas. Las figuritas las elegís vos y se consiguen aparte. Funciona mejor que los castigos: los chicos se enganchan, quieren llenar el tablero y el hábito se instala solo. Lo recibís por email apenas confirmás el pago, listo para imprimir en tu casa o en cualquier imprenta.",
      paraQuien: productos.recompensas!.paraQuien,
      incluye: [
        "1 tablero digital en PDF de alta resolución",
        "Nombre de tu niño",
        "Cantidad de pasos a elección (10 o 20)",
        "Color a elección",
        "Tamaño A4, se ajusta a Letter u otros formatos al imprimir",
        "Lo recibís por email en minutos",
      ],
    },
  },
  en: {
    rutinas: {
      nombre: "Visual routine (morning & bedtime)",
      tagline: "Two digital charts: one for the morning and one for bedtime.",
      descripcion:
        "Two charts in one PDF: one for the wake-up routine (get dressed, brush teeth, breakfast, backpack) and one for bedtime (bath, pajamas, story, lights out). They carry your child's name and the icons you choose, so they know what comes next without you having to repeat it. It arrives by email as soon as you pay, ready to print at home or at any print shop.",
      paraQuien:
        "Ideal for kids aged 2 to 8 who are learning to be more independent. It works especially well before school or daycare and in the routine before bed.",
      incluye: [
        "2 high-resolution PDF charts (morning + bedtime)",
        "Your child's name",
        "Up to 7 activities per chart",
        "Color of your choice",
        "A4 size, scales to Letter or other sizes when printing",
        "Delivered by email in minutes",
      ],
    },
    recompensas: {
      nombre: "Reward chart",
      tagline: "Motivate your child to reach any goal, one step at a time.",
      descripcion:
        "A digital chart with 10 or 20 steps, you choose how many, where your child collects stickers until reaching the reward you set. You pick the stickers and get them separately. It works better than punishments: kids get hooked, they want to fill the chart and the habit sticks. It arrives by email as soon as you pay, ready to print at home or at any print shop.",
      paraQuien:
        "For kids aged 3 to 9. Ideal for building a new habit, getting through a tough moment (weaning, a move, a new sibling) or simply as an everyday motivation system.",
      incluye: [
        "1 high-resolution PDF chart",
        "Your child's name",
        "Number of steps of your choice (10 or 20)",
        "Color of your choice",
        "A4 size, scales to Letter or other sizes when printing",
        "Delivered by email in minutes",
      ],
    },
  },
  pt: {
    rutinas: {
      nombre: "Rotina visual (manhã e noite)",
      tagline: "Dois quadros digitais: um para a manhã e outro para a hora de dormir.",
      descripcion:
        "São dois quadros em um mesmo PDF: um para a rotina ao acordar (se vestir, escovar os dentes, tomar café, mochila) e outro para a noite (banho, pijama, história, luz apagada). Levam o nome do seu filho e os ícones que você escolher, para que ele saiba o que vem depois sem você precisar repetir. Chega no seu e-mail assim que você paga, pronto para imprimir em casa ou em qualquer gráfica.",
      paraQuien:
        "Ideal para crianças de 2 a 8 anos que estão aprendendo a ser mais independentes. Funciona especialmente bem de manhã antes da escola ou creche e na rotina antes de dormir.",
      incluye: [
        "2 quadros em PDF de alta resolução (manhã + noite)",
        "Nome do seu filho",
        "Até 7 atividades por quadro",
        "Cor à escolha",
        "Tamanho A4, ajusta para Carta ou outros tamanhos ao imprimir",
        "Chega no seu e-mail em minutos",
      ],
    },
    recompensas: {
      nombre: "Quadro de recompensas",
      tagline: "Motive seu filho a conquistar o que quiser, passo a passo.",
      descripcion:
        "Um quadro digital com 10 ou 20 passos, você escolhe quantos, onde seu filho vai juntando figurinhas até chegar à recompensa que você definir. As figurinhas você escolhe e consegue à parte. Funciona melhor que castigos: as crianças se engajam, querem completar o quadro e o hábito se instala sozinho. Chega no seu e-mail assim que você paga, pronto para imprimir em casa ou em qualquer gráfica.",
      paraQuien:
        "Para crianças de 3 a 9 anos. Ideal para criar um hábito novo, atravessar um momento difícil (desmame, mudança, irmãozinho novo) ou simplesmente como sistema de motivação do dia a dia.",
      incluye: [
        "1 quadro em PDF de alta resolução",
        "Nome do seu filho",
        "Quantidade de passos à escolha (10 ou 20)",
        "Cor à escolha",
        "Tamanho A4, ajusta para Carta ou outros tamanhos ao imprimir",
        "Chega no seu e-mail em minutos",
      ],
    },
  },
};

/** Producto con el copy de la variante encima (null si el slug no existe). */
export function getProducto(slug: string, v: Variante): Producto | null {
  const base = productos[slug];
  if (!base) return null;
  if (v === "es-py") return base;
  const c = COPY[v][slug];
  return c ? { ...base, ...c } : base;
}

export function getProductoUI(v: Variante): ProductoUI {
  return UI[v];
}
