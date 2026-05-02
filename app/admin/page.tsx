"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Pedido } from "@/types/pedido";
import PedidosTable from "@/components/admin/PedidosTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });
    setPedidos((data as Pedido[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchPedidos();
  }, [authed, fetchPedidos]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";
    if (password === adminPassword) {
      setAuthed(true);
    } else {
      setError("Contraseña incorrecta.");
    }
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#fffef6] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#233933]">Admin</h1>
            <p className="text-sm text-[#233933]/50 mt-1">Minirutina backoffice</p>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-white border border-[#e5e7eb] rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="text-sm font-semibold text-[#233933] mb-1 block">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-xl shadow-none border-0"
            >
              Ingresar
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffef6] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#233933]">Pedidos</h1>
            <p className="text-sm text-[#233933]/50 mt-0.5">
              {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchPedidos}
            disabled={loading}
            className="border-[#233933] text-[#233933] rounded-lg text-sm"
          >
            {loading ? "Cargando..." : "↻ Actualizar"}
          </Button>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-[#233933]/40">
              Cargando pedidos...
            </div>
          ) : (
            <PedidosTable initialPedidos={pedidos} />
          )}
        </div>
      </div>
    </main>
  );
}
