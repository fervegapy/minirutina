// Imprenta-bound PDF for the Rutinas product.
//
// 6 pages:
//   1. Tablero rutina al despertar (full color)
//   2. Tablero rutina nocturna (full color)
//   3. Hoja "Listo" mañana — same layout as page 1 but blank, with the
//      lower zone replaced by 7 "Listo" cells (back-side of the tablero
//      cards: when the kid completes a step, this is what shows).
//   4. Hoja "Listo" noche — same as page 3 for the night tablero.
//   5. Fichas de cumplido recortables — mañana (7 fichas, 39.6 × 69.5 mm)
//   6. Fichas de cumplido recortables — noche (7 fichas)
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { FranjaPage } from "./TableroPDF";

const pt = (mm: number) => mm * 2.83465;

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;

// Match the column rectangle of the tablero (NOT just the illustration
// card). Width = column width. Height = lower velcro zone height.
const CARD_W_MM = 39.6;
const CARD_H_MM = 69.5;

const GUTTER_MM = 5;
const COLS = 4;
const ROWS = 2;                  // 4×2 = 8 slots, 7 used per page
const GRID_W_MM = COLS * CARD_W_MM + (COLS - 1) * GUTTER_MM;
const GRID_LEFT_MM = (PAGE_W_MM - GRID_W_MM) / 2;
const GRID_TOP_MM  = 40;

const CUT_LINE_WIDTH = 0.5;
const CUT_LINE_COLOR = "#B0B0B0";

// Fallback when the check PNG is unavailable (preview before assets sync).
const CHECK_BG  = "#5CB97F";
const CHECK_FG  = "#FFFFFF";
const LABEL_COL = "#3D5240";

// ─── Tablero landscape dimensions (mirror TableroPDF) ────────────────────────
// Used by the new blank "Listo" page so it has the exact same layout as the
// tablero — the lower zone is replaced with 7 'Listo' cells.
const TAB_PAGE_W_MM = 297;
const TAB_PAGE_H_MM = 210;
const TAB_N_CARDS   = 7;
const TAB_LOWER_Y_MM = 140.5;
const TAB_LOWER_H_MM = 69.5;
const TAB_BORDER_COL = "#DEDEDF";

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
  pageHeader: {
    position: "absolute",
    top:      pt(15),
    left:     0,
    right:    0,
    textAlign: "center",
  },
  pageHeaderTitle: {
    fontFamily: "Figtree",
    fontWeight: 700,
    fontSize:   16,
    color:      "#3D5240",
  },
  pageHeaderSub: {
    fontFamily: "Nunito",
    fontWeight: 400,
    fontSize:   9,
    color:      "#7A9080",
    marginTop:  2,
  },
});

function cellTopLeft(i: number) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const left = GRID_LEFT_MM + col * (CARD_W_MM + GUTTER_MM);
  const top  = GRID_TOP_MM  + row * (CARD_H_MM + GUTTER_MM);
  return { left, top };
}

function FichaListo({
  index,
  colorAcento,
  checkSrc,
}: {
  index: number;
  colorAcento: string;
  checkSrc?: string | null;
}) {
  const { left, top } = cellTopLeft(index);
  const BAND_H_MM = 6;          // small accent strip on top, like the tablero
  const CHECK_D_MM = 26;        // big enough to read at arm's length

  return (
    <View
      style={{
        position:        "absolute",
        left:            pt(left),
        top:             pt(top),
        width:           pt(CARD_W_MM),
        height:          pt(CARD_H_MM),
        backgroundColor: "#FFFFFF",
        borderWidth:     CUT_LINE_WIDTH,
        borderColor:     CUT_LINE_COLOR,
        borderRadius:    pt(2.5),
        overflow:        "hidden",
      }}
    >
      {/* Top accent band — mirrors the tablero look */}
      <View
        style={{
          width:           "100%",
          height:          pt(BAND_H_MM),
          backgroundColor: colorAcento,
        }}
      />

      {/* Body — green check + 'Listo' label, vertically centered */}
      <View
        style={{
          flex:           1,
          alignItems:     "center",
          justifyContent: "center",
          paddingBottom:  pt(2),
        }}
      >
        {checkSrc ? (
          <Image
            src={checkSrc}
            style={{
              width:        pt(CHECK_D_MM),
              height:       pt(CHECK_D_MM),
              marginBottom: pt(4),
              objectFit:    "contain",
            }}
          />
        ) : (
          <View
            style={{
              width:           pt(CHECK_D_MM),
              height:          pt(CHECK_D_MM),
              borderRadius:    pt(CHECK_D_MM / 2),
              backgroundColor: CHECK_BG,
              alignItems:      "center",
              justifyContent:  "center",
              marginBottom:    pt(4),
            }}
          >
            <Text
              style={{
                fontFamily: "Figtree",
                fontWeight: 700,
                fontSize:   30,
                color:      CHECK_FG,
                lineHeight: 1,
              }}
            >
              ✓
            </Text>
          </View>
        )}
        <Text
          style={{
            fontFamily:    "Figtree",
            fontWeight:    700,
            fontSize:      13,
            color:         LABEL_COL,
            letterSpacing: 0.5,
          }}
        >
          Listo
        </Text>
      </View>
    </View>
  );
}

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
              paddingBottom:   pt(6),
            }}
          >
            {/* Check placeholder — actual sticker (the recortable ficha)
                gets pasted here. If the PNG is loaded, render a faint
                version of it as a guide; otherwise show a dashed outline. */}
            {checkSrc ? (
              <Image
                src={checkSrc}
                style={{
                  width:     pt(CHECK_PLACEHOLDER_MM),
                  height:    pt(CHECK_PLACEHOLDER_MM),
                  marginBottom: pt(4),
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
                  marginBottom:    pt(4),
                  backgroundColor: "#F8F8F8",
                }}
              />
            )}
            <Text
              style={{
                fontFamily:    "Figtree",
                fontWeight:    700,
                fontSize:      14,
                color:         LABEL_COL,
                letterSpacing: 0.5,
              }}
            >
              Listo
            </Text>
          </View>
        ))}
      </View>
    </Page>
  );
}

function FichasChecksPage({
  nombreNino,
  count,
  colorAcento,
  momento,
  checkSrc,
}: {
  nombreNino: string;
  count: number;
  colorAcento: string;
  momento: "mañana" | "noche";
  checkSrc?: string | null;
}) {
  return (
    <Page size={[pt(PAGE_W_MM), pt(PAGE_H_MM)]} style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>
          Fichas de cumplido — {nombreNino}
        </Text>
        <Text style={styles.pageHeaderSub}>
          Para el tablero de la {momento}. Recortar por la línea gris.
        </Text>
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <FichaListo
          key={i}
          index={i}
          colorAcento={colorAcento}
          checkSrc={checkSrc}
        />
      ))}
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
      {/* Pages 3 & 4 — blank back-side layout for each tablero. The lower
          zone is replaced by 7 'Listo' cells (placeholder + label), no
          velcro dots. Same physical layout as the tablero so the customer
          can register the print front-to-back. */}
      <FranjaPageBlanco checkSrc={checkSrc} />
      <FranjaPageBlanco checkSrc={checkSrc} />
      {/* Pages 5 & 6 — recortable Listo fichas, one page per tablero. */}
      <FichasChecksPage
        nombreNino={nombreNino}
        count={manana.length}
        colorAcento={colorAcento}
        momento="mañana"
        checkSrc={checkSrc}
      />
      <FichasChecksPage
        nombreNino={nombreNino}
        count={noche.length}
        colorAcento={colorAcento}
        momento="noche"
        checkSrc={checkSrc}
      />
    </Document>
  );
}
// COLS/ROWS export so callers (or future tests) know the grid layout
export const _GRID = { COLS, ROWS };
