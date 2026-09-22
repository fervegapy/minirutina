// El bloque de convicción de la home: mecanismo, cómo usarlo y objeciones.
//
// Reglas de copy para cuando se edite esto:
//   - Nada de estadísticas sin fuente. Las afirmaciones tipo "reduce 40% el
//     tiempo de ir a dormir" que hay en lib/productos.ts no se replican acá.
//   - Cada respuesta concede algo real antes de responder. Una objeción que se
//     contesta con "¡para nada!" no se contesta.
//   - Detalles concretos (300g, velcro, 7 actividades) en vez de adjetivos.
//
// Reglas visuales: sin sombras ni gradientes (ver CLAUDE.md). El relieve sale
// de bordes, fondos tintados y del contraste entre secciones crema y blancas.
// Los íconos son Phosphor en peso duotone: las dos opacidades del mismo azul
// dan volumen sin romper la regla de diseño plano.
//
// Importa desde `@phosphor-icons/react/dist/ssr` y no desde la raíz del
// paquete: la raíz es un client component (usa IconContext) y arrastraría todo
// esto al bundle del navegador sin necesidad, porque acá los íconos son
// estáticos. Los nombres terminan en `Icon` — los cortos (`Hand`) están
// deprecados en la 2.1.
import {
  SpeakerSimpleSlashIcon,
  HandTapIcon,
  SealCheckIcon,
  ListNumbersIcon,
  EyeIcon,
  CalendarCheckIcon,
  ClockIcon,
  QuestionIcon,
  LightbulbIcon,
  SparkleIcon,
  ChatCircleDotsIcon,
} from "@phosphor-icons/react/dist/ssr";

type PhosphorIcon = typeof SparkleIcon;

const MOTIVOS = [
  {
    icon: SpeakerSimpleSlashIcon,
    titulo: "La instrucción deja de salir de tu boca",
    texto:
      "Mientras sos vos el que avisa que hay que vestirse, hay alguien con quien negociar. Cuando está en la pared, el chico va, mira y sigue. No desaparecen los días malos, pero se termina la discusión de todas las mañanas por lo mismo.",
  },
  {
    icon: HandTapIcon,
    titulo: "Marcar es la mitad de la gracia",
    texto:
      "En el de rutinas cada actividad se marca con velcro; en el de recompensas, pegando la figurita. Ese gesto es lo que engancha: quieren llegar al final de la fila. Es la diferencia entre un cartel que se mira y algo que el chico usa con las manos.",
  },
  {
    icon: SealCheckIcon,
    titulo: "Lo reconoce como propio",
    texto:
      "Un tablero genérico es decoración. Con su nombre arriba y las actividades de su día, no las de un ejemplo de internet, lo trata como suyo. A los tres o cuatro años eso pesa más de lo que parece.",
  },
];

const RECOMENDACIONES = [
  {
    icon: ListNumbersIcon,
    // El tablero de rutinas lleva 7 actividades fijas por lado: no se puede
    // recomendar "empezá con menos". Lo que sí está en manos del cliente es
    // cuáles elige y en qué orden.
    texto:
      "Elegí las 7 actividades en el orden real en que pasan en tu casa, no en el orden ideal. Si la fila no coincide con el día, el chico le deja de creer.",
  },
  {
    icon: EyeIcon,
    texto:
      "Colgalo a la altura de los ojos de tu hijo, no a la tuya. Si tiene que pedirte que lo baje, deja de usarlo.",
  },
  {
    icon: CalendarCheckIcon,
    texto: "La primera semana acompañalo cada vez. Después empieza a ir solo.",
  },
  {
    icon: ClockIcon,
    texto:
      "Si vas a usar uno solo de los dos, empezá por el momento del día que más te cuesta hoy.",
  },
];

const OBJECIONES = [
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
];

// Encabezado de sección: chip con ícono + volanta + título. Se repite tres
// veces, así que vive acá y no copiado en cada bloque.
function Encabezado({
  icon: Icon,
  volanta,
  children,
  bajada,
}: {
  icon: PhosphorIcon;
  volanta: string;
  children: React.ReactNode;
  bajada?: string;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#336aea]/15 shrink-0">
          <Icon size={24} weight="duotone" className="text-[#336aea]" />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-[#336aea]">
          {volanta}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#22244e] leading-tight max-w-2xl">
        {children}
      </h2>
      {bajada && (
        <p className="text-[#22244e]/70 leading-relaxed mt-3 max-w-xl">
          {bajada}
        </p>
      )}
    </div>
  );
}

export default function PorQueFunciona() {
  return (
    <>
      {/* Mecanismo — por qué un tablero cambia algo */}
      <section className="px-6 py-14 md:py-20 bg-white border-y border-[#e5e7eb]">
        <div className="max-w-3xl mx-auto">
          <Encabezado
            icon={SparkleIcon}
            volanta="Por qué funciona"
            bajada="A los tres años tu hijo no puede leer una lista de tareas, pero sí puede mirar una fila de dibujos y saber qué viene después. Todo el tablero se apoya en eso."
          >
            Un dibujo en la pared{" "}
            <span className="text-[#336aea]">cambia la mañana</span>
          </Encabezado>

          <div className="grid gap-4 md:grid-cols-3">
            {MOTIVOS.map((m) => (
              <div
                key={m.titulo}
                className="rounded-2xl border border-[#e5e7eb] bg-[#faf6e7] p-5"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-[#e5e7eb] mb-4">
                  <m.icon size={26} weight="duotone" className="text-[#336aea]" />
                </span>
                <h3 className="font-bold text-[#22244e] mb-2 leading-snug">
                  {m.titulo}
                </h3>
                <p className="text-sm text-[#22244e]/70 leading-relaxed">
                  {m.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recomendaciones de uso — valor antes de la compra, y baja la
          probabilidad de que el tablero quede sin usar. */}
      <section className="px-6 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <Encabezado
            icon={LightbulbIcon}
            volanta="Antes de colgarlo"
            bajada="El tablero solo no hace el trabajo. Esto es lo que separa al que se usa todos los días del que termina detrás de la puerta."
          >
            Cuatro cosas que{" "}
            <span className="text-[#336aea]">conviene saber</span>
          </Encabezado>

          <ul className="grid gap-3 md:grid-cols-2">
            {RECOMENDACIONES.map((r, i) => (
              <li
                key={r.texto}
                className="relative flex gap-4 bg-white border border-[#e5e7eb] rounded-xl px-5 py-5"
              >
                <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#336aea]/10 shrink-0">
                  <r.icon size={24} weight="duotone" className="text-[#336aea]" />
                </span>
                <p className="text-sm text-[#22244e]/80 leading-relaxed pr-6">
                  {r.texto}
                </p>
                {/* El número queda como marca de agua: ordena la lectura sin
                    pelear con el ícono por la atención. */}
                <span className="absolute top-3 right-4 text-2xl font-bold text-[#22244e]/10 leading-none">
                  {i + 1}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Objeciones a la vista, no en un acordeón: si hay que abrirlas para
          leerlas, no tranquilizan a nadie. */}
      <section className="px-6 py-14 md:py-20 bg-white border-y border-[#e5e7eb]">
        <div className="max-w-3xl mx-auto">
          <Encabezado icon={ChatCircleDotsIcon} volanta="Sin vueltas">
            Lo que nos preguntan{" "}
            <span className="text-[#336aea]">antes de comprar</span>
          </Encabezado>

          <div className="grid gap-4 md:grid-cols-2">
            {OBJECIONES.map((o) => (
              <div
                key={o.q}
                className="rounded-2xl border border-[#e5e7eb] bg-[#faf6e7] p-5"
              >
                <p className="flex gap-2.5 font-bold text-[#22244e] mb-2 leading-snug">
                  <QuestionIcon
                    size={20}
                    weight="bold"
                    className="text-[#336aea] shrink-0 mt-0.5"
                  />
                  {o.q}
                </p>
                <p className="text-sm text-[#22244e]/70 leading-relaxed">
                  {o.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
