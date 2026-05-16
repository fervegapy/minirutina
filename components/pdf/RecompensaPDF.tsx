import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

export type Genero = "nino" | "nina";

export interface RecompensaPDFProps {
  nombreNino: string;
  genero: Genero;
  cantidad: 10 | 20;
  /**
   * Image dictionary loaded server-side. Expected keys:
   *   - comienza-aqui
   *   - lo-lograste-nino  /  lo-lograste-nina
   *   - circulo-nino      /  circulo-nina  (same illustration used for every spot)
   * Missing keys fall back to drawn primitives so nothing crashes.
   */
  images: Record<string, string>;
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
  bg:        string;
  prefix:    string;
  name:      string;
  pillText:  string;
}> = {
  nino: {
    bg:       "#E8EFF4",
    prefix:   "#7E8C8A",
    name:     "#3D5C7E",
    pillText: "#1F2937",
  },
  nina: {
    bg:       "#F2E8E5",
    prefix:   "#7E8C8A",
    name:     "#B86F60",
    pillText: "#1F2937",
  },
};

// Fallback colors for circles when their PNG isn't present yet
const FALLBACK_VELCRO_FILL  = "#BFC4B5";
const FALLBACK_VELCRO_DOT   = "#FFFFFF";
// Used only as the stamp text fallback color (when lo-lograste PNG isn't there)
const STAMP_FALLBACK_COLOR: Record<Genero, string> = {
  nino: "#4A8DBE",
  nina: "#B86F60",
};

// ─── Circle path generation ───────────────────────────────────────────────────
// Each row is a subtle arc, alternating direction — matches the hand-drawn
// "snake" look of the reference rather than rigid horizontal lines.
// Hand-tuned serpentine path. Distances between consecutive circles stay
// in a narrow ~40–45mm range, transitions between "rows" use intermediate
// "corner" circles so the path reads as a flowing snake instead of stacked
// rectangles. First circle sits right of the arrow; last circle leaves a
// ~55mm gap on the right for the "¡LO LOGRASTE!" stamp.
function buildPath(cantidad: 10 | 20): { x: number; y: number; d: number }[] {
  if (cantidad === 10) {
    const D = 36;  // 3.6 cm
    // First circle at x=60 leaves a 4mm gap from the arrow (right edge x=38).
    // Path flows through 3 horizontal bands with "corner" circles for fluidity.
    return [
      { x:  60, y:  65, d: D },  // 1 — start, right of arrow
      { x: 105, y:  72, d: D },  // 2
      { x: 150, y:  72, d: D },  // 3
      { x: 178, y: 112, d: D },  // 4 — corner, down-right
      { x: 150, y: 152, d: D },  // 5
      { x: 105, y: 160, d: D },  // 6
      { x:  60, y: 152, d: D },  // 7
      { x:  32, y: 192, d: D },  // 8 — corner, down-left
      { x:  72, y: 228, d: D },  // 9
      { x: 122, y: 237, d: D },  // 10
    ];
  }
  // 20 circles: 5 horizontal bands, alternating direction. The first dot
  // of each new band sits close (horizontally + vertically) to the last
  // dot of the previous band, so the eye reads a continuous snake instead
  // of feeling each row reset to the page edge.
  // Inner bands (1, 2, 3) span wider than the outer bands (0, 4); outer
  // bands are inset for the arrow (top-left) and stamp (bottom-right).
  const D = 24;
  return [
    // Row 0 — going right; inset to clear the arrow.
    { x:  55, y:  65, d: D },
    { x:  95, y:  70, d: D },
    { x: 135, y:  70, d: D },
    { x: 170, y:  65, d: D },
    // Row 1 — going left; first dot stays near row-0's last to bridge them.
    { x: 175, y: 105, d: D },
    { x: 130, y: 110, d: D },
    { x:  85, y: 110, d: D },
    { x:  30, y: 105, d: D },
    // Row 2 — going right; first dot bridges row-1's left end.
    { x:  20, y: 150, d: D },
    { x:  70, y: 155, d: D },
    { x: 120, y: 155, d: D },
    { x: 170, y: 150, d: D },
    // Row 3 — going left; first dot bridges row-2's right end.
    { x: 180, y: 195, d: D },
    { x: 130, y: 200, d: D },
    { x:  80, y: 200, d: D },
    { x:  30, y: 195, d: D },
    // Row 4 — going right; first dot bridges row-3's left end.
    { x:  35, y: 240, d: D },
    { x:  75, y: 245, d: D },
    { x: 115, y: 245, d: D },
    { x: 148, y: 240, d: D },
  ];
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
/**
 * The single tablero Page — extracted so the imprenta document can reuse
 * it as page 1, with extra fichas pages tacked on after.
 */
export function RecompensaPage({
  nombreNino,
  genero,
  cantidad,
  images,
  watermark = false,
  subtitleFont = "Nunito",
}: RecompensaPDFProps) {
  const palette = PALETTES[genero];
  const path = buildPath(cantidad);

  const circleSrc  = images[`circulo-${genero}`];
  const arrowSrc   = images["comienza-aqui"];
  const stampSrc   = images[`lo-lograste-${genero}`];

  const styles = StyleSheet.create({
    page: {
      backgroundColor: palette.bg,
      position:        "relative",
      padding:         0,
      margin:          0,
    },
    headerWrap: {
      position:       "absolute",
      top:            pt(18),
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
    // "mi recompensa" pill — moved BELOW the velcro path, sits just above
    // the brand line. The blank line is now ~22mm tall (double the old size)
    // so there's plenty of room to write the reward by hand.
    pillRow: {
      position:       "absolute",
      bottom:         pt(15),
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
      backgroundColor: "#FFFFFF",
      borderRadius:    pt(5.5),
    },
  });

  return (
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

        {/* "comienza aquí →" — wrapped in a flex box that's exactly the
            same height as the first dot. The arrow inside is vertically
            centered (alignItems: center), so regardless of the PNG's actual
            aspect ratio it lines up with the dot's center. */}
        {(() => {
          const first = path[0];
          const boxTop  = pt(first.y - first.d / 2);
          const boxH    = pt(first.d);
          if (arrowSrc) {
            return (
              <View
                style={{
                  position:      "absolute",
                  top:           boxTop,
                  left:          pt(8),
                  width:         pt(30),
                  height:        boxH,
                  flexDirection: "row",
                  alignItems:    "center",
                }}
              >
                <Image src={arrowSrc} style={{ width: pt(30) }} />
              </View>
            );
          }
          return (
            <View
              style={{
                position:       "absolute",
                top:            boxTop,
                left:           pt(10),
                width:          pt(30),
                height:         boxH,
                flexDirection:  "row",
                alignItems:     "center",
              }}
            >
              <Text
                style={{
                  fontFamily: subtitleFont,
                  fontSize:   14,
                  color:      "#1F2937",
                }}
              >
                comienza aquí  →
              </Text>
            </View>
          );
        })()}

        {/* Velcro circles in S-shape — same image for every position */}
        {path.map((c, i) => {
          const top  = pt(c.y - c.d / 2);
          const left = pt(c.x - c.d / 2);
          const w    = pt(c.d);
          if (circleSrc) {
            return (
              <Image
                key={i}
                src={circleSrc}
                style={{
                  position: "absolute",
                  top, left,
                  width:  w,
                  height: w,
                }}
              />
            );
          }
          // Drawn fallback (used until circulo-{genero}.png is uploaded)
          const dotD = c.d * 0.32;
          return (
            <View
              key={i}
              style={{
                position:        "absolute",
                top, left,
                width:           w,
                height:          w,
                borderRadius:    w / 2,
                backgroundColor: FALLBACK_VELCRO_FILL,
                alignItems:      "center",
                justifyContent:  "center",
              }}
            >
              <View
                style={{
                  width:           pt(dotD),
                  height:          pt(dotD),
                  borderRadius:    pt(dotD / 2),
                  backgroundColor: FALLBACK_VELCRO_DOT,
                }}
              />
            </View>
          );
        })}

        {/* "¡LO LOGRASTE!" stamp.
            Width is always 30mm (same as the arrow) and aligned to the right
            margin (15mm) — matching the right edge of the "mi recompensa"
            pill. Vertical position centers on the last circle's center
            for both variants (estimate: stamp PNG ≈ 30mm tall at width:30). */}
        {(() => {
          const last = path[path.length - 1];
          const style = {
            position: "absolute" as const,
            top:      pt(last.y - 15),
            right:    pt(15),
            width:    pt(30),
          };
          if (stampSrc) {
            return <Image src={stampSrc} style={style} />;
          }
          // Text fallback uses the same anchors
          return (
            <Text
              style={{
                ...style,
                fontFamily:    subtitleFont,
                fontSize:      16,
                color:         STAMP_FALLBACK_COLOR[genero],
                fontWeight:    700,
                letterSpacing: 1,
                textAlign:     "right",
              }}
            >
              ¡LO LOGRASTE!
            </Text>
          );
        })()}

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
  );
}

/** Default export: the customer-facing single-page Document. */
export default function RecompensaPDF(props: RecompensaPDFProps) {
  return (
    <Document>
      <RecompensaPage {...props} />
    </Document>
  );
}
