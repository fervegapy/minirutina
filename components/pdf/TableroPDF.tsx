import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableroPDFProps {
  nombreNino: string;
  colorAcento: string;
  manana: string[];   // up to 7 icon IDs
  siesta: string[];
  noche: string[];
  // Pre-read image buffers (base64 data URLs), keyed by icon ID.
  // Decoration images keyed as "deco:manana-left", "deco:noche-right", etc.
  images: Record<string, string>;
}

// ─── Layout constants (mm) ────────────────────────────────────────────────────

const PAGE_W = 297;
const PAGE_H = 210;

const HEADER_H = 70.3;
const BAND_Y = 70.3;
const BAND_H = 69.6;
const SLOT_W = 42.4;
const CARD_W = 39.6;
const CARD_H = 39.9;
const CARD_Y = 98.2;          // from page top
const LOWER_Y = 140.5;
const LOWER_H = PAGE_H - LOWER_Y;
const CARD_PADDING = 4;
const CARD_RADIUS = 3;

// x offsets of each slot (mm from left edge)
const SLOT_X = [1.4, 43.9, 86.3, 128.8, 171.2, 213.6, 256.0];

const PLACEHOLDER_COLOR = "#D7D9DA";
const BORDER_COLOR = "#E5E7EB";
const TEXT_COLOR = "#233933";

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    width: `${PAGE_W}mm`,
    height: `${PAGE_H}mm`,
    backgroundColor: "#FFFFFF",
    position: "relative",
    fontFamily: "Helvetica",
  },
  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    width: `${PAGE_W}mm`,
    height: `${HEADER_H}mm`,
    backgroundColor: "#FFFFFF",
  },
  childName: {
    position: "absolute",
    top: "28mm",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: TEXT_COLOR,
  },
  subtitle: {
    position: "absolute",
    top: "44mm",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 14,
    color: TEXT_COLOR,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  decoLeft: {
    position: "absolute",
    top: "8mm",
    left: "8mm",
    width: "38mm",
    height: "38mm",
  },
  decoRight: {
    position: "absolute",
    top: "8mm",
    right: "8mm",
    width: "38mm",
    height: "38mm",
  },
  // Accent band
  band: {
    position: "absolute",
    top: `${BAND_Y}mm`,
    left: 0,
    width: `${PAGE_W}mm`,
    height: `${BAND_H}mm`,
  },
  // Icon cards
  card: {
    position: "absolute",
    top: `${CARD_Y}mm`,
    width: `${CARD_W}mm`,
    height: `${CARD_H}mm`,
    backgroundColor: "#FFFFFF",
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  cardPlaceholder: {
    position: "absolute",
    top: `${CARD_Y}mm`,
    width: `${CARD_W}mm`,
    height: `${CARD_H}mm`,
    backgroundColor: PLACEHOLDER_COLOR,
    borderRadius: CARD_RADIUS,
  },
  cardImage: {
    position: "absolute",
    top: `${CARD_PADDING}mm`,
    left: `${CARD_PADDING}mm`,
    width: `${CARD_W - CARD_PADDING * 2}mm`,
    height: `${CARD_H - CARD_PADDING * 2}mm`,
    objectFit: "contain",
  },
  // Lower cells
  lowerCell: {
    position: "absolute",
    top: `${LOWER_Y}mm`,
    width: `${CARD_W}mm`,
    height: `${LOWER_H}mm`,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: BORDER_COLOR,
    borderStyle: "solid",
  },
  // Branding
  brand: {
    position: "absolute",
    bottom: "2mm",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: TEXT_COLOR,
    opacity: 0.25,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mm(val: number) {
  return `${val}mm` as unknown as number;
}

function IconCard({
  idx,
  iconId,
  images,
}: {
  idx: number;
  iconId: string | undefined;
  images: Record<string, string>;
}) {
  const x = SLOT_X[idx];
  const src = iconId ? images[iconId] : undefined;

  if (!iconId || !src) {
    return (
      <View style={[s.cardPlaceholder, { left: mm(x + (SLOT_W - CARD_W) / 2) }]} />
    );
  }

  return (
    <View style={[s.card, { left: mm(x + (SLOT_W - CARD_W) / 2) }]}>
      <Image src={src} style={s.cardImage} />
    </View>
  );
}

function LowerCell({ idx }: { idx: number }) {
  const x = SLOT_X[idx];
  return (
    <View style={[s.lowerCell, { left: mm(x + (SLOT_W - CARD_W) / 2) }]} />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface FranjaPageProps {
  nombreNino: string;
  colorAcento: string;
  subtitle: string;
  decoLeftKey: string;
  decoRightKey: string;
  iconIds: string[];   // up to 7
  images: Record<string, string>;
}

function FranjaPage({
  nombreNino,
  colorAcento,
  subtitle,
  decoLeftKey,
  decoRightKey,
  iconIds,
  images,
}: FranjaPageProps) {
  const decoLeftSrc = images[decoLeftKey];
  const decoRightSrc = images[decoRightKey];

  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      {/* ── Header ── */}
      <View style={s.header} />
      <Text style={s.childName}>{nombreNino}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
      {decoLeftSrc && <Image src={decoLeftSrc} style={s.decoLeft} />}
      {decoRightSrc && <Image src={decoRightSrc} style={s.decoRight} />}

      {/* ── Accent band ── */}
      <View style={[s.band, { backgroundColor: colorAcento }]} />

      {/* ── 7 icon slots ── */}
      {SLOT_X.map((_, i) => (
        <IconCard key={i} idx={i} iconId={iconIds[i]} images={images} />
      ))}

      {/* ── Lower cells ── */}
      {SLOT_X.map((_, i) => (
        <LowerCell key={i} idx={i} />
      ))}

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
      />
      <FranjaPage
        nombreNino={nombreNino}
        colorAcento={colorAcento}
        subtitle="rutina de siesta"
        decoLeftKey="deco:siesta-left"
        decoRightKey="deco:siesta-right"
        iconIds={siesta}
        images={images}
      />
      <FranjaPage
        nombreNino={nombreNino}
        colorAcento={colorAcento}
        subtitle="rutina nocturna"
        decoLeftKey="deco:noche-left"
        decoRightKey="deco:noche-right"
        iconIds={noche}
        images={images}
      />
    </Document>
  );
}
