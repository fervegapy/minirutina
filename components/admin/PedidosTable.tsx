"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Pedido, EstadoPedido } from "@/types/pedido";

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas: "Tablero de Rutinas",
  semana: "Plan de la Semana",
  recompensas: "Tablero de Recompensas",
};

const ESTADO_COLORES: Record<EstadoPedido, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pagado: "bg-blue-100 text-blue-800 border-blue-200",
  enviado: "bg-green-100 text-green-800 border-green-200",
};

const ESTADOS: EstadoPedido[] = ["pendiente", "pagado", "enviado"];

interface PedidosTableProps {
  initialPedidos: Pedido[];
}

export default function PedidosTable({ initialPedidos }: PedidosTableProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateEstado = async (id: string, estado: EstadoPedido) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("pedidos")
      .update({ estado })
      .eq("id", id);
    if (!error) {
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado } : p))
      );
    }
    setUpdatingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-16 text-[#233933]/40">
        No hay pedidos todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e7eb] text-[#233933]/50 uppercase text-xs tracking-wide">
            <th className="text-left py-3 px-3">Fecha</th>
            <th className="text-left py-3 px-3">Producto</th>
            <th className="text-left py-3 px-3">Nombre</th>
            <th className="text-left py-3 px-3">Entrega</th>
            <th className="text-left py-3 px-3">Contacto</th>
            <th className="text-left py-3 px-3">Estado</th>
            <th className="py-3 px-3" />
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <>
              <tr
                key={pedido.id}
                className="border-b border-[#e5e7eb] hover:bg-[#fffef6] cursor-pointer"
                onClick={() => toggleExpand(pedido.id)}
              >
                <td className="py-3 px-3 text-[#233933]/70 whitespace-nowrap">
                  {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </td>
                <td className="py-3 px-3 font-medium text-[#233933]">
                  {NOMBRE_PRODUCTO[pedido.producto] ?? pedido.producto}
                </td>
                <td className="py-3 px-3 text-[#233933]">
                  {pedido.nombre_nino}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 text-[#233933]/70">
                    {pedido.tipo_entrega === "digital" ? "📲" : "📦"}{" "}
                    {pedido.tipo_entrega === "digital" ? "Digital" : "Físico"}
                  </span>
                </td>
                <td className="py-3 px-3 text-[#233933]/70 max-w-[140px] truncate">
                  {pedido.contacto}
                </td>
                <td className="py-3 px-3">
                  <select
                    value={pedido.estado}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      updateEstado(pedido.id, e.target.value as EstadoPedido)
                    }
                    disabled={updatingId === pedido.id}
                    className={`text-xs font-semibold border rounded-lg px-2 py-1 cursor-pointer focus:outline-none ${
                      ESTADO_COLORES[pedido.estado as EstadoPedido] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {e.charAt(0).toUpperCase() + e.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-3 text-[#233933]/40 text-xs">
                  {expandedId === pedido.id ? "▲" : "▼"}
                </td>
              </tr>
              {expandedId === pedido.id && (
                <tr key={`${pedido.id}-detail`} className="bg-[#fffef6]">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-bold text-[#233933]/50 text-xs uppercase mb-1">
                          Personalización
                        </p>
                        <pre className="bg-white border border-[#e5e7eb] rounded-xl p-3 text-xs text-[#233933]/80 overflow-auto max-h-36">
                          {JSON.stringify(pedido.personalizacion, null, 2)}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="font-bold text-[#233933]/50 text-xs uppercase mb-1">
                            ID
                          </p>
                          <p className="font-mono text-xs text-[#233933]/60">
                            {pedido.id}
                          </p>
                        </div>
                        {pedido.direccion && (
                          <div>
                            <p className="font-bold text-[#233933]/50 text-xs uppercase mb-1">
                              Dirección
                            </p>
                            <p className="text-[#233933]/80">
                              {pedido.direccion}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#233933]/50 text-xs uppercase">
                            Color
                          </p>
                          <div
                            className="w-5 h-5 rounded-full border border-[#e5e7eb]"
                            style={{ backgroundColor: pedido.color_acento }}
                          />
                          <span className="text-xs text-[#233933]/60">
                            {pedido.color_acento}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
