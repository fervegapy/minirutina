// Imprenta-bound PDF for the Rutinas product.
//
// 4 pages, interleaved front/back per tablero:
//   1. Tablero rutina al despertar (full color)
//   2. Hoja "Listo" mañana — same layout as page 1 but blank, lower
//      zone replaced by 7 'Listo' cells rotated 180° so they read
//      right-side-up once the imprenta folds the lower zone behind the
//      upper zone (back-side of the tablero cards).
//   3. Tablero rutina nocturna (full color)
//   4. Hoja "Listo" noche — same as page 2 for the night tablero.
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { FranjaPage } from "./TableroPDF";

const pt = (mm: number) => mm * 2.83465;

const LABEL_COL = "#3D5240";

// ─── Tablero landscape dimensions (mirror TableroPDF) ────────────────────────
// Used by the blank "Listo" page so it has the exact same layout as the
// tablero — the lower zone is replaced with 7 'Listo' cells.
const TAB_PAGE_W_MM   = 297;
const TAB_PAGE_H_MM   = 210;
const TAB_N_CARDS     = 7;
const TAB_LOWER_Y_MM  = 140.5;
const TAB_LOWER_H_MM  = 69.5;
const TAB_BORDER_COL  = "#DEDEDF";

export interface ImprentaRutinasPDFProps {
  nombreNino: string;
  colorAcento: string;
  manana: string[];
  noche: string[];
  images: Record<string, string>;
  /** Green check PNG from /public/recompensas/stickers/check.png — shown on
   *  every "Listo" ficha so the cumplido visual is identical across products. */
  checkSrc?: string | null;
  subtitleFont?: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    position:        "relative",
    padding:         0,
    margin:          0,
  },
});

/**
 * Blank landscape page mirroring the tablero layout. Everything is white
 * (no name, no accent band, no decorations, no illustration cards). The
 * lower zone (y = 140.5 → 210 mm) is divided into 7 columns; each column
 * shows a dashed-outline placeholder for the check + the word "Listo".
 */
function FranjaPageBlanco({ checkSrc }: { checkSrc?: string | null }) {
  const CHECK_PLACEHOLDER_MM = 24;

  return (
    <Page size={[pt(TAB_PAGE_W_MM), pt(TAB_PAGE_H_MM)]} style={styles.page}>
      {/* Lower-zone strip: 7 equal columns, dividers between them */}
      <View
        style={{
          position:      "absolute",
          top:           pt(TAB_LOWER_Y_MM),
          left:          0,
          right:         0,
          height:        pt(TAB_LOWER_H_MM),
          flexDirection: "row",
        }}
      >
        {Array.from({ length: TAB_N_CARDS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex:            1,
              borderLeftWidth: i === 0 ? 0 : 0.8,
              borderLeftColor: TAB_BORDER_COL,
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            {/* Content is rotated 180° so that when the imprenta folds the
                lower zone UP behind the upper zone, the text + check end
                up right-side-up on the back of the tablero. Without the
                rotation everything reads upside-down after folding. */}
            <View
              style={{
                alignItems:     "center",
                justifyContent: "center",
                paddingTop:     pt(6),
                transform:      "rotate(180deg)",
              }}
            >
              <Text
                style={{
                  fontFamily:    "Figtree",
                  fontWeight:    700,
                  fontSize:      14,
                  color:         LABEL_COL,
                  letterSpacing: 0.5,
                  marginBottom:  pt(4),
                }}
              >
                Listo
              </Text>
              {checkSrc ? (
                <Image
                  src={checkSrc}
                  style={{
                    width:     pt(CHECK_PLACEHOLDER_MM),
                    height:    pt(CHECK_PLACEHOLDER_MM),
                    opacity:   0.25,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <View
                  style={{
                    width:           pt(CHECK_PLACEHOLDER_MM),
                    height:          pt(CHECK_PLACEHOLDER_MM),
                    borderRadius:    pt(CHECK_PLACEHOLDER_MM / 2),
                    borderWidth:     0.8,
                    borderColor:     "#B0B0B0",
                    backgroundColor: "#F8F8F8",
                  }}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}

export default function ImprentaRutinasPDF({
  nombreNino,
  colorAcento,
  manana,
  noche,
  images,
  checkSrc = null,
  subtitleFont = "Nunito",
}: ImprentaRutinasPDFProps) {
  return (
    <Document>
      <FranjaPage
        nombreNino={nombreNino}
        colorAcento={colorAcento}
        subtitle="rutina al despertar"
        decoLeftKey="deco:manana-left"
        decoRightKey="deco:manana-right"
        iconIds={manana}
        images={images}
        subtitleFont={subtitleFont}
        watermark={false}
      />
      {/* Page 2 — blank back-side of the mañana tablero, lower zone with
          7 'Listo' cells (rotated 180° for the fold). */}
      <FranjaPageBlanco checkSrc={checkSrc} />
      <FranjaPage
        nombreNino={nombreNino}
        colorAcento={colorAcento}
        subtitle="rutina nocturna"
        decoLeftKey="deco:noche-left"
        decoRightKey="deco:noche-right"
        iconIds={noche}
        images={images}
        subtitleFont={subtitleFont}
        watermark={false}
      />
      {/* Page 4 — blank back-side of the noche tablero. */}
      <FranjaPageBlanco checkSrc={checkSrc} />
    </Document>
  );
}
