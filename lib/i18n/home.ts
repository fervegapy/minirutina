// Textos de la home (y de las piezas compartidas del sitio público: header,
// footer, FAQ, botón de WhatsApp) por variante.
//
// es-py es el copy original de la home, sin cambios. Las otras tres son
// "solo digital": no prometen papel 300g, plastificado, velcro, envío ni
// 48 horas, porque fuera de Paraguay lo que se vende es el PDF.
//
// Al editar, mantener las reglas de copy de PorQueFunciona.tsx: nada de
// estadísticas sin fuente, cada objeción concede algo antes de responder,
// detalles concretos en vez de adjetivos.
import type { Variante } from "@/lib/i18n";

export interface Item { titulo: string; texto: string }
export interface Pregunta { q: string; a: string }

export interface HomeDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  h1: string;
  h1Destacado: string;
  bajada: string;
  cards: { rutinas: { titulo: string; bajada: string }; recompensas: { titulo: string; bajada: string } };
  cta: string;
  pasos: { icon: string; texto: string }[];
  porQue: { volanta: string; titulo: string; destacado: string; bajada: string; motivos: Item[] };
  reco: { volanta: string; titulo: string; destacado: string; bajada: string; items: string[] };
  obj: { volanta: string; titulo: string; destacado: string; items: Pregunta[] };
  faq: { volanta: string; titulo: string; items: Pregunta[] };
  cierre: string;
  header: { consultar: string; waMensaje: string };
  footer: {
    descripcion: string;
    productos: string;
    rutinas: string;
    recompensas: string;
    ayuda: string;
    contacto: string;
    envios: string;
    terminos: string;
    derechos: string;
    hecho: string;
    idioma: string;
  };
  waFab: { aria: string; mensaje: string };
}

// ─── Español · Paraguay (copy original) ──────────────────────────────────────
const esPy: HomeDict = {
  metaTitle: "Tableros de rutina personalizados para chicos | Minirutina",
  metaDescription:
    "Tableros visuales personalizados con el nombre y las actividades de tu hijo. Los recibís en 48 horas hábiles en todo Paraguay.",
  badge: "100% personalizables · Te llega en 48hs",
  h1: "Que la mañana y la hora de dormir",
  h1Destacado: "dejen de ser una pelea",
  bajada: "Tableros visuales con el nombre de tu hijo y sus actividades. Elegí el tuyo:",
  cards: {
    rutinas: {
      titulo: "Rutina visual",
      bajada: "Dos tableros: uno para la mañana y uno para la noche. Tu peque sabe qué viene después sin que se lo repitas.",
    },
    recompensas: {
      titulo: "Tablero de recompensas",
      bajada: "10 o 20 pasos hasta el premio que vos elegís. Para instalar un hábito nuevo sin peleas ni castigos.",
    },
  },
  cta: "Personalizar tablero",
  pasos: [
    { icon: "✏️", texto: "Lo personalizás online en 5 minutos" },
    { icon: "🖨️", texto: "Lo imprimimos en papel 300g plastificado" },
    { icon: "📦", texto: "Te llega en 48 horas hábiles" },
  ],
  porQue: {
    volanta: "Por qué funciona",
    titulo: "Un dibujo en la pared",
    destacado: "cambia la mañana",
    bajada:
      "A los tres años tu hijo no puede leer una lista de tareas, pero sí puede mirar una fila de dibujos y saber qué viene después. Todo el tablero se apoya en eso.",
    motivos: [
      {
        titulo: "La instrucción deja de salir de tu boca",
        texto:
          "Mientras sos vos el que avisa que hay que vestirse, hay alguien con quien negociar. Cuando está en la pared, el chico va, mira y sigue. No desaparecen los días malos, pero se termina la discusión de todas las mañanas por lo mismo.",
      },
      {
        titulo: "Marcar es la mitad de la gracia",
        texto:
          "En el de rutinas cada actividad se marca con velcro; en el de recompensas, pegando la figurita. Ese gesto es lo que engancha: quieren llegar al final de la fila. Es la diferencia entre un cartel que se mira y algo que el chico usa con las manos.",
      },
      {
        titulo: "Lo reconoce como propio",
        texto:
          "Un tablero genérico es decoración. Con su nombre arriba y las actividades de su día, no las de un ejemplo de internet, lo trata como suyo. A los tres o cuatro años eso pesa más de lo que parece.",
      },
    ],
  },
  reco: {
    volanta: "Antes de colgarlo",
    titulo: "Cuatro cosas que",
    destacado: "conviene saber",
    bajada:
      "El tablero solo no hace el trabajo. Esto es lo que separa al que se usa todos los días del que termina detrás de la puerta.",
    items: [
      "Elegí las 7 actividades en el orden real en que pasan en tu casa, no en el orden ideal. Si la fila no coincide con el día, el chico le deja de creer.",
      "Colgalo a la altura de los ojos de tu hijo, no a la tuya. Si tiene que pedirte que lo baje, deja de usarlo.",
      "La primera semana acompañalo cada vez. Después empieza a ir solo.",
      "Si vas a usar uno solo de los dos, empezá por el momento del día que más te cuesta hoy.",
    ],
  },
  obj: {
    volanta: "Sin vueltas",
    titulo: "Lo que nos preguntan",
    destacado: "antes de comprar",
    items: [
      {
        q: "¿No puedo imprimir uno gratis de internet?",
        a: "Podés, y mucha gente arranca así. La diferencia está en cuánto dura: una hoja común, con manos recién lavadas y tirones, aguanta unos días. Este va en papel de 300g con plastificado mate, que es lo que le permite aguantar el velcro yendo y viniendo todos los días.",
      },
      {
        q: "¿Y si se aburre a los dos días?",
        a: "La novedad siempre baja, eso pasa con todo. Lo que sostiene el uso es que lo marque él y no vos, y que la fila diga lo que de verdad pasa en tu casa. Cuando el chico llega al final y ve la fila completa, quiere volver a hacerlo mañana.",
      },
      {
        q: "Todavía no sabe leer.",
        a: "No hace falta. Cada actividad es una ilustración: el vaso de leche, el cepillo de dientes, la mochila. El nombre de arriba lo reconoce por la forma mucho antes de saber leerlo.",
      },
      {
        q: "¿Cómo sé que va a quedar bien?",
        a: "Antes de pagar ves el PDF de impresión armado con lo que elegiste: el mismo archivo que después va a la imprenta. No hay sorpresa entre la pantalla y lo que te llega.",
      },
      {
        q: "Tengo dos hijos.",
        a: "Un tablero por chico. Compartir uno no funciona: cada uno quiere marcar el suyo. Podés poner los dos en el mismo pedido y pagarlos juntos.",
      },
      {
        q: "En el de recompensas, ¿vienen las figuritas?",
        a: "Sí, vienen incluidas. Y la ilustración la elegís vos al personalizar, así que son las figuritas que a tu hijo le gustan y no las que vinieron en la caja.",
      },
    ],
  },
  faq: {
    volanta: "Respondemos tus dudas",
    titulo: "Preguntas frecuentes",
    items: [
      {
        q: "¿Qué recibo exactamente?",
        a: "Un tablero impreso en papel de 300g, plastificado mate, listo para colgar. Viene con los datos de tu hijo, los íconos que elegiste y el color que personalizaste.",
      },
      {
        q: "¿Cuánto tarda en llegar?",
        a: "En 48 horas hábiles desde que confirmamos el pago. Te mantenemos al tanto del envío.",
      },
      {
        q: "¿Puedo elegir imprimir yo mismo?",
        a: "Sí. Si preferís la versión digital, te enviamos un archivo PNG de alta resolución para que lo imprimás en cualquier imprenta o en casa. Es una opción más económica pero la impresión depende de vos.",
      },
      {
        q: "¿Cómo pago?",
        a: "Aceptamos pagos con cualquier tarjeta de crédito o débito.",
      },
    ],
  },
  cierre: "Elegí el tablero de tu peque",
  header: { consultar: "Consultar", waMensaje: "Hola Minirutina, tengo una consulta sobre los tableros." },
  footer: {
    descripcion: "",
    productos: "Productos",
    rutinas: "Tablero de Rutinas",
    recompensas: "Tablero de Recompensas",
    ayuda: "Ayuda",
    contacto: "Contacto",
    envios: "Envíos y devoluciones",
    terminos: "Términos y condiciones",
    derechos: "Todos los derechos reservados.",
    hecho: "Hecho con ❤️ para familias paraguayas",
    idioma: "Idioma",
  },
  waFab: {
    aria: "Escribinos por WhatsApp",
    mensaje: "Hola Minirutina, les escribo desde la web y me gustaría hacer una consulta.",
  },
};

// ─── Español · fuera de Paraguay (solo digital) ──────────────────────────────
const esIntl: HomeDict = {
  ...esPy,
  metaDescription:
    "Tableros visuales personalizados con el nombre y las actividades de tu hijo. Los recibís en PDF por email, listos para imprimir.",
  badge: "100% personalizables · Lo recibís en minutos",
  pasos: [
    { icon: "✏️", texto: "Lo personalizás online en 5 minutos" },
    { icon: "📩", texto: "Te llega el PDF por email al pagar" },
    { icon: "🖨️", texto: "Lo imprimís en casa o en cualquier imprenta" },
  ],
  porQue: {
    ...esPy.porQue,
    motivos: [
      esPy.porQue.motivos[0]!,
      {
        titulo: "Marcar es la mitad de la gracia",
        texto:
          "Cada actividad hecha se marca: con un lápiz, un imán o una figurita. Ese gesto es lo que engancha: quieren llegar al final de la fila. Es la diferencia entre un cartel que se mira y algo que el chico usa con las manos.",
      },
      esPy.porQue.motivos[2]!,
    ],
  },
  obj: {
    ...esPy.obj,
    items: [
      {
        q: "¿No puedo imprimir uno gratis de internet?",
        a: "Podés, y mucha gente arranca así. La diferencia es que los gratis traen las actividades de otra familia. Este lleva su nombre y las 7 actividades de tu casa, en el orden en que pasan, con ilustraciones hechas para chicos. Si lo imprimís en cartulina gruesa, dura meses.",
      },
      esPy.obj.items[1]!,
      esPy.obj.items[2]!,
      {
        q: "¿Cómo sé que va a quedar bien?",
        a: "Antes de pagar ves el PDF armado con lo que elegiste: es el mismo archivo que te llega por email. No hay sorpresa entre la pantalla y lo que imprimís.",
      },
      esPy.obj.items[4]!,
      {
        q: "En el de recompensas, ¿vienen las figuritas?",
        a: "Al ser digital, las figuritas las conseguís aparte: cualquier sticker sirve. Mejor si son de algo que a tu hijo le encanta, así tiene más ganas de llenar el tablero.",
      },
    ],
  },
  faq: {
    ...esPy.faq,
    items: [
      {
        q: "¿Qué recibo exactamente?",
        a: "Un PDF de alta resolución, tamaño A4, con el nombre de tu hijo, las actividades que elegiste y el color que personalizaste. Se ajusta a Letter u otros tamaños al imprimir.",
      },
      {
        q: "¿Cuánto tarda en llegar?",
        a: "Te llega por email apenas confirmamos el pago, en minutos.",
      },
      {
        q: "¿Hacen envíos impresos a mi país?",
        a: "Todavía no. Fuera de Paraguay el tablero es digital. Queda mejor impreso en cartulina o papel grueso, y si lo plastificás dura mucho más.",
      },
      {
        q: "¿Cómo pago?",
        a: "Con tarjeta de crédito o débito, en tu moneda.",
      },
    ],
  },
  footer: { ...esPy.footer, hecho: "Hecho con ❤️ en Paraguay" },
};

// ─── English (digital only) ──────────────────────────────────────────────────
const en: HomeDict = {
  metaTitle: "Personalized routine charts for kids | Minirutina",
  metaDescription:
    "Visual charts personalized with your child's name and daily activities. Delivered as a print-ready PDF to your inbox.",
  badge: "100% personalized · In your inbox in minutes",
  h1: "Make mornings and bedtime",
  h1Destacado: "stop being a battle",
  bajada: "Visual charts with your child's name and their own activities. Pick yours:",
  cards: {
    rutinas: {
      titulo: "Visual routine",
      bajada: "Two charts: one for the morning and one for bedtime. Your little one knows what comes next without you repeating it.",
    },
    recompensas: {
      titulo: "Reward chart",
      bajada: "10 or 20 steps to a reward you choose. To build a new habit without fights or punishments.",
    },
  },
  cta: "Personalize chart",
  pasos: [
    { icon: "✏️", texto: "Personalize it online in 5 minutes" },
    { icon: "📩", texto: "Get the PDF by email as soon as you pay" },
    { icon: "🖨️", texto: "Print it at home or at any print shop" },
  ],
  porQue: {
    volanta: "Why it works",
    titulo: "A picture on the wall",
    destacado: "changes the morning",
    bajada:
      "A three-year-old can't read a to-do list, but they can look at a row of pictures and know what comes next. The whole chart is built on that.",
    motivos: [
      {
        titulo: "The instruction stops coming from you",
        texto:
          "As long as you're the one saying it's time to get dressed, there's someone to negotiate with. When it's on the wall, your child goes, looks and moves on. Bad days don't disappear, but the same argument every morning does.",
      },
      {
        titulo: "Checking things off is half the fun",
        texto:
          "Each finished activity gets marked: with a pen, a magnet or a sticker. That gesture is the hook: they want to reach the end of the row. It's the difference between a poster you look at and something your child uses with their hands.",
      },
      {
        titulo: "They see it as their own",
        texto:
          "A generic chart is decoration. With their name on top and the activities of their day, not the ones from an internet example, they treat it as theirs. At three or four, that matters more than you'd think.",
      },
    ],
  },
  reco: {
    volanta: "Before you hang it",
    titulo: "Four things",
    destacado: "worth knowing",
    bajada:
      "The chart doesn't do the work on its own. This is what separates the one that gets used every day from the one that ends up behind a door.",
    items: [
      "Choose the 7 activities in the order they really happen at home, not the ideal order. If the row doesn't match the day, your child stops trusting it.",
      "Hang it at your child's eye level, not yours. If they have to ask you to take it down, they stop using it.",
      "Go through it with them every time during the first week. After that, they start doing it on their own.",
      "If you're only going to use one of the two, start with the time of day that's hardest for you right now.",
    ],
  },
  obj: {
    volanta: "Straight answers",
    titulo: "What parents ask",
    destacado: "before buying",
    items: [
      {
        q: "Can't I print a free one from the internet?",
        a: "You can, and plenty of people start that way. The difference is that free ones come with another family's activities. This one has your child's name and the 7 activities of your home, in the order they happen, with illustrations made for kids. Printed on thick cardstock, it lasts for months.",
      },
      {
        q: "What if they get bored after two days?",
        a: "The novelty always wears off, that happens with everything. What keeps it going is that they mark it, not you, and that the row shows what really happens at home. When your child reaches the end and sees the whole row done, they want to do it again tomorrow.",
      },
      {
        q: "They can't read yet.",
        a: "They don't need to. Every activity is an illustration: the glass of milk, the toothbrush, the backpack. They'll recognize the name on top by its shape long before they can read it.",
      },
      {
        q: "How do I know it will look good?",
        a: "Before paying you see the PDF built with your choices: it's the same file you get by email. No surprises between the screen and what you print.",
      },
      {
        q: "I have two kids.",
        a: "One chart per child. Sharing one doesn't work: each of them wants to mark their own. You can add both to the same order and pay once.",
      },
      {
        q: "Do stickers come with the reward chart?",
        a: "Since it's digital, you get the stickers separately: any sticker works. Even better if they're of something your child loves, so they're eager to fill the chart.",
      },
    ],
  },
  faq: {
    volanta: "Your questions, answered",
    titulo: "Frequently asked questions",
    items: [
      {
        q: "What exactly do I get?",
        a: "A high-resolution A4 PDF with your child's name, the activities you chose and the color you picked. It scales to Letter or other sizes when printing.",
      },
      {
        q: "How long does it take?",
        a: "It arrives by email as soon as the payment is confirmed, within minutes.",
      },
      {
        q: "Do you ship printed charts to my country?",
        a: "Not yet. Outside Paraguay the chart is digital. It looks best printed on cardstock or thick paper, and laminating it makes it last much longer.",
      },
      {
        q: "How do I pay?",
        a: "With any credit or debit card, in your local currency.",
      },
    ],
  },
  cierre: "Pick your little one's chart",
  header: { consultar: "Ask us", waMensaje: "Hi Minirutina, I have a question about the charts." },
  footer: {
    descripcion: "Personalized visual charts for kids, ready to print at home.",
    productos: "Products",
    rutinas: "Routine chart",
    recompensas: "Reward chart",
    ayuda: "Help",
    contacto: "Contact",
    envios: "Shipping & returns",
    terminos: "Terms & conditions",
    derechos: "All rights reserved.",
    hecho: "Made with ❤️ in Paraguay",
    idioma: "Language",
  },
  waFab: {
    aria: "Message us on WhatsApp",
    mensaje: "Hi Minirutina, I'm writing from the website and I have a question.",
  },
};

// ─── Português (Brasil, só digital) ──────────────────────────────────────────
const pt: HomeDict = {
  metaTitle: "Quadros de rotina personalizados para crianças | Minirutina",
  metaDescription:
    "Quadros visuais personalizados com o nome e as atividades do seu filho. Você recebe em PDF por e-mail, pronto para imprimir.",
  badge: "100% personalizados · No seu e-mail em minutos",
  h1: "Que a manhã e a hora de dormir",
  h1Destacado: "deixem de ser uma briga",
  bajada: "Quadros visuais com o nome do seu filho e as atividades dele. Escolha o seu:",
  cards: {
    rutinas: {
      titulo: "Rotina visual",
      bajada: "Dois quadros: um para a manhã e outro para a noite. Seu pequeno sabe o que vem depois sem você precisar repetir.",
    },
    recompensas: {
      titulo: "Quadro de recompensas",
      bajada: "10 ou 20 passos até o prêmio que você escolher. Para criar um hábito novo sem brigas nem castigos.",
    },
  },
  cta: "Personalizar quadro",
  pasos: [
    { icon: "✏️", texto: "Você personaliza online em 5 minutos" },
    { icon: "📩", texto: "O PDF chega no seu e-mail ao pagar" },
    { icon: "🖨️", texto: "Imprima em casa ou em qualquer gráfica" },
  ],
  porQue: {
    volanta: "Por que funciona",
    titulo: "Um desenho na parede",
    destacado: "muda a manhã",
    bajada:
      "Aos três anos seu filho não consegue ler uma lista de tarefas, mas consegue olhar uma fileira de desenhos e saber o que vem depois. O quadro inteiro se apoia nisso.",
    motivos: [
      {
        titulo: "A ordem deixa de sair da sua boca",
        texto:
          "Enquanto é você quem avisa que é hora de se vestir, tem alguém com quem negociar. Quando está na parede, a criança vai, olha e segue. Os dias ruins não somem, mas acaba a discussão de todas as manhãs pelo mesmo motivo.",
      },
      {
        titulo: "Marcar é metade da graça",
        texto:
          "Cada atividade feita é marcada: com um lápis, um ímã ou uma figurinha. Esse gesto é o que engaja: eles querem chegar ao fim da fileira. É a diferença entre um cartaz que se olha e algo que a criança usa com as mãos.",
      },
      {
        titulo: "Ela reconhece como seu",
        texto:
          "Um quadro genérico é decoração. Com o nome dela no topo e as atividades do dia dela, não as de um exemplo da internet, ela trata como seu. Aos três ou quatro anos isso pesa mais do que parece.",
      },
    ],
  },
  reco: {
    volanta: "Antes de pendurar",
    titulo: "Quatro coisas que",
    destacado: "vale a pena saber",
    bajada:
      "O quadro sozinho não faz o trabalho. Isso é o que separa o que é usado todos os dias do que acaba atrás da porta.",
    items: [
      "Escolha as 7 atividades na ordem real em que acontecem na sua casa, não na ordem ideal. Se a fileira não bate com o dia, a criança deixa de acreditar nele.",
      "Pendure na altura dos olhos do seu filho, não dos seus. Se ele precisar pedir para você baixar, deixa de usar.",
      "Na primeira semana, acompanhe toda vez. Depois ele começa a ir sozinho.",
      "Se você vai usar só um dos dois, comece pelo momento do dia que mais te custa hoje.",
    ],
  },
  obj: {
    volanta: "Sem rodeios",
    titulo: "O que nos perguntam",
    destacado: "antes de comprar",
    items: [
      {
        q: "Não posso imprimir um grátis da internet?",
        a: "Pode, e muita gente começa assim. A diferença é que os grátis vêm com as atividades de outra família. Este tem o nome do seu filho e as 7 atividades da sua casa, na ordem em que acontecem, com ilustrações feitas para crianças. Impresso em papel grosso, dura meses.",
      },
      {
        q: "E se ele enjoar em dois dias?",
        a: "A novidade sempre passa, isso acontece com tudo. O que sustenta o uso é que quem marca é ele, não você, e que a fileira mostre o que de verdade acontece na sua casa. Quando a criança chega ao fim e vê a fileira completa, quer fazer de novo amanhã.",
      },
      {
        q: "Ele ainda não sabe ler.",
        a: "Não precisa. Cada atividade é uma ilustração: o copo de leite, a escova de dentes, a mochila. O nome no topo ele reconhece pela forma muito antes de saber ler.",
      },
      {
        q: "Como sei que vai ficar bom?",
        a: "Antes de pagar você vê o PDF montado com o que escolheu: é o mesmo arquivo que chega no seu e-mail. Sem surpresas entre a tela e o que você imprime.",
      },
      {
        q: "Tenho dois filhos.",
        a: "Um quadro por criança. Dividir um não funciona: cada um quer marcar o seu. Você pode colocar os dois no mesmo pedido e pagar junto.",
      },
      {
        q: "No de recompensas, as figurinhas vêm junto?",
        a: "Como é digital, as figurinhas você consegue à parte: qualquer adesivo serve. Melhor ainda se forem de algo que seu filho adora, assim ele tem mais vontade de completar o quadro.",
      },
    ],
  },
  faq: {
    volanta: "Tiramos suas dúvidas",
    titulo: "Perguntas frequentes",
    items: [
      {
        q: "O que eu recebo exatamente?",
        a: "Um PDF em alta resolução, tamanho A4, com o nome do seu filho, as atividades que você escolheu e a cor que personalizou. Ajusta para Carta ou outros tamanhos na hora de imprimir.",
      },
      {
        q: "Quanto tempo demora?",
        a: "Chega no seu e-mail assim que o pagamento é confirmado, em minutos.",
      },
      {
        q: "Vocês enviam quadros impressos para o Brasil?",
        a: "Ainda não. Fora do Paraguai o quadro é digital. Fica melhor impresso em papel cartão ou papel grosso, e plastificado dura muito mais.",
      },
      {
        q: "Como eu pago?",
        a: "Com cartão de crédito ou débito, em reais.",
      },
    ],
  },
  cierre: "Escolha o quadro do seu pequeno",
  header: { consultar: "Fale conosco", waMensaje: "Olá Minirutina, tenho uma dúvida sobre os quadros." },
  footer: {
    descripcion: "Quadros visuais personalizados para crianças, prontos para imprimir em casa.",
    productos: "Produtos",
    rutinas: "Quadro de rotinas",
    recompensas: "Quadro de recompensas",
    ayuda: "Ajuda",
    contacto: "Contato",
    envios: "Envios e devoluções",
    terminos: "Termos e condições",
    derechos: "Todos os direitos reservados.",
    hecho: "Feito com ❤️ no Paraguai",
    idioma: "Idioma",
  },
  waFab: {
    aria: "Fale conosco pelo WhatsApp",
    mensaje: "Olá Minirutina, estou escrevendo pelo site e gostaria de tirar uma dúvida.",
  },
};

const DICTS: Record<Variante, HomeDict> = { "es-py": esPy, "es-intl": esIntl, en, pt };

export function getHomeDict(v: Variante): HomeDict {
  return DICTS[v];
}
