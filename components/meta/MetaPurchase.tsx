"use client";

import { useEffect } from "react";
import { metaTrack } from "@/lib/meta-pixel";

const STORAGE_PREFIX = "mr_meta_purchase_";

/**
 * Fires Purchase once per pedido. The pedido id is the eventID (Meta dedupes
 * on it) and a localStorage flag stops reloads of /confirmacion from
 * re-sending it at all.
 */
export default function MetaPurchase({
  pedidoId, value, productos,
}: { pedidoId: string; value: number; productos: string[] }) {
  useEffect(() => {
    const key = STORAGE_PREFIX + pedidoId;
    try {
      if (window.localStorage.getItem(key)) return;
    } catch { /* storage blocked — still send, eventID dedupes */ }

    metaTrack("Purchase", {
      value,
      content_ids:  Array.from(new Set(productos)),
      content_type: "product",
      num_items:    productos.length,
    }, pedidoId);

    try { window.localStorage.setItem(key, "1"); } catch { /* noop */ }
  }, [pedidoId, value, productos]);
  return null;
}
