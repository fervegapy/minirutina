import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

export interface TableroPDFProps {
  nombreNino: string;
  colorAcento: string;
  manana: string[];
  siesta: string[];
  noche: string[];
  images: Record<string, string>;
  subtitleFont?: string;
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
const SLOT_X_MM  = [1.4, 43.9, 86.3, 128.8, 171.2, 213.6, 256.0];
const SLOT_W_MM  = 42.4;
const CARD_W_MM  = 39.6;
const CARD_H_MM  = 39.9;
const CARD_Y_MM  = 98.2;
const BAND_Y_MM  = 70.3;
const BAND_H_MM  = 69.6;
const LOWER_Y_MM = 140.5;
const LOWER_H_MM = 69.5;
const PAD_MM     = 4;
const VELCRO_D_MM = 11.5;  // velcro dot diameter

// Derived positions
const cardLeftMM   = (i: number) => SLOT_X_MM[i] + (SLOT_W_MM - CARD_W_MM) / 2;
const dotLeftMM    = (i: number) => SLOT_X_MM[i] + SLOT_W_MM / 2 - VELCRO_D_MM / 2;
const DOT_ROW_H_MM = CARD_Y_MM - BAND_Y_MM; // 27.9 mm
const BAND_DOT_TOP_MM = BAND_Y_MM + DOT_ROW_H_MM / 2 - VELCRO_D_MM / 2;
const LOWER_DOT_TOP_MM = LOWER_Y_MM + LOWER_H_MM - VELCRO_D_MM - 4;

// Divider x positions (between slots)
const DIVIDER_X_MM = SLOT_X_MM.slice(0, 6).map((x) => x + SLOT_W_MM);

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
    width:           pt(297),
    height:          pt(210),
    backgroundColor: "#FFFFFF",
    position:        "relative",
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
  // Decoration images
  decoLeft: {
    position: "absolute",
    top:      pt(6),
    left:     pt(6),
    width:    pt(48),
    height:   pt(48),
  },
  decoRight: {
    position: "absolute",
    top:      pt(6),
    right:    pt(6),
    width:    pt(48),
    height:   pt(48),
  },
  // Accent band background
  band: {
    position:        "absolute",
    top:             pt(BAND_Y_MM),
    left:            0,
    width:           pt(297),
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
  return (
    <>
      {SLOT_X_MM.map((_, i) => (
        <View
          key={i}
          style={{
            position:        "absolute",
            top:             pt(BAND_DOT_TOP_MM),
            left:            pt(dotLeftMM(i)),
            width:           pt(VELCRO_D_MM),
            height:          pt(VELCRO_D_MM),
            borderRadius:    pt(VELCRO_D_MM / 2),
            backgroundColor: "#FFFFFF",
          }}
        />
      ))}
    </>
  );
}

const CARD_VELCRO_D_MM = 9; // white circle inside gray card

function IconCard({
  i,
  iconId,
  images,
}: {
  i: number;
  iconId?: string;
  images: Record<string, string>;
}) {
  const src  = iconId ? images[iconId] : undefined;
  const left = pt(cardLeftMM(i));
  const top  = pt(CARD_Y_MM);
  const w    = pt(CARD_W_MM);
  const h    = pt(CARD_H_MM);
  const pad  = pt(PAD_MM);
  const r    = pt(2.5);
  const vd   = pt(CARD_VELCRO_D_MM);

  return (
    <View
      style={{
        position:        "absolute",
        top,
        left,
        width:           w,
        height:          h,
        borderRadius:    r,
        backgroundColor: C_CARD,
        overflow:        "hidden",
      }}
    >
      {src ? (
        <Image
          src={src}
          style={{
            position:  "absolute",
            top:       pad,
            left:      pad,
            width:     w - pad * 2,
            height:    h - pad * 2,
            objectFit: "contain",
          }}
        />
      ) : (
        /* Centered white velcro dot placeholder */
        <View
          style={{
            position:        "absolute",
            top:             h / 2 - vd / 2,
            left:            w / 2 - vd / 2,
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

function LowerZone() {
  return (
    <>
      {/* Vertical dividers */}
      {DIVIDER_X_MM.map((x, i) => (
        <View
          key={i}
          style={{
            position:        "absolute",
            top:             pt(LOWER_Y_MM),
            left:            pt(x),
            width:           0.8,
            height:          pt(LOWER_H_MM),
            backgroundColor: C_BORDER,
          }}
        />
      ))}
      {/* Velcro dots at bottom */}
      {SLOT_X_MM.map((_, i) => (
        <View
          key={i}
          style={{
            position:        "absolute",
            top:             pt(LOWER_DOT_TOP_MM),
            left:            pt(dotLeftMM(i)),
            width:           pt(VELCRO_D_MM),
            height:          pt(VELCRO_D_MM),
            borderRadius:    pt(VELCRO_D_MM / 2),
            backgroundColor: C_VELCRO_LO,
          }}
        />
      ))}
    </>
  );
}

// ─── Single page ──────────────────────────────────────────────────────────────

interface FranjaPageProps {
  nombreNino:   string;
  colorAcento:  string;
  subtitle:     string;
  decoLeftKey:  string;
  decoRightKey: string;
  iconIds:      string[];
  images:       Record<string, string>;
  subtitleFont: string;
}

function FranjaPage({
  nombreNino,
  colorAcento,
  subtitle,
  decoLeftKey,
  decoRightKey,
  iconIds,
  images,
  subtitleFont,
}: FranjaPageProps) {
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      {/* Scattered header dots */}
      <HeaderDots />

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
      {SLOT_X_MM.map((_, i) => (
        <IconCard key={i} i={i} iconId={iconIds[i]} images={images} />
      ))}

      {/* Lower zone: dividers + velcro dots */}
      <LowerZone />

      <Text style={s.brand}>minirutina.com</Text>
    </Page>
  );
}

// ─── Document ────────────────────────────────────────────────────────────────

export default function TableroPDF({
  nombreNino,
  colorAcento,
  manana,
  siesta,
  noche,
  images,
  subtitleFont = "Nunito",
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
      />
      <FranjaPage
        nombreNino={nombreNino}
        colorAcento={colorAcento}
        subtitle="rutina de siesta"
        decoLeftKey="deco:siesta-left"
        decoRightKey="deco:siesta-right"
        iconIds={siesta}
        images={images}
        subtitleFont={subtitleFont}
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
      />
    </Document>
  );
}
