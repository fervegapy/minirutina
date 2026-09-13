"use client";

// Elegí 10 o 20 pasos ANTES de entrar al personalizador de Recompensas — así
// el wizard arranca sabiendo la cantidad (se la pasamos por query string) y
// se salta ese paso.
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function fmtPrecio(n: number, moneda: "pyg" | "usd"): string {
  return moneda === "usd"
    ? "USD " + n.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "Gs. " + n.toLocaleString("es-PY");
}

export default function CantidadPicker({
  slug,
  precio10,
  precio20,
  moneda,
}: {
  slug: string;
  precio10: number;
  precio20: number | null;
  moneda: "pyg" | "usd";
}) {
  const [cantidad, setCantidad] = useState<10 | 20>(10);
  const opciones: { valor: 10 | 20; precio: number | null }[] = [
    { valor: 10, precio: precio10 },
    { valor: 20, precio: precio20 },
  ];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#22244e]/40 mb-2">
        Cantidad de pasos
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            disabled={o.precio === null}
            onClick={() => setCantidad(o.valor)}
            className={`rounded-xl p-3 border-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              cantidad === o.valor
                ? "border-[#22244e] bg-[#336aea]/10"
                : "border-[#e5e7eb] hover:border-[#22244e]/30"
            }`}
          >
            <div className="font-bold text-sm text-[#22244e]">{o.valor} pasos</div>
            <div className="text-xs text-[#22244e]/60 mt-0.5">
              {o.precio !== null ? fmtPrecio(o.precio, moneda) : "No disponible"}
            </div>
          </button>
        ))}
      </div>
      <Link href={`/personalizar/${slug}?cantidad=${cantidad}`}>
        <Button className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl shadow-none border-0 text-base h-12">
          Personalizar tablero
        </Button>
      </Link>
    </div>
  );
}
