"use client";

// Precio del detalle de producto en la moneda del visitante.
//
// La página es estática (una por variante), así que el servidor no sabe en
// qué moneda mirar: manda todas las columnas de `precios` y acá se elige con
// la cookie que pone el middleware. Hasta montar no se muestra nada, para no
// pintar Gs. a un visitante de Brasil y cambiarlo un instante después.
import { useEffect, useState } from "react";
import {
  formatPrecio,
  getMonedaClient,
  precioEn,
  vendeImpreso,
  type Moneda,
  type PreciosProducto,
  type Tasas,
} from "@/lib/mercado";

export function usePrecio(precios: PreciosProducto | null, tasas: Tasas = {}) {
  const [moneda, setMoneda] = useState<Moneda | null>(null);
  useEffect(() => setMoneda(getMonedaClient()), []);
  if (!moneda) return { moneda: null, valor: null, texto: null };
  // Paraguay ve el impreso (el producto estrella); afuera, el digital.
  const valor = precioEn(precios, moneda, vendeImpreso(moneda) ? "fisico" : "digital", false, tasas);
  return { moneda, valor, texto: valor !== null ? formatPrecio(valor, moneda) : null };
}

export default function PrecioProducto({
  precios,
  tasas,
  className,
  // Lo que se muestra si el admin todavía no cargó precio en esa moneda.
  sinPrecio = "",
}: {
  precios: PreciosProducto | null;
  // Tipo de cambio del día para calcular ARS/BRL desde el USD.
  tasas?: Tasas;
  className?: string;
  sinPrecio?: string;
}) {
  const { moneda, texto } = usePrecio(precios, tasas);
  return (
    <span className={className} aria-busy={!moneda}>
      {moneda ? texto ?? sinPrecio : " "}
    </span>
  );
}
