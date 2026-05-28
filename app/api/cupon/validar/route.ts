// Public endpoint to validate a coupon code and return the discount for
// display in the checkout. The authoritative re-validation happens again
// server-side at charge time (/api/checkout/pay-with-token), so a tampered
// client response can never produce a real discount.
import { NextRequest, NextResponse } from "next/server";
import { validarCupon } from "@/lib/cupones";

export async function POST(req: NextRequest) {
  try {
    const { codigo, montoBase } = (await req.json()) as { codigo?: string; montoBase?: number };
    if (!codigo || !montoBase || montoBase <= 0) {
      return NextResponse.json({ ok: false, error: "Datos incompletos." }, { status: 400 });
    }

    const r = await validarCupon(codigo, montoBase);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error });
    }

    return NextResponse.json({
      ok:        true,
      descuento: r.descuento,
      tipo:      r.cupon!.tipo,
      valor:     r.cupon!.valor,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al validar." }, { status: 500 });
  }
}
