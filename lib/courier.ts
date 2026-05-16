// Couriers available for delivery in Paraguay. Add/remove as the operation
// changes. `phone` is the WhatsApp number used for the wa.me link.
export type CourierId = "wallymotos" | "uber_flash" | "bolt" | "otro";

export const COURIERS: { id: CourierId; nombre: string; phone: string | null }[] = [
  { id: "wallymotos", nombre: "WallyMotos",  phone: null },
  { id: "uber_flash", nombre: "Uber Flash",  phone: null },
  { id: "bolt",       nombre: "Bolt",        phone: null },
  { id: "otro",       nombre: "Otro",        phone: null },
];

export function courierPorId(id: CourierId) {
  return COURIERS.find((c) => c.id === id) ?? null;
}
