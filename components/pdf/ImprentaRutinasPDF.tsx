// Imprenta-bound PDF for the Rutinas product.
// 3 pages: morning tablero, night tablero, and a sheet of "check" fichas
// (the actividad fichas no longer go in the imprenta PDF — they're printed
// on the tablero itself).
//
// Reuses <FranjaPage> from TableroPDF so the tablero rendering stays
// identical to the customer file (just no watermark).
import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { FranjaPage } from "./TableroPDF";

const pt = (mm: number) => mm * 2.83465;

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;

// Checks grid — 3×3 cm cards on a 4×4 layout (room for up to 16 checks).
const COLS = 4;
const ROWS = 4;
const CARD_MM = 30;     // cut size = 3×3 cm
const GUTTER_MM = 8;    // breathing room between cuts (avoids blade overlap)
const CELL_MM = CARD_MM + GUTTER_MM;
const GRID_W   = COLS * CELL_MM - GUTTER_MM;
const GRID_LEFT = (PAGE_W_MM - GRID_W) / 2;
const GRID_TOP  = 38;

// Cut line: subtle 0.5pt gray stroke.
const CUT_LINE_WIDTH = 0.5;
const CUT_LINE_COLOR = "#B0B0B0";

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
  const left = GRID_LEFT + col * CELL_MM;
  const top  = GRID_TOP  + row * CELL_MM;
  return { left, top };
}

function FichasChecksPage({
  nombreNino,
  count,
  colorAcento,
}: {
  nombreNino: string;
  count: number;
  colorAcento: string;
}) {
  return (
    <Page size={[pt(PAGE_W_MM), pt(PAGE_H_MM)]} style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>
          Fichas de cumplido — {nombreNino}
        </Text>
        <Text style={styles.pageHeaderSub}>
          Recortar por la línea gris. Tamaño 3×3 cm.
        </Text>
      </View>
      {Array.from({ length: count }).map((_, i) => {
        const { left, top } = cellTopLeft(i);
        return (
          <View
            key={i}
            style={{
              position:        "absolute",
              left:            pt(left),
              top:             pt(top),
              width:           pt(CARD_MM),
              height:          pt(CARD_MM),
              backgroundColor: colorAcento,
              borderWidth:     CUT_LINE_WIDTH,
              borderColor:     CUT_LINE_COLOR,
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Figtree",
                fontWeight: 700,
                fontSize:   54,
                color:      "#FFFFFF",
              }}
            >
              ✓
            </Text>
          </View>
        );
      })}
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
        colorAcento={colorAcento}
      />
    </Document>
  );
}
