import type { EstadoPedido } from "@/types/pedido";

// Single source of truth for human-friendly labels and Tailwind color
// classes per pedido state. Kept here so it's shared between the list,
// the detail page and the eventual status-change actions.
export const ESTADOS: { id: EstadoPedido; label: string; color: string }[] = [
  { id: "pendiente",     label: "Pendiente",     color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { id: "pagado",        label: "Pagado",        color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "en_produccion", label: "En producción", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "enviado",       label: "Enviado",       color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { id: "entregado",     label: "Entregado",     color: "bg-green-100 text-green-800 border-green-200" },
];

export function labelDeEstado(estado: EstadoPedido): string {
  return ESTADOS.find((e) => e.id === estado)?.label ?? estado;
}

export function colorDeEstado(estado: EstadoPedido): string {
  return ESTADOS.find((e) => e.id === estado)?.color ?? "bg-gray-100 text-gray-800";
}

// Next sensible state — used by the "advance status" button.
export function siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
  const order: EstadoPedido[] = ["pendiente", "pagado", "en_produccion", "enviado", "entregado"];
  const i = order.indexOf(estado);
  if (i < 0 || i === order.length - 1) return null;
  return order[i + 1];
}
