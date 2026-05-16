import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

export interface TableroPDFProps {
  nombreNino: string;
  colorAcento: string;
  manana: string[];
  noche: string[];
  images: Record<string, string>;
  subtitleFont?: string;
  watermark?: boolean;
}

// ─── Unit conversion ──────────────────────────────────────────────────────────
const pt = (mm: number) => mm * 2.83465;

// ─── Colors ───────────────────────────────────────────────────────────────────
const C_TEXT      = "#3D5240";   // dark forest green — name
const C_SUB       = "#7A9080";   // lighter green — subtitle
const C_CARD      = "#D7D9DA";   // gray placeholder card
const C_BORDER    = "#DEDEDF";   // thin cell border
const C_DOT_TEAL  = "#B2DDD5";   // scattered header dots
const C_VELCRO_LO = "#C8CACC";   // lower zone velcro dots

// ─── Layout constants (mm) ────────────────────────────────────────────────────
// Perfect symmetry: gap = (297 - 7×39.6) / 8 = 2.475 mm on all 8 inter-card gaps
const CARD_W_MM  = 39.6;
const CARD_H_MM  = 39.9;
const GAP_MM     = (297 - 7 * CARD_W_MM) / 8;   // 2.475 mm
const N_CARDS    = 7;

const CARD_Y_MM  = 98.2;
const BAND_Y_MM  = 70.3;
const BAND_H_MM  = 69.6;
const LOWER_Y_MM = 140.5;
const LOWER_H_MM = 69.5;
const VELCRO_D_MM = 11.5;  // velcro dot diameter

// Derived vertical positions
const DOT_ROW_H_MM = CARD_Y_MM - BAND_Y_MM; // 27.9 mm
const BAND_DOT_TOP_MM = BAND_Y_MM + DOT_ROW_H_MM / 2 - VELCRO_D_MM / 2;
const LOWER_DOT_TOP_MM = LOWER_Y_MM + LOWER_H_MM - VELCRO_D_MM - 4;

// ─── Scattered header dots [x, y, radius] in mm ───────────────────────────────
const HEADER_DOTS: [number, number, number][] = [
  [55,  8,  2.8], [80,  4,  3.2], [108, 16, 2.2], [136, 5,  2.0],
  [163, 19, 2.5], [186, 10, 2.0], [200, 36, 2.2], [222, 7,  3.0],
  [244, 21, 2.8], [264, 14, 2.0], [280, 33, 1.8], [294, 20, 2.5],
  [36,  50, 2.0], [88,  58, 1.8], [148, 61, 2.5], [202, 56, 2.0],
  [256, 59, 2.0],
];

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    position:        "relative",
    padding:         0,
    margin:          0,
  },
  // Name
  name: {
    position:      "absolute",
    top:           pt(12),
    left:          pt(60),
    right:         pt(60),
    textAlign:     "center",
    fontFamily:    "Figtree",
    fontWeight:    700,
    fontSize:      72,
    color:         C_TEXT,
  },
  // Subtitle
  subtitle: {
    position:      "absolute",
    top:           pt(43),
    left:          0,
    right:         0,
    textAlign:     "center",
    fontFamily:    "KGPrimaryPenmanship",
    fontWeight:    400,
    fontSize:      57,
    color:         C_SUB,
  },
  // Decoration images (~80px inward = ~8.6mm; left/right from pt(6) → pt(15))
  decoLeft: {
    position: "absolute",
    top:      pt(6),
    left:     pt(15),
    width:    pt(48),
    height:   pt(48),
  },
  decoRight: {
    position: "absolute",
    top:      pt(6),
    right:    pt(15),
    width:    pt(48),
    height:   pt(48),
  },
  // Accent band background
  band: {
    position:        "absolute",
    top:             pt(BAND_Y_MM),
    left:            0,
    right:           0,
    height:          pt(BAND_H_MM),
  },
  // Branding
  brand: {
    position:      "absolute",
    bottom:        pt(2),
    left:          0,
    right:         0,
    textAlign:     "center",
    fontFamily:    "Nunito",
    fontWeight:    400,
    fontSize:      6,
    color:         C_TEXT,
    opacity:       0.25,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeaderDots() {
  return (
    <>
      {HEADER_DOTS.map(([x, y, r], i) => (
        <View
          key={i}
          style={{
            position:        "absolute",
            top:             pt(y - r),
            left:            pt(x - r),
            width:           pt(r * 2),
            height:          pt(r * 2),
            borderRadius:    pt(r),
            backgroundColor: C_DOT_TEAL,
          }}
        />
      ))}
    </>
  );
}

function VelcroDotsInBand() {
  // Flex row pinned to page edges (same frame as the band): left:0 / right:0.
  // Each cell is one of 7 equal columns; the dot is centered horizontally.
  return (
    <View
      style={{
        position:       "absolute",
        top:            pt(BAND_DOT_TOP_MM),
        left:           0,
        right:          0,
        height:         pt(VELCRO_D_MM),
        flexDirection:  "row",
      }}
    >
      {Array.from({ length: N_CARDS }).map((_, i) => (
        <View
          key={i}
          style={{
            flex:            1,
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <View
            style={{
              width:           pt(VELCRO_D_MM),
              height:          pt(VELCRO_D_MM),
              borderRadius:    pt(VELCRO_D_MM / 2),
              backgroundColor: "#FFFFFF",
            }}
          />
        </View>
      ))}
    </View>
  );
}

const CARD_VELCRO_D_MM = 9; // white circle inside gray card

function IconCard({
  iconId,
  images,
}: {
  iconId?: string;
  images: Record<string, string>;
}) {
  const src = iconId ? images[iconId] : undefined;
  const w   = pt(CARD_W_MM);
  const h   = pt(CARD_H_MM);
  const r   = pt(2.5);
  const vd  = pt(CARD_VELCRO_D_MM);

  return (
    <View
      style={{
        width:           w,
        height:          h,
        borderRadius:    r,
        backgroundColor: C_CARD,
        overflow:        "hidden",
        alignItems:      "center",
        justifyContent:  "center",
      }}
    >
      {src ? (
        // Illustration fills the card edge-to-edge — the PNG itself defines the look.
        <Image
          src={src}
          style={{
            width:     w,
            height:    h,
            objectFit: "cover",
          }}
        />
      ) : (
        <View
          style={{
            width:           vd,
            height:          vd,
            borderRadius:    vd / 2,
            backgroundColor: "#FFFFFF",
          }}
        />
      )}
    </View>
  );
}

// Row of 7 cards inside a flex container that spans the page edges (left:0/right:0)
// — same frame as the accent band, so cards line up with it perfectly.
function IconCardsRow({
  iconIds,
  images,
}: {
  iconIds: string[];
  images: Record<string, string>;
}) {
  return (
    <View
      style={{
        position:         "absolute",
        top:              pt(CARD_Y_MM),
        left:             0,
        right:            0,
        height:           pt(CARD_H_MM),
        flexDirection:    "row",
        justifyContent:   "space-between",
        paddingHorizontal: pt(GAP_MM),
      }}
    >
      {Array.from({ length: N_CARDS }).map((_, i) => (
        <IconCard key={i} iconId={iconIds[i]} images={images} />
      ))}
    </View>
  );
}

function LowerZone() {
  const vd = pt(VELCRO_D_MM);
  return (
    <>
      {/* Vertical dividers — flex row of 7 columns; render dividers between them */}
      <View
        style={{
          position:      "absolute",
          top:           pt(LOWER_Y_MM),
          left:          0,
          right:         0,
          height:        pt(LOWER_H_MM),
          flexDirection: "row",
        }}
      >
        {Array.from({ length: N_CARDS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex:        1,
              borderLeftWidth: i === 0 ? 0 : 0.8,
              borderLeftColor: C_BORDER,
            }}
          />
        ))}
      </View>
      {/* Velcro dots at bottom — flex row, dot centered in each column */}
      <View
        style={{
          position:       "absolute",
          top:            pt(LOWER_DOT_TOP_MM),
          left:           0,
          right:          0,
          height:         vd,
          flexDirection:  "row",
        }}
      >
        {Array.from({ length: N_CARDS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex:           1,
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width:           vd,
                height:          vd,
                borderRadius:    vd / 2,
                backgroundColor: C_VELCRO_LO,
              }}
            />
          </View>
        ))}
      </View>
    </>
  );
}

// ─── Watermark overlay (preview only — protects pre-paid downloads) ──────────

function Watermark() {
  return (
    <>
      {/* Full-page semi-transparent black overlay (35% opacity) */}
      <View
        style={{
          position:        "absolute",
          top:             0,
          left:            0,
          right:           0,
          bottom:          0,
          backgroundColor: "#000000",
          opacity:         0.35,
        }}
      />
      {/* Diagonal "VISTA PREVIA" text, large, centered */}
      <View
        style={{
          position:       "absolute",
          top:            0,
          left:           0,
          right:          0,
          bottom:         0,
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

// ─── Single page ──────────────────────────────────────────────────────────────

export interface FranjaPageProps {
  nombreNino:   string;
  colorAcento:  string;
  subtitle:     string;
  decoLeftKey:  string;
  decoRightKey: string;
  iconIds:      string[];
  images:       Record<string, string>;
  subtitleFont: string;
  watermark:    boolean;
}

export function FranjaPage({
  nombreNino,
  colorAcento,
  subtitle,
  decoLeftKey,
  decoRightKey,
  iconIds,
  images,
  subtitleFont,
  watermark,
}: FranjaPageProps) {
  return (
    <Page size={[pt(297), pt(210)]} style={s.page}>
      {/* Name + subtitle */}
      <Text style={s.name}>{nombreNino}</Text>
      <Text style={[s.subtitle, { fontFamily: subtitleFont }]}>{subtitle}</Text>

      {/* Decorations */}
      {images[decoLeftKey]  && <Image src={images[decoLeftKey]}  style={s.decoLeft}  />}
      {images[decoRightKey] && <Image src={images[decoRightKey]} style={s.decoRight} />}

      {/* Accent band */}
      <View style={[s.band, { backgroundColor: colorAcento }]} />

      {/* Velcro dots row inside band */}
      <VelcroDotsInBand />

      {/* Icon cards */}
      <IconCardsRow iconIds={iconIds} images={images} />

      {/* Lower zone: dividers + velcro dots */}
      <LowerZone />

      <Text style={s.brand}>minirutina.com</Text>

      {/* Preview-only watermark — must be last so it overlays everything */}
      {watermark && <Watermark />}
    </Page>
  );
}

// ─── Document ────────────────────────────────────────────────────────────────

export default function TableroPDF({
  nombreNino,
  colorAcento,
  manana,
  noche,
  images,
  subtitleFont = "Nunito",
  watermark = false,
}: TableroPDFProps) {
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
        watermark={watermark}
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
        watermark={watermark}
      />
    </Document>
  );
}
