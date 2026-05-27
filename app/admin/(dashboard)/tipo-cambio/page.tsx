import { getTasaActual, getHistorialTasas } from "@/lib/tipo-cambio";
import TipoCambioView from "@/components/admin/TipoCambioView";

export const dynamic = "force-dynamic";

export default async function TipoCambioPage() {
  const [{ tasa, row: actual }, historial] = await Promise.all([
    getTasaActual(),
    getHistorialTasas(50),
  ]);

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Tipo de cambio
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Tasa que se usa para cobrar en Stripe (1 USD = X Gs.). Cada cambio
          queda en el historial — los pedidos viejos conservan la tasa con
          la que se pagaron.
        </p>
      </header>
      <TipoCambioView
        tasaActual={tasa}
        actual={actual}
        historial={historial}
      />
    </div>
  );
}
