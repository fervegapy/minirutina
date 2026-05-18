// Imprenta-bound PDF for the Rutinas product.
// 3 pages: morning tablero, night tablero, and a sheet of "Listo" fichas
// (the cumplido cards that the kid flips when they finish an activity).
//
// Reuses <FranjaPage> from TableroPDF so the tablero rendering stays
// identical to the customer file (just no watermark). The cumplido cards
// match the illustration card dimensions on the tablero (39.6 × 39.9 mm)
// so they fit on the velcro dots one-to-one.
import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { FranjaPage } from "./TableroPDF";

const pt = (mm: number) => mm * 2.83465;

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;

// Same dimensions as the illustration card slots on the tablero — so the
// "Listo" ficha can physically replace the illustration on the velcro dot.
const CARD_W_MM = 39.6;
const CARD_H_MM = 39.9;

// Gutters so the cut lines don't share a blade path between adjacent cards.
const GUTTER_MM = 5;

const COLS = 4;
const ROWS = 4;                   // 16 slots — covers manana(7) + noche(7) = 14 with room to spare
const GRID_W_MM = COLS * CARD_W_MM + (COLS - 1) * GUTTER_MM;
const GRID_LEFT_MM = (PAGE_W_MM - GRID_W_MM) / 2;
const GRID_TOP_MM  = 40;          // leave space for the page header

// Cut line: subtle 0.5pt gray.
const CUT_LINE_WIDTH = 0.5;
const CUT_LINE_COLOR = "#B0B0B0";

// Brand greens — fresh check circle + dark forest for the "Listo" label.
const CHECK_BG   = "#5CB97F";     // bright green for the check circle
const CHECK_FG   = "#FFFFFF";     // white tick
const LABEL_COL  = "#3D5240";     // dark forest, matches the tablero text

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

function FichaListo({ index }: { index: number }) {
  const { left, top } = cellTopLeft(index);
  // Check circle ~14 mm — large enough to read at arm's length but with
  // breathing room above the "Listo" label.
  const CHECK_D_MM = 14;

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
        alignItems:      "center",
        justifyContent:  "center",
      }}
    >
      {/* Green check circle */}
      <View
        style={{
          width:           pt(CHECK_D_MM),
          height:          pt(CHECK_D_MM),
          borderRadius:    pt(CHECK_D_MM / 2),
          backgroundColor: CHECK_BG,
          alignItems:      "center",
          justifyContent:  "center",
          marginBottom:    pt(3),
        }}
      >
        <Text
          style={{
            fontFamily: "Figtree",
            fontWeight: 700,
            fontSize:   22,
            color:      CHECK_FG,
            lineHeight: 1,
          }}
        >
          ✓
        </Text>
      </View>

      {/* "Listo" label */}
      <Text
        style={{
          fontFamily: "Figtree",
          fontWeight: 700,
          fontSize:   11,
          color:      LABEL_COL,
          letterSpacing: 0.4,
        }}
      >
        Listo
      </Text>
    </View>
  );
}

function FichasChecksPage({
  nombreNino,
  count,
}: {
  nombreNino: string;
  count: number;
}) {
  return (
    <Page size={[pt(PAGE_W_MM), pt(PAGE_H_MM)]} style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>
          Fichas de cumplido — {nombreNino}
        </Text>
        <Text style={styles.pageHeaderSub}>
          Recortar por la línea gris. Mismo tamaño que las fichas de actividades.
        </Text>
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <FichaListo key={i} index={i} />
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
  const totalChecks = manana.length + noche.length;
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
        count={totalChecks}
      />
    </Document>
  );
}
