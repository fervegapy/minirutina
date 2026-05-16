// Imprenta-bound PDF for the Rutinas product.
// 4 pages: morning tablero, night tablero, activity-fichas sheet,
// check-fichas sheet (back side of the activity cards).
//
// Reuses <FranjaPage> from TableroPDF so the tablero rendering stays
// identical to the customer file (just no watermark).
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { FranjaPage } from "./TableroPDF";

const pt = (mm: number) => mm * 2.83465;

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;

// 4×4 grid (14 used, 2 empty in the last row).
const COLS = 4;
const ROWS = 4;
const CELL_MM = 40;     // cell size
const CARD_MM = 36;     // visible card inside cell (4mm gutter)
const GRID_W   = COLS * CELL_MM;
const GRID_H   = ROWS * CELL_MM;
const GRID_LEFT = (PAGE_W_MM - GRID_W) / 2;
const GRID_TOP  = 38;   // leaves room for a small header

const CARD_BG    = "#FFFFFF";
const CARD_BORDER = "#E5E5E5";

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
  const left = GRID_LEFT + col * CELL_MM + (CELL_MM - CARD_MM) / 2;
  const top  = GRID_TOP  + row * CELL_MM + (CELL_MM - CARD_MM) / 2;
  return { left, top };
}

function CardFrame({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const { left, top } = cellTopLeft(index);
  return (
    <View
      style={{
        position:        "absolute",
        left:            pt(left),
        top:             pt(top),
        width:           pt(CARD_MM),
        height:          pt(CARD_MM),
        backgroundColor: CARD_BG,
        borderWidth:     0.5,
        borderColor:     CARD_BORDER,
        borderRadius:    pt(2.5),
        overflow:        "hidden",
        alignItems:      "center",
        justifyContent:  "center",
      }}
    >
      {children}
    </View>
  );
}

function FichasActividadesPage({
  nombreNino,
  iconIds,
  images,
}: {
  nombreNino: string;
  iconIds: string[];
  images: Record<string, string>;
}) {
  return (
    <Page size={[pt(PAGE_W_MM), pt(PAGE_H_MM)]} style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>
          Fichas de actividades — {nombreNino}
        </Text>
        <Text style={styles.pageHeaderSub}>
          Recortar y pegar sobre los cuadros del tablero (lado de la ilustración)
        </Text>
      </View>
      {iconIds.map((id, i) => {
        const src = images[id];
        return (
          <CardFrame key={i} index={i}>
            {src ? (
              <Image src={src} style={{ width: pt(CARD_MM), height: pt(CARD_MM), objectFit: "cover" }} />
            ) : (
              <Text style={{ fontFamily: "Nunito", fontSize: 8, color: "#999" }}>
                {id}
              </Text>
            )}
          </CardFrame>
        );
      })}
    </Page>
  );
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
          Fichas de check — {nombreNino}
        </Text>
        <Text style={styles.pageHeaderSub}>
          Reverso de las fichas anteriores (lado del velcro)
        </Text>
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <CardFrame key={i} index={i}>
          <View
            style={{
              width:           pt(CARD_MM),
              height:          pt(CARD_MM),
              backgroundColor: colorAcento,
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Figtree",
                fontWeight: 700,
                fontSize:   72,
                color:      "#FFFFFF",
              }}
            >
              ✓
            </Text>
          </View>
        </CardFrame>
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
  const allFichas = [...manana, ...noche];
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
      <FichasActividadesPage
        nombreNino={nombreNino}
        iconIds={allFichas}
        images={images}
      />
      <FichasChecksPage
        nombreNino={nombreNino}
        count={allFichas.length}
        colorAcento={colorAcento}
      />
    </Document>
  );
}
