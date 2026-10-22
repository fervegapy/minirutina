// Server-side PDF rendering for tableros. Extracted from the generate-pdf
// route so it can be reused both by that route (admin download / preview)
// and by the post-payment flow (auto-generate + attach to confirmation email).
//
// Font registration runs once on module import. `generateBuffer` returns a
// print-ready PDF Buffer for a given producto + personalization data.
import { renderToBuffer, Font } from "@react-pdf/renderer";
import React from "react";
import path from "path";
import fs from "fs";
import { loadImages, loadRecompensaImages, loadStickerImage } from "@/lib/pdfImages";
import type { Genero } from "@/lib/iconAssets";
import { isLocale, type Locale } from "@/lib/i18n";
import { getPdfTextos } from "@/lib/i18n/compra";
import TableroPDF from "@/components/pdf/TableroPDF";
import RecompensaPDF from "@/components/pdf/RecompensaPDF";
import ImprentaRutinasPDF from "@/components/pdf/ImprentaRutinasPDF";
import ImprentaRecompensasPDF from "@/components/pdf/ImprentaRecompensasPDF";
import InstructivoPDF, { textosInstructivo } from "@/components/pdf/InstructivoPDF";
import { agregarLineaDeCorte } from "@/lib/pdf/corte";

const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({ family: "Figtree", src: `${fontsDir}/Figtree-Bold.woff`, fontWeight: 700 });
Font.register({ family: "Nunito", fonts: [
  { src: `${fontsDir}/Nunito-Regular.woff`,   fontWeight: 400 },
  { src: `${fontsDir}/Nunito-Bold.woff`,      fontWeight: 700 },
  { src: `${fontsDir}/Nunito-ExtraBold.woff`, fontWeight: 800 },
]});

// KG Primary Penmanship: place KGPrimaryPenmanship.ttf in public/fonts/ to activate
const kgPath = `${fontsDir}/KGPrimaryPenmanship.ttf`;
const KG_AVAILABLE = fs.existsSync(kgPath);
if (KG_AVAILABLE) {
  Font.register({ family: "KGPrimaryPenmanship", src: kgPath });
}
const SUBTITLE_FONT = KG_AVAILABLE ? "KGPrimaryPenmanship" : "Nunito";

// ─── Builders ────────────────────────────────────────────────────────────────

async function buildRutinasBuffer(
  nombreNino: string,
  colorAcento: string,
  manana: string[],
  noche: string[],
  watermark: boolean,
  genero: Genero | null,
  idioma: Locale,
) {
  const allIconIds = [...manana, ...noche];
  const images = loadImages(allIconIds, genero, idioma);
  const element = React.createElement(TableroPDF, {
    nombreNino, colorAcento, manana, noche, images,
    subtitleFont: SUBTITLE_FONT,
    watermark,
    textos: getPdfTextos(idioma),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

async function buildRecompensasBuffer(
  nombreNino: string,
  genero: Genero,
  cantidad: 10 | 20,
  watermark: boolean,
  idioma: Locale,
) {
  const images = loadRecompensaImages(idioma);
  const element = React.createElement(RecompensaPDF, {
    nombreNino, genero, cantidad, images,
    subtitleFont: SUBTITLE_FONT,
    watermark,
    textos: getPdfTextos(idioma),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

// ─── Imprenta builders (no watermark, tableros + fichas) ─────────────────────

async function buildImprentaRutinasBuffer(
  nombreNino: string,
  colorAcento: string,
  manana: string[],
  noche: string[],
  genero: Genero | null,
  idioma: Locale,
) {
  const allIconIds = [...manana, ...noche];
  const images = loadImages(allIconIds, genero, idioma);
  // Reuse the green check sticker from /public/recompensas/stickers/check.png
  // as the visual on the "Listo" fichas — keeps the cumplido check identical
  // across both products.
  const checkSrc = loadStickerImage("check");
  const element = React.createElement(ImprentaRutinasPDF, {
    nombreNino, colorAcento, manana, noche, images,
    checkSrc,
    subtitleFont: SUBTITLE_FONT,
    textos: getPdfTextos(idioma),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

async function buildImprentaRecompensasBuffer(
  nombreNino: string,
  genero: Genero,
  cantidad: 10 | 20,
  stickerId: string,
  idioma: Locale,
) {
  const images = loadRecompensaImages(idioma);
  const stickerSrc = loadStickerImage(stickerId);
  const element = React.createElement(ImprentaRecompensasPDF, {
    nombreNino, genero, cantidad, images,
    stickerSrc, stickerId,
    subtitleFont: SUBTITLE_FONT,
    textos: getPdfTextos(idioma),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

export type PdfMode = "cliente" | "imprenta";

export interface PdfData {
  nombreNino: string;
  colorAcento?: string;
  manana?: string[];
  noche?: string[];
  genero?: Genero | null;
  cantidad?: 10 | 20;
  sticker?: string;
  /** Idioma del pedido (personalizacion.idioma). Español si falta. */
  idioma?: string | null;
}

// Generate the right buffer from inline preview data or DB pedido data.
export async function generateBuffer(
  producto: string,
  data: PdfData,
  watermark: boolean,
  mode: PdfMode = "cliente",
): Promise<Buffer> {
  // También la imprenta: es la que recibe quien compra el digital.
  const idioma: Locale = isLocale(data.idioma) ? data.idioma : "es";
  if (producto === "recompensas") {
    const genero = (data.genero ?? "nino") as Genero;
    const cantidad = (data.cantidad ?? 10) as 10 | 20;
    if (mode === "imprenta") {
      return buildImprentaRecompensasBuffer(
        data.nombreNino, genero, cantidad, data.sticker ?? "estrella", idioma,
      );
    }
    return buildRecompensasBuffer(data.nombreNino, genero, cantidad, watermark, idioma);
  }
  // default → rutinas
  if (mode === "imprenta") {
    return buildImprentaRutinasBuffer(
      data.nombreNino,
      data.colorAcento ?? "#a8c5a0",
      data.manana ?? [],
      data.noche ?? [],
      data.genero ?? null,
      idioma,
    );
  }
  return buildRutinasBuffer(
    data.nombreNino,
    data.colorAcento ?? "#a8c5a0",
    data.manana ?? [],
    data.noche ?? [],
    watermark,
    data.genero ?? null,
    idioma,
  );
}

// ─── Lo que recibe quien compra el digital ───────────────────────────────────

/**
 * PDF para el cliente que imprime en casa o en una imprenta: la versión
 * imprenta (frente y dorso) con línea de corte redondeada alrededor de cada
 * tablero. En recompensas solo el tablero lleva contorno: la hoja de fichas
 * ya trae su propia línea de corte en cada círculo.
 */
export async function generateDigitalBuffer(producto: string, data: PdfData): Promise<Buffer> {
  const imprenta = await generateBuffer(producto, data, false, "imprenta");
  return agregarLineaDeCorte(imprenta, producto === "recompensas" ? [0] : undefined);
}

/** Instructivo de armado (una hoja A4), igual para todos los productos.
 *  En el idioma de la compra; español si no es en ni pt. */
export async function generateInstructivoBuffer(idioma?: string | null): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const element = React.createElement(InstructivoPDF, {
    logoSrc: fs.existsSync(logoPath) ? logoPath : null,
    textos: textosInstructivo(idioma),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}
