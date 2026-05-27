"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ConfirmacionInner() {
  const params = useSearchParams();
  const nombreNino = params.get("nombre_nino") ?? "tu niño";
  const pagado     = params.get("pagado")    === "1";
  const fallback   = params.get("fallback")  === "1";

  return (
    <main className="min-h-screen bg-[#faf6e7] flex items-center justify-center px-4 py-10">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-[#22244e] mb-3">
          ¡Listo! El tablero de {nombreNino} ya está en proceso.
        </h1>

        {pagado && (
          <div className="inline-flex items-center gap-2 mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
            <span>✓</span>
            <span>Pago confirmado</span>
          </div>
        )}
        {fallback && (
          <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Tu pedido fue grabado. No pudimos abrir la página de pago — te
            escribimos por WhatsApp en breve para coordinar.
          </div>
        )}

        <p className="text-[#22244e]/70 mb-10 text-base leading-relaxed">
          Recibimos tu pedido y empezamos a prepararlo. Te avisamos por
          WhatsApp y email cuando esté listo para enviar.
        </p>

        <Link href="/">
          <Button
            variant="outline"
            className="border-[#22244e] text-[#22244e] rounded-xl font-semibold h-12 px-6"
          >
            Volver al inicio
          </Button>
        </Link>
      </div>
    </main>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense>
      <ConfirmacionInner />
    </Suspense>
  );
}
