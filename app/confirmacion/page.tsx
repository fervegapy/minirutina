"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ConfirmacionInner() {
  const params = useSearchParams();
  const nombreNino = params.get("nombre_nino") ?? "tu niño";
  const tipoEntrega = params.get("tipo_entrega") ?? "digital";
  const pedidoId = params.get("pedido_id") ?? "test";
  const pagado    = params.get("pagado") === "1";
  const fallback  = params.get("fallback") === "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDescargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId }),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");

      if (pedidoId === "test") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tablero-test.pdf";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const { url } = await res.json();
        window.open(url, "_blank");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf6e7] flex items-center justify-center px-4 py-10">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-[#22244e] mb-3">
          ¡Listo, {nombreNino}!
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
          Tu pedido fue recibido correctamente.{" "}
          {tipoEntrega === "digital"
            ? "En breve recibirás tu tablero para descargar."
            : "Nos contactaremos por WhatsApp para coordinar el envío."}
        </p>

        {tipoEntrega === "digital" ? (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
            <p className="text-sm text-[#22244e]/60 mb-4">
              Tu tablero está listo para descargar.
            </p>
            <Button
              onClick={handleDescargar}
              disabled={loading}
              className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl shadow-none border-0 h-12"
            >
              {loading ? "Generando..." : "📥 Descargar mi tablero"}
            </Button>
            {error && (
              <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-semibold text-[#22244e] text-sm">
              Te contactamos por WhatsApp para coordinar el envío.
            </p>
            <p className="text-xs text-[#22244e]/50 mt-2">
              En 24–48 hs hábiles nos comunicamos con vos.
            </p>
          </div>
        )}

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
