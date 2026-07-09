// "Resume payment" page — the CTA target of the recordatorio email. Loads an
// existing pending pedido by id and lets the customer complete its payment
// WITHOUT creating a new order (reuses the same pedidoId via create-session).
import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { productoLabel } from "@/lib/emails/pedido-emails";
import { extraerEmail, extraerNombre } from "@/lib/contacto";
import ResumePayButton from "./ResumePayButton";

export const dynamic = "force-dynamic";

const fmt = (n: number) => "Gs. " + Math.round(n).toLocaleString("es-PY");

// Same summary shown in the checkout cart — activity counts for rutinas,
// step count for recompensas.
function resumenPersonalizacion(producto: string, personalizacion: unknown): string {
  const p = personalizacion as Record<string, unknown> | null;
  if (!p) return "";
  if (producto === "rutinas") {
    const m = Array.isArray((p as { manana?: unknown }).manana) ? (p as { manana: unknown[] }).manana.length : 0;
    const n = Array.isArray((p as { noche?: unknown }).noche)   ? (p as { noche: unknown[] }).noche.length   : 0;
    return `${m} de mañana · ${n} de noche`;
  }
  if (producto === "recompensas") {
    const cantidad = (p as { cantidad?: number }).cantidad ?? 10;
    return `${cantidad} pasos`;
  }
  return "";
}

export default async function PagarPedidoPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("id, estado, contacto, costo_envio, cupon_codigo, cupon_descuento, producto, nombre_nino, tipo_entrega")
    .eq("id", id)
    .maybeSingle();

  const { data: itemRows } = await supabaseAdmin
    .from("pedido_items")
    .select("producto, nombre_nino, tipo_entrega, precio_pyg, orden, color_acento, personalizacion")
    .eq("pedido_id", id)
    .order("orden", { ascending: true });

  const items = itemRows ?? [];

  // ─── Guard states ─────────────────────────────────────────────────────────
  if (!pedido) return <Shell><Estado titulo="No encontramos este pedido" texto="El enlace puede estar incompleto o vencido. Escribinos y te ayudamos." /></Shell>;

  if (pedido.estado !== "pendiente") {
    const yaPago = ["pagado", "en_produccion", "enviado", "entregado"].includes(pedido.estado);
    return (
      <Shell>
        <Estado
          titulo={yaPago ? "Este pedido ya está pagado ✅" : "Este pedido ya fue procesado"}
          texto={yaPago ? "¡Gracias! No hace falta que vuelvas a pagar." : "Si tenés dudas, escribinos y lo revisamos."}
        />
      </Shell>
    );
  }

  if (items.length === 0) {
    return <Shell><Estado titulo="No pudimos cargar el pedido" texto="Escribinos por WhatsApp y completamos el pago juntos." /></Shell>;
  }

  // ─── Amounts ──────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, it) => s + (Number(it.precio_pyg) || 0), 0);
  const envio    = Number(pedido.costo_envio) || 0;
  const descuento = Number(pedido.cupon_descuento) || 0;
  const total    = Math.max(0, subtotal - descuento) + envio;

  const first = items[0];
  const esFisico = first.tipo_entrega !== "digital";
  const modalidad = esFisico ? (envio > 0 ? "delivery" : "pickup") : null;

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-[#22244e] mb-1 text-center">Completá tu pedido</h1>
      <p className="text-sm text-[#22244e]/60 text-center mb-6">
        Pedido #{pedido.id.slice(0, 8).toUpperCase()}
      </p>

      <div className="bg-[#faf6e7] border border-[#e5e7eb] rounded-2xl p-5 mb-5 space-y-3">
        {items.map((it, i) => (
          <div key={i} className={`flex gap-3 ${i > 0 ? "pt-3 border-t border-[#e5e7eb]" : ""}`}>
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#e5e7eb] relative"
              style={{ backgroundColor: (it.color_acento ?? "#a8c5a0") + "22" }}
            >
              <Image
                src={`/productos/${it.producto}.png`}
                alt={productoLabel(it.producto)}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#22244e] text-sm">{productoLabel(it.producto)}</p>
                <p className="text-xs text-[#22244e]/55">
                  Para {it.nombre_nino} · {resumenPersonalizacion(it.producto, it.personalizacion)}
                  {" · "}{it.tipo_entrega === "digital" ? "Digital" : "Impreso"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-[#22244e] tabular-nums">{fmt(Number(it.precio_pyg) || 0)}</span>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-[#e5e7eb] space-y-1.5">
          <Linea label="Subtotal" value={fmt(subtotal)} />
          {descuento > 0 && <Linea label="Descuento" value={`- ${fmt(descuento)}`} />}
          {esFisico && <Linea label={envio > 0 ? "Envío" : "Retiro"} value={envio > 0 ? fmt(envio) : "Gratis"} />}
          <div className="flex items-center justify-between pt-1.5 border-t border-[#e5e7eb]">
            <span className="font-bold text-[#22244e]">Total</span>
            <span className="font-extrabold text-[#22244e] text-lg">{fmt(total)}</span>
          </div>
        </div>
      </div>

      <ResumePayButton
        pedidoId={pedido.id}
        productoPyg={subtotal}
        envioPyg={envio}
        cuponCodigo={pedido.cupon_codigo ?? null}
        email={extraerEmail(pedido.contacto)}
        nombreComprador={extraerNombre(pedido.contacto)}
        nombreNino={first.nombre_nino}
        producto={first.producto}
        tipoEntrega={first.tipo_entrega === "digital" ? "digital" : "fisico"}
        modalidad={modalidad}
        total={total}
      />

      <p className="text-center text-xs text-[#22244e]/40 mt-4">
        Pago seguro procesado por dLocal.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf6e7] px-4 py-16 flex items-center">
      <div className="max-w-md w-full mx-auto bg-white border border-[#e5e7eb] rounded-3xl p-6 md:p-8">
        {children}
      </div>
    </main>
  );
}

function Linea({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#22244e]/60">{label}</span>
      <span className="text-[#22244e] font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Estado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="text-center py-6">
      <h1 className="text-xl font-bold text-[#22244e] mb-2">{titulo}</h1>
      <p className="text-sm text-[#22244e]/60 mb-6">{texto}</p>
      <Link href="/" className="inline-block bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg h-11 px-6 leading-[44px] transition-colors">
        Volver al inicio
      </Link>
    </div>
  );
}
