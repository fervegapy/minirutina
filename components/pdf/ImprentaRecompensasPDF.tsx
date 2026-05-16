// Imprenta-bound PDF for the Recompensas product.
// 2 pages: tablero (reused from the customer file) + a sheet with N copies
// of the chosen sticker laid out as cut-out fichas.
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { RecompensaPage, type Genero } from "./RecompensaPDF";

const pt = (mm: number) => mm * 2.83465;

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;

export interface ImprentaRecompensasPDFProps {
  nombreNino: string;
  genero: Genero;
  cantidad: 10 | 20;
  /** PNG dict already loaded server-side (circulo-{genero}, comienza-aqui, etc.) */
  images: Record<string, string>;
  /** Sticker PNG (data URL) — null if the customer's chosen sticker isn't uploaded yet */
  stickerSrc: string | null;
  /** Sticker id the customer chose — used as a fallback label */
  stickerId: string;
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
    position:  "absolute",
    top:       pt(15),
    left:      0,
    right:     0,
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

/**
 * Layout for the sticker sheet:
 * - 10 cantidad: 3 cols × 4 rows = 12 slots, use 10. Sticker D=36mm.
 * - 20 cantidad: 4 cols × 5 rows = 20 slots, use 20. Sticker D=24mm.
 */
function stickerGrid(cantidad: 10 | 20) {
  if (cantidad === 10) {
    return { COLS: 3, ROWS: 4, CELL: 50, STICKER: 36 };
  }
  return   { COLS: 4, ROWS: 5, CELL: 36, STICKER: 24 };
}

function FichasStickersPage({
  nombreNino,
  cantidad,
  stickerSrc,
  stickerId,
}: {
  nombreNino: string;
  cantidad: 10 | 20;
  stickerSrc: string | null;
  stickerId: string;
}) {
  const { COLS, ROWS, CELL, STICKER } = stickerGrid(cantidad);
  const GRID_W = COLS * CELL;
  const GRID_H = ROWS * CELL;
  const GRID_LEFT = (PAGE_W_MM - GRID_W) / 2;
  const GRID_TOP  = 38;
  void GRID_H;

  return (
    <Page size={[pt(PAGE_W_MM), pt(PAGE_H_MM)]} style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>
          Fichas de logrado — {nombreNino}
        </Text>
        <Text style={styles.pageHeaderSub}>
          Recortar y pegar sobre cada círculo del tablero. {cantidad} unidades.
        </Text>
      </View>

      {Array.from({ length: cantidad }).map((_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const left = GRID_LEFT + col * CELL + (CELL - STICKER) / 2;
        const top  = GRID_TOP  + row * CELL + (CELL - STICKER) / 2;
        if (stickerSrc) {
          return (
            <Image
              key={i}
              src={stickerSrc}
              style={{
                position: "absolute",
                top:      pt(top),
                left:     pt(left),
                width:    pt(STICKER),
                height:   pt(STICKER),
                objectFit: "contain",
              }}
            />
          );
        }
        // Fallback: a faint circle with the sticker id (so the imprenta
        // sees we owe them a sticker asset).
        return (
          <View
            key={i}
            style={{
              position:        "absolute",
              top:             pt(top),
              left:            pt(left),
              width:           pt(STICKER),
              height:          pt(STICKER),
              borderRadius:    pt(STICKER / 2),
              backgroundColor: "#F4F4F4",
              borderWidth:     0.5,
              borderColor:     "#D4D4D4",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Text style={{ fontFamily: "Nunito", fontSize: 7, color: "#999" }}>
              {stickerId}
            </Text>
          </View>
        );
      })}
    </Page>
  );
}

export default function ImprentaRecompensasPDF({
  nombreNino,
  genero,
  cantidad,
  images,
  stickerSrc,
  stickerId,
  subtitleFont = "Nunito",
}: ImprentaRecompensasPDFProps) {
  return (
    <Document>
      <RecompensaPage
        nombreNino={nombreNino}
        genero={genero}
        cantidad={cantidad}
        images={images}
        watermark={false}
        subtitleFont={subtitleFont}
      />
      <FichasStickersPage
        nombreNino={nombreNino}
        cantidad={cantidad}
        stickerSrc={stickerSrc}
        stickerId={stickerId}
      />
    </Document>
  );
}
