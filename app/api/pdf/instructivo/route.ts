// Descarga del instructivo de armado. Es el botón "Cómo armar tu tablero"
// del email de cupón 100% (que manda botones en vez de adjuntos). Es igual
// para todos los pedidos, así que no lleva id ni consulta la base: el idioma
// llega en ?idioma=en|pt (español si falta o es otro).
import { NextResponse, type NextRequest } from "next/server";
import { generateInstructivoBuffer } from "@/lib/pdf/render";
import { archivoInstructivo } from "@/components/pdf/InstructivoPDF";

export const runtime = "nodejs";
// Generar PDFs en una función "fría" tarda ~30 s. Sin este techo explícito,
// el límite de Vercel podría cortar la función a la mitad (el pedido queda
// pagado y el email con el PDF no sale). No la hace más lenta: es un tope.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("idioma");
  const idioma = param === "en" || param === "pt" ? param : "es";
  const buffer = await generateInstructivoBuffer(idioma);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${archivoInstructivo(idioma)}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
