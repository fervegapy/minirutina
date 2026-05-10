import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type Genero = "nino" | "nina";

export interface RecompensaPDFProps {
  nombreNino: string;
  genero: Genero;
  cantidad: 10 | 20;
  watermark?: boolean;
  subtitleFont?: string;
}

// ─── Unit conversion ──────────────────────────────────────────────────────────
const pt = (mm: number) => mm * 2.83465;

// ─── Page constants (A4 portrait) ────────────────────────────────────────────
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;

// ─── Palettes per gender ──────────────────────────────────────────────────────
const PALETTES: Record<Genero, {
  bg:        string;  // page background (very light tint of accent)
  prefix:    string;  // "tablero de" muted color
  name:      string;  // child's name color
  stamp:     string;  // "¡LO LOGRASTE!" + first-circle color
  pill:      string;  // "mi recompensa" pill background
  pillText:  string;  // pill label color
}> = {
  nino: {
    bg:       "#E8EFF4",
    prefix:   "#7E8C8A",
    name:     "#3D5C7E",
    stamp:    "#4A8DBE",
    pill:     "#FFFFFF",
    pillText: "#1F2937",
  },
  nina: {
    bg:       "#F2E8E5",
    prefix:   "#7E8C8A",
    name:     "#B86F60",
    stamp:    "#B86F60",
    pill:     "#FFFFFF",
    pillText: "#1F2937",
  },
};

const VELCRO_FILL  = "#BFC4B5";  // soft sage — different from the gray reference
const VELCRO_DOT   = "#FFFFFF";  // center hole
const ARROW_COLOR  = "#1F2937";  // "comienza aquí ->"

// ─── Circle path generation ───────────────────────────────────────────────────
// "S"-shaped zigzag distribution. Returns each circle's [x, y, diameter] in mm.
function buildPath(cantidad: 10 | 20): { x: number; y: number; d: number }[] {
  if (cantidad === 10) {
    // 3 rows: 3-3-4, big circles ~28mm
    const D = 28;
    const TOP = 95;
    const ROW_H = 55;
    const positions: { x: number; y: number; d: number }[] = [];
    // row 1: 3 circles, going right, slight downward slope
    [55, 100, 145].forEach((x, i) => positions.push({ x, y: TOP + i * 4, d: D }));
    // row 2: 3 circles, going left, lowered
    [140, 95, 50].forEach((x, i) => positions.push({ x, y: TOP + ROW_H + i * 0, d: D }));
    // row 3: 4 circles bottom row (going right)
    [40, 80, 120, 160].forEach((x) => positions.push({ x, y: TOP + ROW_H * 2 + 5, d: D }));
    return positions;
  }
  // 20 circles: 4 rows of 5, smaller circles
  const D = 20;
  const TOP = 95;
  const ROW_H = 42;
  const xs = [35, 70, 105, 140, 175];
  const positions: { x: number; y: number; d: number }[] = [];
  for (let row = 0; row < 4; row++) {
    const y = TOP + row * ROW_H;
    const rowXs = row % 2 === 0 ? xs : [...xs].reverse();
    rowXs.forEach((x) => positions.push({ x, y, d: D }));
  }
  return positions;
}

// ─── Watermark ────────────────────────────────────────────────────────────────
function Watermark() {
  return (
    <>
      <View
        style={{
          position:        "absolute",
          top:             0, left: 0, right: 0, bottom: 0,
          backgroundColor: "#000000",
          opacity:         0.35,
        }}
      />
      <View
        style={{
          position:       "absolute",
          top:            0, left: 0, right: 0, bottom: 0,
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily:    "Figtree",
            fontWeight:    700,
            fontSize:      120,
            color:         "#FFFFFF",
            opacity:       0.55,
            letterSpacing: 8,
            transform:     "rotate(-22deg)",
          }}
        >
          VISTA PREVIA
        </Text>
      </View>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RecompensaPDF({
  nombreNino,
  genero,
  cantidad,
  watermark = false,
  subtitleFont = "Nunito",
}: RecompensaPDFProps) {
  const palette = PALETTES[genero];
  const path = buildPath(cantidad);

  const styles = StyleSheet.create({
    page: {
      backgroundColor: palette.bg,
      position:        "relative",
      padding:         0,
      margin:          0,
    },
    headerWrap: {
      position:       "absolute",
      top:            pt(20),
      left:           0,
      right:          0,
      flexDirection:  "row",
      justifyContent: "center",
      alignItems:     "baseline",
    },
    headerPrefix: {
      fontFamily: subtitleFont,
      fontSize:   28,
      color:      palette.prefix,
      marginRight: 10,
    },
    headerName: {
      fontFamily: "Figtree",
      fontWeight: 700,
      fontSize:   46,
      color:      palette.name,
    },
    pillRow: {
      position:       "absolute",
      top:            pt(48),
      left:           pt(15),
      right:          pt(15),
      flexDirection:  "row",
      alignItems:     "center",
    },
    pillLabel: {
      fontFamily: "Figtree",
      fontWeight: 700,
      fontSize:   16,
      color:      palette.pillText,
      marginRight: 10,
    },
    pill: {
      flex:            1,
      height:          pt(11),
      backgroundColor: palette.pill,
      borderRadius:    pt(5.5),
    },
    arrowText: {
      position:   "absolute",
      top:        pt(78),
      left:       pt(15),
      fontFamily: subtitleFont,
      fontSize:   18,
      color:      ARROW_COLOR,
    },
    stamp: {
      position:    "absolute",
      bottom:      pt(20),
      right:       pt(15),
      fontFamily:  subtitleFont,
      fontSize:    24,
      color:       palette.stamp,
      fontWeight:  700,
      letterSpacing: 1,
      textAlign:   "right",
    },
  });

  return (
    <Document>
      <Page size={[pt(PAGE_W_MM), pt(PAGE_H_MM)]} style={styles.page}>
        {/* Header: tablero de NAME */}
        <View style={styles.headerWrap}>
          <Text style={styles.headerPrefix}>tablero de</Text>
          <Text style={styles.headerName}>{nombreNino || "tu niño"}</Text>
        </View>

        {/* Reward pill: "mi recompensa" + blank line to fill in by hand */}
        <View style={styles.pillRow}>
          <Text style={styles.pillLabel}>mi recompensa</Text>
          <View style={styles.pill} />
        </View>

        {/* "comienza aquí →" — pointing to the first circle */}
        <Text style={styles.arrowText}>comienza aquí  →</Text>

        {/* Velcro circles in S-shape */}
        {path.map((c, i) => {
          const isFirst = i === 0;
          const fill = isFirst ? palette.stamp : VELCRO_FILL;
          const dotD = c.d * 0.32;
          return (
            <View
              key={i}
              style={{
                position:        "absolute",
                top:             pt(c.y - c.d / 2),
                left:            pt(c.x - c.d / 2),
                width:           pt(c.d),
                height:          pt(c.d),
                borderRadius:    pt(c.d / 2),
                backgroundColor: fill,
                opacity:         isFirst ? 0.7 : 1,
                alignItems:      "center",
                justifyContent:  "center",
              }}
            >
              <View
                style={{
                  width:           pt(dotD),
                  height:          pt(dotD),
                  borderRadius:    pt(dotD / 2),
                  backgroundColor: VELCRO_DOT,
                }}
              />
            </View>
          );
        })}

        {/* "¡LO LOGRASTE!" stamp bottom-right */}
        <Text style={styles.stamp}>¡LO LOGRASTE!</Text>

        {/* Brand */}
        <Text
          style={{
            position:      "absolute",
            bottom:        pt(2),
            left:          0,
            right:         0,
            textAlign:     "center",
            fontFamily:    "Nunito",
            fontWeight:    400,
            fontSize:      6,
            color:         palette.name,
            opacity:       0.25,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          minirutina.com
        </Text>

        {watermark && <Watermark />}
      </Page>
    </Document>
  );
}
