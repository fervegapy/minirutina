import { redirect } from "next/navigation";

// /admin → /admin/pedidos
export default function AdminIndex() {
  redirect("/admin/pedidos");
}
