"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import LocationPicker, { LocationValue } from "@/components/checkout/LocationPicker";

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

  const [tipoEntrega, setTipoEntrega] = useState<"fisico" | "digital">("fisico");
  const [modalidad, setModalidad] = useState<"pickup" | "delivery">("pickup");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState<LocationValue>({ departamento: "", ciudad: "", barrio: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() && !whatsapp.trim()) {
      setError("Ingresá al menos tu email o WhatsApp.");
      return;
    }
    if (tipoEntrega === "fisico" && modalidad === "delivery") {
      if (!location.departamento || !location.ciudad) {
        setError("Seleccioná el departamento y la ciudad.");
        return;
      }
    }

    setLoading(true);
    setError("");

    const contacto = [
      email.trim() && `Email: ${email.trim()}`,
      whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
    ]
      .filter(Boolean)
      .join(" | ");

    let direccion: string | null = null;
    if (tipoEntrega === "fisico") {
      if (modalidad === "pickup") {
        direccion = "Pickup — Villamorra, Asunción";
      } else {
        const { departamento, ciudad, barrio } = location;
        direccion = `Delivery — ${departamento}, ${ciudad}${barrio ? `, ${barrio}` : ""}`;
      }
    }

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
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 mb-5">
          <h2 className="font-bold text-xs uppercase tracking-wide text-[#233933]/50 mb-3">
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
          {/* Tipo de entrega */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
            <h2 className="font-bold text-xs uppercase tracking-wide text-[#233933]/50 mb-4">
              Tipo de entrega
            </h2>

            {tipoEntrega === "fisico" ? (
              <>
                <div className="rounded-xl border-2 border-[#233933] bg-[#ecbc5d]/10 p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">📦</span>
                  <div>
                    <p className="font-bold text-sm text-[#233933]">
                      Impreso y enviado
                    </p>
                    <p className="text-xs text-[#233933]/60 mt-0.5">
                      Imprimimos en alta calidad y lo entregamos listo para colgar.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTipoEntrega("digital")}
                  className="mt-3 text-xs text-[#233933]/40 hover:text-[#233933] underline underline-offset-2 w-full text-center transition-colors"
                >
                  ¿Preferís solo el archivo digital para imprimir vos?
                </button>
              </>
            ) : (
              <>
                <div className="rounded-xl border-2 border-[#a8c8e8] bg-[#a8c8e8]/10 p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">📲</span>
                  <div>
                    <p className="font-bold text-sm text-[#233933]">
                      Archivo digital
                    </p>
                    <p className="text-xs text-[#233933]/60 mt-0.5">
                      Recibís el PDF listo para imprimir donde quieras.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTipoEntrega("fisico");
                    setModalidad("pickup");
                  }}
                  className="mt-3 text-xs text-[#233933]/40 hover:text-[#233933] underline underline-offset-2 w-full text-center transition-colors"
                >
                  ← Volver a impreso y enviado
                </button>
              </>
            )}
          </div>

          {/* Modalidad de entrega (solo físico) */}
          {tipoEntrega === "fisico" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
              <h2 className="font-bold text-xs uppercase tracking-wide text-[#233933]/50 mb-4">
                Modalidad de entrega
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalidad("pickup")}
                  className={`rounded-xl p-4 border-2 text-left transition-all ${
                    modalidad === "pickup"
                      ? "border-[#233933] bg-[#ecbc5d]/10"
                      : "border-[#e5e7eb] hover:border-[#233933]/30"
                  }`}
                >
                  <div className="text-xl mb-1">🏠</div>
                  <div className="font-bold text-sm text-[#233933]">Pickup</div>
                  <div className="text-xs font-semibold text-[#a8c5a0] mt-0.5">
                    Sin costo
                  </div>
                  <div className="text-xs text-[#233933]/50 mt-1 leading-relaxed">
                    Retirás en Villamorra, Asunción. Dirección exacta por WhatsApp.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setModalidad("delivery")}
                  className={`rounded-xl p-4 border-2 text-left transition-all ${
                    modalidad === "delivery"
                      ? "border-[#233933] bg-[#ecbc5d]/10"
                      : "border-[#e5e7eb] hover:border-[#233933]/30"
                  }`}
                >
                  <div className="text-xl mb-1">🛵</div>
                  <div className="font-bold text-sm text-[#233933]">Delivery</div>
                  <div className="text-xs text-[#233933]/50 mt-0.5">A tu puerta</div>
                  <div className="text-xs text-[#233933]/50 mt-1 leading-relaxed">
                    Costo según zona, a confirmar por WhatsApp.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Datos de entrega (solo delivery) */}
          {tipoEntrega === "fisico" && modalidad === "delivery" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
              <h2 className="font-bold text-xs uppercase tracking-wide text-[#233933]/50">
                Datos de entrega
              </h2>
              <LocationPicker onChange={setLocation} />
            </div>
          )}

          {/* Datos de contacto */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
            <h2 className="font-bold text-xs uppercase tracking-wide text-[#233933]/50">
              Datos de contacto
            </h2>
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="WhatsApp (ej: +595 981 123456)"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <p className="text-xs text-[#233933]/50">
              Te contactamos para confirmar y coordinar tu pedido.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ecbc5d] hover:bg-[#e5b04e] text-[#233933] font-bold rounded-xl text-base shadow-none border-0"
          >
            {loading ? "Guardando..." : "Ir a pagar →"}
          </Button>
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
