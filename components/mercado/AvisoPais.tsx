"use client";

// Aviso cuando el país de la IP sugiere otro idioma que el de la página (ej.
// alguien en Brasil entrando a la home en español). No redirige: sugiere, en
// el idioma sugerido, y deja decidir. Aparece solo si la persona todavía no
// eligió nada con el selector y no lo descartó antes.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AVISO_PAIS_COOKIE,
  LOCALE_COOKIE,
  PAIS_FORZADO_COOKIE,
  PAIS_IP_COOKIE,
  localeFromRequest,
  type Locale,
} from "@/lib/i18n";
import { leerCookie, urlCambio } from "./mercado-cliente";

const T: Record<Locale, { texto: (pais: string, codigo: string) => string; si: string; no: string }> = {
  es: {
    texto: (pais) => `Parece que estás en ${pais}. ¿Ver el sitio en español?`,
    si: "Ver en español",
    no: "No, gracias",
  },
  en: {
    texto: (pais) => `It looks like you're in ${pais}. View the site in English?`,
    si: "Switch to English",
    no: "No, thanks",
  },
  pt: {
    texto: (pais, codigo) =>
      `Parece que você está ${codigo === "BR" ? "no Brasil" : `em ${pais}`}. Ver o site em português?`,
    si: "Ver em português",
    no: "Não, obrigado",
  },
};

export default function AvisoPais({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [sugerido, setSugerido] = useState<{ locale: Locale; pais: string; codigo: string } | null>(null);

  useEffect(() => {
    if (leerCookie(LOCALE_COOKIE) || leerCookie(PAIS_FORZADO_COOKIE) || leerCookie(AVISO_PAIS_COOKIE)) return;
    const paisIp = leerCookie(PAIS_IP_COOKIE);
    if (!paisIp) return;
    const sug = localeFromRequest(paisIp, navigator.language);
    if (sug === locale) return;
    let nombre = paisIp;
    try {
      nombre = new Intl.DisplayNames([sug], { type: "region" }).of(paisIp) ?? paisIp;
    } catch { /* navegador sin Intl.DisplayNames: queda el código */ }
    setSugerido({ locale: sug, pais: nombre, codigo: paisIp });
  }, [locale]);

  if (!sugerido) return null;
  const t = T[sugerido.locale];

  const descartar = () => {
    document.cookie = `${AVISO_PAIS_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}`;
    setSugerido(null);
  };

  return (
    <div
      role="status"
      lang={sugerido.locale}
      className="border-b border-[#336aea]/20 bg-[#336aea]/10"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#22244e]">{t.texto(sugerido.pais, sugerido.codigo)}</p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            onClick={() => { window.location.href = urlCambio({ pathname, locale: sugerido.locale }); }}
            className="h-10 rounded-lg border-0 bg-[#336aea] px-4 text-sm font-bold text-white hover:bg-[#2856c7]"
          >
            {t.si}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={descartar}
            className="h-10 rounded-lg border-[#e5e7eb] bg-white px-4 text-sm font-semibold text-[#22244e] dark:border-[#e5e7eb] dark:bg-white dark:hover:bg-[#22244e]/5"
          >
            {t.no}
          </Button>
        </div>
      </div>
    </div>
  );
}
