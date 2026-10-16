// Instructivo de armado: una hoja A4 que va adjunta (o como botón de
// descarga) con cada compra digital. Cuatro pasos y tres consejos de uso.
//
// Tiene que entenderse de un vistazo: un número grande, un dibujo y una o
// dos líneas por paso. Mismo lenguaje visual que el sitio: fondo crema,
// azul Minirutina, tarjetas blancas con borde y sin sombras.
//
// Los textos van en un objeto aparte (TEXTOS) para poder sumar inglés y
// portugués sin tocar el layout.
import React from "react";
import { Document, Page, View, Text, Image, Svg, Rect, Circle, Line, Path, StyleSheet } from "@react-pdf/renderer";

const CREMA = "#faf6e7";
const NAVY = "#22244e";
const AZUL = "#336aea";
const BORDE = "#e5e7eb";
// Tintes de azul en hex sólido: react-pdf no entiende el alfa en "#rrggbbaa"
// (lo pintaba amarillo), así que van ya mezclados con blanco.
const AZUL_SUAVE = "#dfe8fc";
const AZUL_FONDO = "#e8eefb";

export interface TextosInstructivo {
  titulo: string;
  bajada: string;
  pasos: { titulo: string; texto: string }[];
  consejosTitulo: string;
  consejos: string[];
  pie: string;
}

export const TEXTOS_ES: TextosInstructivo = {
  titulo: "Cómo armar tu tablero",
  bajada: "Cuatro pasos y está listo para colgar.",
  pasos: [
    {
      titulo: "Imprimí",
      texto:
        "En hoja A4, idealmente cartulina de 300 g. El de rutinas va a doble faz: atrás quedan las fichas de «Listo».",
    },
    {
      titulo: "Plastificá",
      texto:
        "Pedí plastificado Prolam o similar en tu librería o imprenta. Así aguanta las manitos de todos los días.",
    },
    {
      titulo: "Recortá",
      texto: "Por la línea punteada del contorno, que ya trae las esquinas redondeadas.",
    },
    {
      titulo: "Pegá el velcro",
      texto: "Puntos de velcro adhesivo de 1 cm sobre los círculos marcados. ¡Y listo!",
    },
  ],
  consejosTitulo: "Para que funcione",
  consejos: [
    "Colgalo a la altura de los ojos de tu hijo, no a la tuya.",
    "La primera semana acompañalo cada vez. Después empieza a ir solo.",
    "Que lo marque él, no vos: ese gesto es lo que engancha.",
  ],
  pie: "minirutina.com",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: CREMA,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 32,
    fontFamily: "Nunito",
    color: NAVY,
  },
  logo: { width: 120, height: 30, objectFit: "contain", marginBottom: 22 },
  titulo: { fontFamily: "Figtree", fontWeight: 700, fontSize: 30, lineHeight: 1.1 },
  bajada: { fontSize: 13, color: NAVY, opacity: 0.7, marginTop: 6, marginBottom: 22 },
  grilla: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  paso: {
    width: "48.5%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pasoCabeza: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  numero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AZUL,
    color: "#ffffff",
    fontFamily: "Figtree",
    fontWeight: 700,
    fontSize: 15,
    textAlign: "center",
    paddingTop: 6,
  },
  pasoTitulo: { fontFamily: "Figtree", fontWeight: 700, fontSize: 16, marginBottom: 4 },
  pasoTexto: { fontSize: 10.5, lineHeight: 1.45, opacity: 0.75 },
  consejos: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: AZUL_FONDO,
    padding: 18,
  },
  consejosTitulo: {
    fontSize: 9,
    fontWeight: 800,
    color: AZUL,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  consejo: { flexDirection: "row", marginBottom: 6 },
  punto: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: AZUL, marginTop: 5, marginRight: 8 },
  consejoTexto: { fontSize: 11, lineHeight: 1.4, flex: 1 },
  pie: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    letterSpacing: 3,
    opacity: 0.35,
    textTransform: "uppercase",
  },
});

// ─── Pictogramas (trazo azul, 44×44) ─────────────────────────────────────────
// Dibujos de línea simples en vez de íconos de una librería: react-pdf no
// renderiza los componentes SVG de la web, y así no dependen de nada.
const T = { stroke: AZUL, strokeWidth: 2, fill: "none" } as const;

function Impresora() {
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Rect x={13} y={6} width={18} height={10} rx={1.5} {...T} />
      <Rect x={6} y={16} width={32} height={15} rx={3} {...T} />
      <Rect x={13} y={25} width={18} height={13} rx={1.5} fill="#ffffff" stroke={AZUL} strokeWidth={2} />
      <Line x1={17} y1={30} x2={27} y2={30} {...T} />
      <Line x1={17} y1={34} x2={24} y2={34} {...T} />
      <Circle cx={32} cy={21} r={1.5} fill={AZUL} />
    </Svg>
  );
}

function Plastificado() {
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Rect x={9} y={8} width={26} height={30} rx={3} fill={AZUL_SUAVE} stroke={AZUL} strokeWidth={2} />
      <Rect x={13} y={12} width={18} height={22} rx={1.5} {...T} />
      <Line x1={26} y1={15} x2={20} y2={23} stroke={AZUL} strokeWidth={1.5} />
      <Line x1={28} y1={19} x2={24} y2={25} stroke={AZUL} strokeWidth={1.5} />
    </Svg>
  );
}

function Tijera() {
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Circle cx={11} cy={31} r={5} {...T} />
      <Circle cx={11} cy={14} r={5} {...T} />
      <Line x1={15} y1={28} x2={36} y2={12} {...T} />
      <Line x1={15} y1={17} x2={36} y2={33} {...T} />
      <Path d="M 22 40 H 26 M 30 40 H 34 M 38 40 H 42" stroke={AZUL} strokeWidth={1.5} />
    </Svg>
  );
}

function Velcro() {
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Circle cx={22} cy={22} r={13} fill={AZUL_SUAVE} stroke={AZUL} strokeWidth={2} />
      <Circle cx={17} cy={18} r={1.6} fill={AZUL} />
      <Circle cx={24} cy={16} r={1.6} fill={AZUL} />
      <Circle cx={27} cy={23} r={1.6} fill={AZUL} />
      <Circle cx={20} cy={25} r={1.6} fill={AZUL} />
      <Circle cx={24} cy={29} r={1.6} fill={AZUL} />
      <Circle cx={15} cy={26} r={1.6} fill={AZUL} />
    </Svg>
  );
}

const PICTOGRAMAS = [Impresora, Plastificado, Tijera, Velcro];

export default function InstructivoPDF({
  textos = TEXTOS_ES,
  logoSrc,
}: {
  textos?: TextosInstructivo;
  logoSrc?: string | null;
}) {
  return (
    <Document title={textos.titulo} author="Minirutina">
      <Page size="A4" style={s.page}>
        {logoSrc ? <Image src={logoSrc} style={s.logo} /> : null}
        <Text style={s.titulo}>{textos.titulo}</Text>
        <Text style={s.bajada}>{textos.bajada}</Text>

        <View style={s.grilla}>
          {textos.pasos.map((p, i) => {
            const Pictograma = PICTOGRAMAS[i] ?? Impresora;
            return (
              <View key={p.titulo} style={s.paso} wrap={false}>
                <View style={s.pasoCabeza}>
                  <Text style={s.numero}>{i + 1}</Text>
                  <Pictograma />
                </View>
                <Text style={s.pasoTitulo}>{p.titulo}</Text>
                <Text style={s.pasoTexto}>{p.texto}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.consejos} wrap={false}>
          <Text style={s.consejosTitulo}>{textos.consejosTitulo}</Text>
          {textos.consejos.map((c) => (
            <View key={c} style={s.consejo}>
              <View style={s.punto} />
              <Text style={s.consejoTexto}>{c}</Text>
            </View>
          ))}
        </View>

        <Text style={s.pie} fixed>{textos.pie}</Text>
      </Page>
    </Document>
  );
}
