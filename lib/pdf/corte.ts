// Línea de corte para el PDF que recibe quien compra el digital.
//
// Los tableros están diseñados a sangre (llegan hasta el borde de la hoja),
// pensados para la imprenta. Una impresora de casa no imprime hasta el borde
// y no hay por dónde guiarse para recortar. Acá se toma el PDF ya generado,
// se achica cada página para dejar un margen y se dibuja el contorno con
// esquinas redondeadas, en línea punteada.
//
// Se hace sobre el PDF terminado (pdf-lib) y no en los componentes de
// components/pdf/, así el archivo que va a nuestra imprenta no cambia.
import { PDFDocument, rgb } from "pdf-lib";

const MM = 72 / 25.4;

// Margen libre alrededor del tablero: lo que una impresora de casa no
// llega a imprimir, más un poco de aire para la tijera.
const MARGEN = 8 * MM;
// Esquinas del contorno: 12 px a 96 ppp, la unidad del diseño web.
const RADIO = 12 * 0.75;
const GRIS = rgb(0.55, 0.57, 0.62);

/**
 * Devuelve el PDF con línea de corte en las páginas indicadas (índices desde
 * 0; sin `paginas`, en todas). Las demás páginas se copian tal cual.
 */
export async function agregarLineaDeCorte(
  original: Buffer | Uint8Array,
  paginas?: number[],
): Promise<Buffer> {
  const src = await PDFDocument.load(original);
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  for (let i = 0; i < total; i++) {
    if (paginas && !paginas.includes(i)) {
      const [copia] = await out.copyPages(src, [i]);
      out.addPage(copia!);
      continue;
    }

    const [embebida] = await out.embedPdf(src, [i]);
    const { width: w, height: h } = embebida!;
    // Misma escala en los dos ejes para no deformar el diseño.
    const escala = Math.min((w - 2 * MARGEN) / w, (h - 2 * MARGEN) / h);
    const bw = w * escala;
    const bh = h * escala;
    const x = (w - bw) / 2;
    const y = (h - bh) / 2;

    const page = out.addPage([w, h]);
    page.drawPage(embebida!, { x, y, xScale: escala, yScale: escala });

    // drawSvgPath usa coordenadas SVG (y hacia abajo) a partir del punto
    // (x, y) que se le pasa, que es la esquina superior izquierda.
    const r = RADIO;
    const contorno =
      `M ${r} 0 H ${bw - r} A ${r} ${r} 0 0 1 ${bw} ${r} ` +
      `V ${bh - r} A ${r} ${r} 0 0 1 ${bw - r} ${bh} ` +
      `H ${r} A ${r} ${r} 0 0 1 0 ${bh - r} ` +
      `V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    page.drawSvgPath(contorno, {
      x,
      y: y + bh,
      borderColor: GRIS,
      borderWidth: 0.75,
      borderDashArray: [4, 3],
    });
  }

  return Buffer.from(await out.save());
}
