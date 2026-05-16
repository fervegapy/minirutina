// Per-pedido revenue computation.
//
// Prices live in the `precios` table (loaded once per dashboard render)
// and the delivery fee is a constant. The pedido doesn't snapshot prices
// at order time, so if prices ever change, historical revenue will
// recompute against the current rates — acceptable for the MVP.

import type { Pedido } from "@/types/pedido";

export const PRECIO_DELIVERY = 35_000;

export interface PrecioRow {
  producto:        string;
  precio_impreso:  number;
  precio_digital:  number;
}

export type PreciosMap = Record<string, PrecioRow>;

/** Indexes precios rows by producto for O(1) lookup. */
export function indexPrecios(rows: PrecioRow[] | null | undefined): PreciosMap {
  const m: PreciosMap = {};
  for (const r of rows ?? []) m[r.producto] = r;
  return m;
}

/** True for pedido states where the customer has already paid. */
export function esCobrado(p: Pedido): boolean {
  return p.estado === "pagado"
      || p.estado === "en_produccion"
      || p.estado === "enviado"
      || p.estado === "entregado";
}

/** Heuristic: pedidos store modalidad inside `direccion` ("Pickup — …" / "Delivery — …"). */
export function esDelivery(p: Pedido): boolean {
  return p.tipo_entrega === "fisico"
      && !!p.direccion
      && p.direccion.toLowerCase().startsWith("delivery");
}

/** Total a pedido is worth in Gs (base price + delivery fee if applicable). */
export function montoPedido(p: Pedido, precios: PreciosMap): number {
  const row = precios[p.producto];
  if (!row) return 0;
  const base = p.tipo_entrega === "digital" ? row.precio_digital : row.precio_impreso;
  return base + (esDelivery(p) ? PRECIO_DELIVERY : 0);
}
