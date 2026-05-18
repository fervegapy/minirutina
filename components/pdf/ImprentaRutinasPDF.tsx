// Imprenta-bound PDF for the Rutinas product.
//
// 4 pages: morning tablero, night tablero, and two sheets of "Listo"
// fichas — one per tablero (7 each, 14 total). The ficha matches the
// proportions of a full column on the tablero (39.6 mm × 69.5 mm) so it
// can sit on the same velcro slot when the kid flips it.
import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
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

const CHECK_BG  = "#5CB97F";
const CHECK_FG  = "#FFFFFF";
const LABEL_COL = "#3D5240";

export interface ImprentaRutinasPDFProps {
  nombreNino: string;
  colorAcento: string;
  manana: string[];
  noche: string[];
  images: Record<string, string>;
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
}: {
  index: number;
  colorAcento: string;
}) {
  const { left, top } = cellTopLeft(index);
  const BAND_H_MM = 6;          // small accent strip on top, like the tablero
  const CHECK_D_MM = 18;

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

      {/* Body — check circle + label, vertically centered in the remaining space */}
      <View
        style={{
          flex:           1,
          alignItems:     "center",
          justifyContent: "center",
          paddingBottom:  pt(2),
        }}
      >
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
              fontSize:   28,
              color:      CHECK_FG,
              lineHeight: 1,
            }}
          >
            ✓
          </Text>
        </View>
        <Text
          style={{
            fontFamily:    "Figtree",
            fontWeight:    700,
            fontSize:      12,
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

function FichasChecksPage({
  nombreNino,
  count,
  colorAcento,
  momento,
}: {
  nombreNino: string;
  count: number;
  colorAcento: string;
  momento: "mañana" | "noche";
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
        <FichaListo key={i} index={i} colorAcento={colorAcento} />
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
      <FichasChecksPage
        nombreNino={nombreNino}
        count={manana.length}
        colorAcento={colorAcento}
        momento="mañana"
      />
      <FichasChecksPage
        nombreNino={nombreNino}
        count={noche.length}
        colorAcento={colorAcento}
        momento="noche"
      />
    </Document>
  );
}
// COLS/ROWS export so callers (or future tests) know the grid layout
export const _GRID = { COLS, ROWS };
