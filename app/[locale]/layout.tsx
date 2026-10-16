import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HTML_LANG, isLocale } from "@/lib/i18n";
import { getHomeDict } from "@/lib/i18n/home";

// Flujo de compra en inglés y portugués: /en|/pt/personalizar/…, /checkout y
// /confirmacion. Son las mismas páginas que en español (la raíz), con el
// idioma por parámetro. La home y el detalle de producto no pasan por acá:
// el middleware los reescribe a /v/<variante>.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "pt" }];
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (params.locale !== "en" && params.locale !== "pt") return {};
  const d = getHomeDict(params.locale);
  return { title: { absolute: d.metaTitle }, description: d.metaDescription };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale) || params.locale === "es") notFound();
  return (
    <>
      {/* El <html lang> lo fija el layout raíz (es); se corrige en el cliente,
          igual que en app/v/[variante]. */}
      <script
        dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(HTML_LANG[params.locale])}` }}
      />
      {children}
    </>
  );
}
