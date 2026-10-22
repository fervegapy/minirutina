"use client";

// Selector de país e idioma del header, siempre visible. El botón muestra lo
// que está en uso ("🇵🇾 ES · Gs.") y abre un modal para cambiarlo.
//
// El país define la moneda y si se vende impreso (solo Paraguay); el idioma,
// los textos. Son independientes: alguien en Paraguay puede ver el sitio en
// inglés y pagar en Gs. Al guardar se navega a la misma página con ?pais e
// ?idioma, y el middleware los fija (ver components/mercado/mercado-cliente).
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LOCALES, PAIS_COOKIE, type Locale } from "@/lib/i18n";
import {
  MERCADOS,
  leerCookie,
  mercadoDePais,
  monedaDeMercado,
  simboloMoneda,
  urlCambio,
  type CodigoMercado,
} from "./mercado-cliente";

const NOMBRE_IDIOMA: Record<Locale, string> = { es: "Español", en: "English", pt: "Português" };

const T: Record<Locale, {
  aria: string; titulo: string; bajada: string; pais: string; idioma: string;
  impreso: string; digital: string; guardar: string; cerrar: string;
}> = {
  es: {
    aria: "Cambiar país e idioma",
    titulo: "País e idioma",
    bajada: "El país define la moneda y si podés recibir el tablero impreso.",
    pais: "País", idioma: "Idioma",
    impreso: "impreso o digital", digital: "solo digital",
    guardar: "Guardar", cerrar: "Cerrar",
  },
  en: {
    aria: "Change country and language",
    titulo: "Country & language",
    bajada: "Your country sets the currency and whether we can ship a printed chart.",
    pais: "Country", idioma: "Language",
    impreso: "printed or digital", digital: "digital only",
    guardar: "Save", cerrar: "Close",
  },
  pt: {
    aria: "Mudar país e idioma",
    titulo: "País e idioma",
    bajada: "O país define a moeda e se dá para receber o quadro impresso.",
    pais: "País", idioma: "Idioma",
    impreso: "impresso ou digital", digital: "só digital",
    guardar: "Salvar", cerrar: "Fechar",
  },
};

// Opción elegible: botón con borde que se marca en azul (radio visual). Los
// dark: repiten los colores: el sitio es siempre claro, pero la variante
// outline trae colores propios para modo oscuro que pisaban estos.
function Opcion({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      aria-pressed={activa}
      className={`h-auto min-h-12 w-full justify-start gap-3 rounded-xl px-3 py-2 text-left whitespace-normal ${
        activa
          ? "border-[#336aea] bg-[#336aea]/10 text-[#22244e] hover:bg-[#336aea]/15 dark:border-[#336aea] dark:bg-[#336aea]/10 dark:hover:bg-[#336aea]/15"
          : "border-[#e5e7eb] bg-white text-[#22244e] hover:bg-[#22244e]/5 dark:border-[#e5e7eb] dark:bg-white dark:hover:bg-[#22244e]/5"
      }`}
    >
      {children}
    </Button>
  );
}

export default function SelectorMercado({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = T[locale];

  // Las cookies solo existen en el navegador: hasta montar se muestra solo el
  // idioma, que sale de la página.
  const [paisUso, setPaisUso] = useState<string | null>(null);
  useEffect(() => setPaisUso(leerCookie(PAIS_COOKIE)), []);

  const mercadoActual = mercadoDePais(paisUso);
  const [abierto, setAbierto] = useState(false);
  const [mercado, setMercado] = useState<CodigoMercado>(mercadoActual);
  const [idioma, setIdioma] = useState<Locale>(locale);
  // Al abrir, partir siempre de lo que está en uso.
  useEffect(() => {
    if (abierto) { setMercado(mercadoActual); setIdioma(locale); }
  }, [abierto, mercadoActual, locale]);

  const actual = MERCADOS.find((m) => m.codigo === mercadoActual)!;
  const guardar = () => {
    window.location.href = urlCambio({ pathname, locale: idioma, mercado });
  };

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            aria-label={t.aria}
            className="h-10 gap-1.5 rounded-lg border-[#e5e7eb] bg-transparent px-3 text-sm font-semibold text-[#22244e] hover:bg-[#22244e]/5 dark:border-[#e5e7eb] dark:bg-transparent dark:hover:bg-[#22244e]/5"
          />
        }
      >
        {paisUso && <span aria-hidden>{actual.bandera}</span>}
        <span>{locale.toUpperCase()}</span>
        {paisUso && (
          <span className="text-[#22244e]/50">· {simboloMoneda(monedaDeMercado(mercadoActual))}</span>
        )}
      </DialogTrigger>

      <DialogContent closeLabel={t.cerrar}>
        <DialogHeader>
          <DialogTitle>{t.titulo}</DialogTitle>
          <DialogDescription>{t.bajada}</DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#22244e]/40">{t.pais}</legend>
          {MERCADOS.map((m) => (
            <Opcion key={m.codigo} activa={mercado === m.codigo} onClick={() => setMercado(m.codigo)}>
              <span className="text-xl" aria-hidden>{m.bandera}</span>
              <span className="flex flex-col">
                <span className="font-semibold">{m.nombre[locale]}</span>
                <span className="text-xs font-normal text-[#22244e]/60">
                  {simboloMoneda(monedaDeMercado(m.codigo))} · {m.codigo === "PY" ? t.impreso : t.digital}
                </span>
              </span>
            </Opcion>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#22244e]/40">{t.idioma}</legend>
          <div className="grid grid-cols-3 gap-2">
            {LOCALES.map((l) => (
              <Opcion key={l} activa={idioma === l} onClick={() => setIdioma(l)}>
                <span className="w-full text-center text-sm font-semibold">{NOMBRE_IDIOMA[l]}</span>
              </Opcion>
            ))}
          </div>
        </fieldset>

        <Button
          type="button"
          onClick={guardar}
          className="h-12 w-full rounded-xl border-0 bg-[#336aea] text-base font-bold text-white hover:bg-[#2856c7]"
        >
          {t.guardar}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
