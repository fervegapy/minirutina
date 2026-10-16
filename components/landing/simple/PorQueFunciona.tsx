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
import type { HomeDict } from "@/lib/i18n/home";
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

// Los textos viven en lib/i18n/home.ts (uno por idioma/mercado); acá quedan
// solo los íconos, en el mismo orden que los textos.
const ICONOS_MOTIVOS = [SpeakerSimpleSlashIcon, HandTapIcon, SealCheckIcon];
// El tablero de rutinas lleva 7 actividades fijas por lado: no se puede
// recomendar "empezá con menos". Lo que sí está en manos del cliente es
// cuáles elige y en qué orden.
const ICONOS_RECO = [ListNumbersIcon, EyeIcon, CalendarCheckIcon, ClockIcon];

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

export default function PorQueFunciona({ d }: { d: HomeDict }) {
  const MOTIVOS = d.porQue.motivos.map((m, i) => ({ ...m, icon: ICONOS_MOTIVOS[i]! }));
  const RECOMENDACIONES = d.reco.items.map((texto, i) => ({ texto, icon: ICONOS_RECO[i]! }));
  const OBJECIONES = d.obj.items;
  return (
    <>
      {/* Mecanismo — por qué un tablero cambia algo */}
      <section className="px-6 py-14 md:py-20 bg-white border-y border-[#e5e7eb]">
        <div className="max-w-3xl mx-auto">
          <Encabezado
            icon={SparkleIcon}
            volanta={d.porQue.volanta}
            bajada={d.porQue.bajada}
          >
            {d.porQue.titulo}{" "}
            <span className="text-[#336aea]">{d.porQue.destacado}</span>
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
            volanta={d.reco.volanta}
            bajada={d.reco.bajada}
          >
            {d.reco.titulo}{" "}
            <span className="text-[#336aea]">{d.reco.destacado}</span>
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
          <Encabezado icon={ChatCircleDotsIcon} volanta={d.obj.volanta}>
            {d.obj.titulo}{" "}
            <span className="text-[#336aea]">{d.obj.destacado}</span>
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
