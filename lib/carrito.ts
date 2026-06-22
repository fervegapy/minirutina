"use client";

// Cart state — single source of truth lives in localStorage so it
// survives navigation, refresh, and abandoned sessions.
//
// Item shape mirrors what we'll insert into pedido_items at checkout.
// The format (físico / digital) defaults to 'fisico' on add — the
// customer can flip per-item from the checkout summary.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { track } from "@/lib/tracking";

const STORAGE_KEY = "mr_carrito_v1";

export type Producto = "rutinas" | "recompensas";
export type Formato  = "fisico" | "digital";

export interface CartItem {
  id:              string;         // client-side uuid, unique per cart row
  producto:        Producto;
  nombre_nino:     string;
  color_acento:    string;
  genero:          "nino" | "nina" | null;
  personalizacion: unknown;        // product-specific shape (same as pedido_items.personalizacion)
  formato:         Formato;
}

function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode — swallow */
  }
}

// Minimal pub/sub so multiple useCarrito() instances on the same page
// (header badge + checkout summary, etc.) stay in sync without
// re-reading localStorage on every render.
type Listener = () => void;
const listeners = new Set<Listener>();
let snapshot: CartItem[] = typeof window !== "undefined" ? read() : [];

function emit() {
  snapshot = read();
  listeners.forEach((l) => l());
}

// Also sync across tabs.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) emit();
  });
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

// Stable empty reference for SSR — returning a fresh [] each call triggers
// React's "getServerSnapshot should be cached" warning / infinite loop.
const EMPTY: CartItem[] = [];
function getSnapshot() { return snapshot; }
function getServerSnapshot() { return EMPTY; }

export function useCarrito() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Hydrate on mount in case storage changed before subscribe ran.
  useEffect(() => { emit(); }, []);

  const addItem = useCallback((item: Omit<CartItem, "id" | "formato"> & { formato?: Formato }): CartItem => {
    const newItem: CartItem = { id: genId(), formato: item.formato ?? "fisico", ...item };
    const next = [...read(), newItem];
    write(next);
    emit();
    track({
      evento:   "add_to_cart",
      producto: newItem.producto,
      data: {
        cart_item_id: newItem.id,
        formato:      newItem.formato,
        cart_count:   next.length,
      },
    });
    return newItem;
  }, []);

  const removeItem = useCallback((id: string) => {
    const removed = read().find((it) => it.id === id);
    const next = read().filter((it) => it.id !== id);
    write(next);
    emit();
    if (removed) {
      track({
        evento:   "remove_from_cart",
        producto: removed.producto,
        data: {
          cart_item_id: removed.id,
          formato:      removed.formato,
          cart_count:   next.length,
        },
      });
    }
  }, []);

  const setFormato = useCallback((id: string, formato: Formato) => {
    const next = read().map((it) => it.id === id ? { ...it, formato } : it);
    write(next);
    emit();
  }, []);

  const clear = useCallback(() => {
    write([]);
    emit();
  }, []);

  return { items, addItem, removeItem, setFormato, clear, count: items.length };
}

// Non-hook access for non-component callers (e.g. inside a server action
// callback chain shouldn't happen, but utility scripts might).
export function readCart(): CartItem[] { return read(); }
export function clearCart(): void { write([]); emit(); }
