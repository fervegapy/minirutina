"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";
import type { EstadoPedido } from "@/types/pedido";

// Re-check admin status server-side. The middleware already protects /admin
// but server actions can be called from anywhere — defense in depth.
async function asegurarAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("No autorizado.");
  }
  return supabase;
}

export async function cambiarEstadoPedido(
  pedidoId: string,
  nuevoEstado: EstadoPedido,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await asegurarAdmin();
    const { error } = await supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath("/admin/pedidos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
