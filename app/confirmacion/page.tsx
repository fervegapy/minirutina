"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ConfirmacionInner() {
  const params = useSearchParams();
  const nombreNino = params.get("nombre_nino") ?? "tu niño";
  const tipoEntrega = params.get("tipo_entrega") ?? "digital";

  return (
    <main className="min-h-screen bg-[#fffef6] flex items-center justify-center px-4 py-10">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-[#233933] mb-3">
          ¡Listo, {nombreNino}!
        </h1>
        <p className="text-[#233933]/70 mb-10 text-base leading-relaxed">
          Tu pedido fue recibido correctamente.{" "}
          {tipoEntrega === "digital"
            ? "En breve recibirás tu tablero para descargar."
            : "Nos contactaremos por WhatsApp para coordinar el envío."}
        </p>

        {tipoEntrega === "digital" ? (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
            <p className="text-sm text-[#233933]/60 mb-4">
              Tu archivo estará disponible en las próximas horas.
            </p>
            <Button
              disabled
              className="w-full bg-[#ecbc5d]/50 text-[#233933]/50 font-bold rounded-xl shadow-none border-0 cursor-not-allowed"
            >
              📥 Descargar mi tablero
            </Button>
            <p className="text-xs text-[#233933]/40 mt-2">
              El link de descarga llegará a tu contacto.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-semibold text-[#233933] text-sm">
              Te contactamos por WhatsApp para coordinar el envío.
            </p>
            <p className="text-xs text-[#233933]/50 mt-2">
              En 24–48 hs hábiles nos comunicamos con vos.
            </p>
          </div>
        )}

        <Link href="/">
          <Button
            variant="outline"
            className="border-[#233933] text-[#233933] rounded-xl font-semibold"
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
