"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrito } from "@/lib/carrito";

/**
 * Cart icon + count badge for the public Header. Only renders the badge
 * when there are items in the cart so a brand-new visitor doesn't see
 * the "0" pip. Click → goes to /checkout (which IS the cart view).
 */
export default function CartBadge() {
  const { count } = useCarrito();

  if (count === 0) return null;   // hide the whole icon when empty — keep the header clean

  return (
    <Link
      href="/checkout"
      aria-label={`Carrito · ${count} ${count === 1 ? "tablero" : "tableros"}`}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#22244e]/5 transition-colors"
    >
      <ShoppingBag className="w-5 h-5 text-[#22244e]" />
      <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-[#336aea] text-white text-[11px] font-bold flex items-center justify-center leading-none tabular-nums ring-2 ring-[#faf6e7]">
        {count}
      </span>
    </Link>
  );
}
