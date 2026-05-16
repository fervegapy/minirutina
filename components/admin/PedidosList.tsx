"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import type { Pedido, EstadoPedido } from "@/types/pedido";
import { ESTADOS, labelDeEstado } from "@/lib/estado-pedido";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PRODUCTO_LABEL: Record<string, string> = {
  rutinas: "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
};

// Tailwind classes per state — kept here so the badge stays in B&W-ish
// neutral tones with just enough color to scan quickly.
const BADGE_CLS: Record<EstadoPedido, string> = {
  pendiente:     "bg-amber-100 text-amber-800 border border-amber-200",
  pagado:        "bg-sky-100 text-sky-800 border border-sky-200",
  en_produccion: "bg-violet-100 text-violet-800 border border-violet-200",
  enviado:       "bg-indigo-100 text-indigo-800 border border-indigo-200",
  entregado:     "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

type FiltroEstado   = "todos" | EstadoPedido;
type FiltroProducto = "todos" | "rutinas" | "recompensas";
type FiltroTipo     = "todos" | "fisico" | "digital";

const formatoFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

export default function PedidosList({ pedidos }: { pedidos: Pedido[] }) {
  const [busqueda, setBusqueda]   = useState("");
  const [estadoF, setEstadoF]     = useState<FiltroEstado>("todos");
  const [productoF, setProductoF] = useState<FiltroProducto>("todos");
  const [tipoF, setTipoF]         = useState<FiltroTipo>("todos");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (estadoF !== "todos" && p.estado !== estadoF) return false;
      if (productoF !== "todos" && p.producto !== productoF) return false;
      if (tipoF !== "todos" && p.tipo_entrega !== tipoF) return false;
      if (q) {
        const hay = `${p.nombre_nino ?? ""} ${p.contacto ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pedidos, busqueda, estadoF, productoF, tipoF]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="bg-white">
        <CardContent className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Buscar nombre o contacto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 text-sm bg-white"
              />
            </div>
            <Select
              value={estadoF}
              onChange={(v) => setEstadoF(v as FiltroEstado)}
              options={[
                { value: "todos", label: "Estado: todos" },
                ...ESTADOS.map((e) => ({ value: e.id, label: e.label })),
              ]}
            />
            <Select
              value={productoF}
              onChange={(v) => setProductoF(v as FiltroProducto)}
              options={[
                { value: "todos",       label: "Producto: todos" },
                { value: "rutinas",     label: "Rutinas" },
                { value: "recompensas", label: "Recompensas" },
              ]}
            />
            <Select
              value={tipoF}
              onChange={(v) => setTipoF(v as FiltroTipo)}
              options={[
                { value: "todos",   label: "Entrega: todas" },
                { value: "fisico",  label: "Física" },
                { value: "digital", label: "Digital" },
              ]}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            {filtrados.length} de {pedidos.length} pedidos
          </p>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="bg-white overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">
            No hay pedidos que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Niño/a</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Entrega</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                    {formatoFecha(p.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {p.nombre_nino ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {PRODUCTO_LABEL[p.producto] ?? p.producto}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 capitalize">
                    {p.tipo_entrega}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={BADGE_CLS[p.estado]}>
                      {labelDeEstado(p.estado)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="text-zinc-400 hover:text-zinc-900 transition-colors inline-flex"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// Native select dressed up to match the shadcn Input look — keeps the
// dependency footprint small (no need to install shadcn Select).
function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm h-9 px-3 rounded-md border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
