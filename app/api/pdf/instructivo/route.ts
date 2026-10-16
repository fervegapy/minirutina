// Descarga del instructivo de armado. Es el botón "Cómo armar tu tablero"
// del email de cupón 100% (que manda botones en vez de adjuntos). Es igual
// para todos los pedidos, así que no lleva id ni consulta la base.
import { NextResponse } from "next/server";
import { generateInstructivoBuffer } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET() {
  const buffer = await generateInstructivoBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="como-armar-tu-tablero.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
