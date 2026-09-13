// Per-pedido revenue computation.
//
// Prices live in the `precios` table (loaded once per dashboard render)
// and the delivery fee is a constant. The pedido doesn't snapshot prices
// at order time, so if prices ever change, historical revenue will
// recompute against the current rates — acceptable for the MVP.

import type { Pedido } from "@/types/pedido";

export const PRECIO_DELIVERY = 35_000;

export interface PrecioRow {
  producto?:             string;
  precio_impreso:        number;
  precio_digital:        number;
  // Exterior — fijados a mano por el admin en USD, sin conversión desde Gs.
  // null = todavía no configurado → el producto no se ofrece en el exterior.
  precio_digital_usd?:    number | null;
  precio_digital_20_usd?: number | null;
}

export type PreciosMap = Record<string, PrecioRow>;

/** Formatea en dólares — "USD 12" (nunca "$", nunca decimales de más). */
export function fmtUsd(n: number): string {
  return "USD " + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Precio USD del digital para un producto (10 pasos, o 20 si se pide). null = no configurado aún. */
export function precioUsd(row: PrecioRow | undefined, cantidad20 = false): number | null {
  if (!row) return null;
  const v = cantidad20 ? row.precio_digital_20_usd : row.precio_digital_usd;
  return typeof v === "number" && v > 0 ? v : null;
}

/** Indexes precios rows by producto for O(1) lookup. */
export function indexPrecios(rows: PrecioRow[] | null | undefined): PreciosMap {
  const m: PreciosMap = {};
  for (const r of rows ?? []) { if (r.producto) m[r.producto] = r; }
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
