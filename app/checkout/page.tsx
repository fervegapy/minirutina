"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas: "Tablero de Rutinas",
  semana: "Plan de la Semana",
  recompensas: "Tablero de Recompensas",
};

const NOMBRE_COLOR: Record<string, string> = {
  "#a8c5a0": "Verde salvia",
  "#e8b4b8": "Rosa polvoso",
  "#a8c8e8": "Azul cielo",
  "#f5d78e": "Amarillo cálido",
};

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();

  const producto = params.get("producto") ?? "";
  const nombreNino = params.get("nombre_nino") ?? "";
  const colorAcento = params.get("color_acento") ?? "";
  const personalizacionRaw = params.get("personalizacion") ?? "{}";

  const [tipoEntrega, setTipoEntrega] = useState<"digital" | "fisico">("digital");
  const [contacto, setContacto] = useState("");
  const [calle, setCalle] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contacto.trim()) {
      setError("Ingresá tu contacto (WhatsApp o email).");
      return;
    }
    if (tipoEntrega === "fisico" && (!calle.trim() || !ciudad.trim())) {
      setError("Completá los datos de envío.");
      return;
    }
    setLoading(true);
    setError("");

    const direccion =
      tipoEntrega === "fisico"
        ? `${calle}, ${ciudad}${telefono ? ` — Tel: ${telefono}` : ""}`
        : null;

    let personalizacion: unknown;
    try {
      personalizacion = JSON.parse(personalizacionRaw);
    } catch {
      personalizacion = {};
    }

    const { data, error: dbError } = await supabase
      .from("pedidos")
      .insert({
        producto,
        nombre_nino: nombreNino,
        color_acento: colorAcento,
        personalizacion,
        tipo_entrega: tipoEntrega,
        contacto,
        direccion,
        estado: "pendiente",
      })
      .select("id")
      .single();

    setLoading(false);
    if (dbError) {
      setError("Hubo un error al guardar tu pedido. Intentá de nuevo.");
      return;
    }

    const confirmParams = new URLSearchParams({
      nombre_nino: nombreNino,
      tipo_entrega: tipoEntrega,
      pedido_id: data.id,
    });
    router.push(`/confirmacion?${confirmParams.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#fffef6] px-4 py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-[#233933] mb-8 text-center">
          Resumen del pedido
        </h1>

        {/* Order summary */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#233933]/50 mb-3">
            Tu pedido
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#233933]/70">Producto</span>
              <span className="font-semibold text-[#233933]">
                {NOMBRE_PRODUCTO[producto] ?? producto}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#233933]/70">Nombre</span>
              <span className="font-semibold text-[#233933]">{nombreNino}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#233933]/70">Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-[#e5e7eb]"
                  style={{ backgroundColor: colorAcento }}
                />
                <span className="font-semibold text-[#233933]">
                  {NOMBRE_COLOR[colorAcento] ?? colorAcento}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Delivery type */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
            <h2 className="font-bold text-sm uppercase tracking-wide text-[#233933]/50 mb-3">
              Tipo de entrega
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(["digital", "fisico"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoEntrega(tipo)}
                  className={`rounded-xl p-4 border-2 text-left transition-all ${
                    tipoEntrega === tipo
                      ? "border-[#233933] bg-[#ecbc5d]/10"
                      : "border-[#e5e7eb] hover:border-[#233933]/30"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {tipo === "digital" ? "📲" : "📦"}
                  </div>
                  <div className="font-bold text-sm text-[#233933]">
                    {tipo === "digital" ? "Digital" : "Físico"}
                  </div>
                  <div className="text-xs text-[#233933]/60 mt-0.5">
                    {tipo === "digital"
                      ? "Descarga inmediata"
                      : "Impreso y enviado"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shipping address (only for physical) */}
          {tipoEntrega === "fisico" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
              <h2 className="font-bold text-sm uppercase tracking-wide text-[#233933]/50">
                Dirección de envío
              </h2>
              <Input
                placeholder="Calle y número"
                value={calle}
                onChange={(e) => setCalle(e.target.value)}
              />
              <Input
                placeholder="Ciudad / Localidad"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
              />
              <Input
                placeholder="Teléfono de contacto"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                type="tel"
              />
            </div>
          )}

          {/* Contact */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
            <h2 className="font-bold text-sm uppercase tracking-wide text-[#233933]/50 mb-3">
              Contacto
            </h2>
            <Input
              placeholder="WhatsApp o email"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
            />
            <p className="text-xs text-[#233933]/50 mt-2">
              Te contactaremos para confirmar tu pedido.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <a href="#">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-xl py-3 text-base shadow-none border-0"
            >
              {loading ? "Guardando..." : "Ir a pagar →"}
            </Button>
          </a>
        </form>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
