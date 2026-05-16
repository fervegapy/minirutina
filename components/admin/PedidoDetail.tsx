"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  Truck,
  FileDown,
} from "lucide-react";
import type { Pedido, EstadoPedido } from "@/types/pedido";
import {
  ESTADOS,
  labelDeEstado,
  siguienteEstado,
} from "@/lib/estado-pedido";
import {
  extraerEmail,
  extraerWhatsapp,
  waMeUrl,
} from "@/lib/contacto";
import { plantillaWhatsappCliente } from "@/lib/wa-templates";
import { COURIERS, courierPorId, type CourierId } from "@/lib/courier";
import { cambiarEstadoPedido } from "@/app/admin/(dashboard)/pedidos/[id]/actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// react-pdf needs DOM APIs — client-only.
const PdfPagesPreview = dynamic(
  () => import("@/components/customizer/PdfPagesPreview"),
  { ssr: false },
);

const BADGE_CLS: Record<EstadoPedido, string> = {
  pendiente:     "bg-amber-100 text-amber-800 border border-amber-200",
  pagado:        "bg-sky-100 text-sky-800 border border-sky-200",
  en_produccion: "bg-violet-100 text-violet-800 border border-violet-200",
  enviado:       "bg-indigo-100 text-indigo-800 border border-indigo-200",
  entregado:     "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

const PRODUCTO_LABEL: Record<string, string> = {
  rutinas: "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
};

const formatoFecha = (iso: string) =>
  new Date(iso).toLocaleString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PedidoDetail({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [imprentaUrl, setImprentaUrl] = useState<string | null>(null);
  const [imprentaLoading, setImprentaLoading] = useState(false);

  const email      = useMemo(() => extraerEmail(pedido.contacto), [pedido.contacto]);
  const whatsapp   = useMemo(() => extraerWhatsapp(pedido.contacto), [pedido.contacto]);
  const proximo    = useMemo(() => siguienteEstado(pedido.estado), [pedido.estado]);
  const mensajeWa  = useMemo(
    () => plantillaWhatsappCliente(pedido, pedido.estado),
    [pedido],
  );
  const waLink     = useMemo(() => waMeUrl(whatsapp, mensajeWa), [whatsapp, mensajeWa]);

  // Mensaje para la imprenta (Raff)
  const mensajeImprenta = useMemo(() => {
    return (
`Hola Raff, te paso el archivo para imprimir:

Pedido: ${pedido.id.slice(0, 8)}
Niño/a: ${pedido.nombre_nino}
Producto: ${PRODUCTO_LABEL[pedido.producto] ?? pedido.producto}
Cantidad: 1

El PDF tiene todas las hojas: tableros + fichas para recortar.
¡Gracias!`
    );
  }, [pedido]);

  // Estado del selector de courier
  const [courierId, setCourierId] = useState<CourierId>("wallymotos");
  const mensajeCourier = useMemo(() => {
    return (
`Hola, necesito un envío:

Recoger en: Villamorra (Asunción)
Entregar a: ${pedido.nombre_nino}
Dirección: ${pedido.direccion ?? "—"}
Contacto destinatario: ${whatsapp ?? "—"}

Pedido ID: ${pedido.id.slice(0, 8)}
¡Gracias!`
    );
  }, [pedido, whatsapp]);
  const courierWaLink = useMemo(() => {
    const c = courierPorId(courierId);
    return waMeUrl(c?.phone ?? null, mensajeCourier);
  }, [courierId, mensajeCourier]);

  const cargarPdfCliente = async () => {
    if (pdfUrl || pdfLoading) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedido.id }),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/pdf")) {
        const blob = await res.blob();
        setPdfUrl(URL.createObjectURL(blob));
      } else {
        const json = await res.json();
        setPdfUrl(json.url);
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const cargarPdfImprenta = async (): Promise<string | null> => {
    if (imprentaUrl) return imprentaUrl;
    setImprentaLoading(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedido.id, mode: "imprenta" }),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF de imprenta");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImprentaUrl(url);
      return url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error generando PDF de imprenta");
      return null;
    } finally {
      setImprentaLoading(false);
    }
  };

  const descargarImprenta = async () => {
    const url = await cargarPdfImprenta();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `imprenta-${pedido.nombre_nino}-${pedido.id.slice(0, 8)}.pdf`;
    a.click();
  };

  const avanzarEstado = () => {
    if (!proximo) return;
    startTransition(async () => {
      const r = await cambiarEstadoPedido(pedido.id, proximo);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error al cambiar estado");
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {pedido.nombre_nino ?? "Sin nombre"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-400">
              {pedido.id.slice(0, 8)}…
            </span>
            <span>·</span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatoFecha(pedido.created_at)}</span>
          </p>
        </div>
        <Badge className={`${BADGE_CLS[pedido.estado]} text-xs h-6 px-2.5`}>
          {labelDeEstado(pedido.estado)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda: data del pedido */}
        <div className="lg:col-span-2 space-y-5">
          {/* Resumen */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={<Package className="w-4 h-4 text-zinc-400" />}
                   label="Producto"
                   value={PRODUCTO_LABEL[pedido.producto] ?? pedido.producto} />
              <Row icon={<Truck className="w-4 h-4 text-zinc-400" />}
                   label="Tipo de entrega"
                   value={pedido.tipo_entrega === "fisico" ? "Físico" : "Digital"} />
              {pedido.direccion && (
                <Row icon={<MapPin className="w-4 h-4 text-zinc-400" />}
                     label="Dirección"
                     value={pedido.direccion} />
              )}
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {email && (
                <Row icon={<Mail className="w-4 h-4 text-zinc-400" />}
                     label="Email"
                     value={<a href={`mailto:${email}`} className="text-zinc-900 hover:underline">{email}</a>} />
              )}
              {whatsapp && (
                <Row icon={<Phone className="w-4 h-4 text-zinc-400" />}
                     label="WhatsApp"
                     value={whatsapp} />
              )}
              {!email && !whatsapp && (
                <p className="text-zinc-500 text-sm">
                  {pedido.contacto || "Sin datos de contacto."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Personalización */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">Personalización</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-zinc-50 border border-zinc-200 rounded-md p-3 overflow-auto text-zinc-700">
                {JSON.stringify(pedido.personalizacion, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Preview PDF cliente */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">PDF para el cliente</CardTitle>
                {!pdfUrl && !pdfLoading && (
                  <Button
                    variant="outline"
                    onClick={cargarPdfCliente}
                    className="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  >
                    <FileDown className="w-3.5 h-3.5 mr-1.5" />
                    Generar preview
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pdfLoading ? (
                <SpinnerSmall label="Generando PDF..." />
              ) : pdfUrl ? (
                <PdfPagesPreview url={pdfUrl} />
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Click en &quot;Generar preview&quot; para ver el archivo del cliente.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview PDF imprenta */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">PDF para imprenta</CardTitle>
                {!imprentaUrl && !imprentaLoading && (
                  <Button
                    variant="outline"
                    onClick={cargarPdfImprenta}
                    className="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  >
                    <FileDown className="w-3.5 h-3.5 mr-1.5" />
                    Generar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {imprentaLoading ? (
                <SpinnerSmall label="Generando PDF de imprenta..." />
              ) : imprentaUrl ? (
                <>
                  <PdfPagesPreview url={imprentaUrl} />
                  <p className="text-[11px] text-zinc-500 mt-2">
                    Incluye tableros + hojas de fichas para recortar.
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Es el archivo que va a Raff Imprenta: tableros + fichas.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: acciones */}
        <div className="space-y-5">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS.map((e) => (
                  <Badge
                    key={e.id}
                    className={`text-[10px] ${
                      e.id === pedido.estado
                        ? BADGE_CLS[e.id]
                        : "bg-zinc-50 text-zinc-400 border border-zinc-200"
                    }`}
                  >
                    {e.label}
                  </Badge>
                ))}
              </div>
              {proximo ? (
                <Button
                  onClick={avanzarEstado}
                  disabled={pending}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-9 rounded-md"
                >
                  {pending ? "Guardando..." : (
                    <>
                      Avanzar a &quot;{labelDeEstado(proximo)}&quot;
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-xs text-zinc-500 text-center">
                  Estado final.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {/* Notificar cliente */}
              {waLink ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <ActionButton icon={<MessageCircle className="w-4 h-4 text-emerald-600" />}>
                    Notificar cliente
                  </ActionButton>
                </a>
              ) : (
                <ActionButton disabled icon={<MessageCircle className="w-4 h-4" />}>
                  Sin WhatsApp registrado
                </ActionButton>
              )}

              {/* Enviar a imprenta (descarga PDF) */}
              <ActionButton
                onClick={descargarImprenta}
                disabled={imprentaLoading}
                icon={<FileDown className="w-4 h-4 text-zinc-700" />}
              >
                {imprentaLoading ? "Generando..." : "Descargar para imprenta"}
              </ActionButton>

              {/* Solicitar courier */}
              <div className="pt-2 border-t border-zinc-100 mt-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-medium mb-1.5">
                  Courier
                </p>
                <select
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value as CourierId)}
                  className="w-full text-sm h-9 px-3 rounded-md border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 mb-2"
                >
                  {COURIERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {courierWaLink ? (
                  <a href={courierWaLink} target="_blank" rel="noopener noreferrer">
                    <ActionButton icon={<Truck className="w-4 h-4 text-zinc-700" />}>
                      Solicitar a {courierPorId(courierId)?.nombre}
                    </ActionButton>
                  </a>
                ) : (
                  <ActionButton disabled icon={<Truck className="w-4 h-4" />}>
                    Falta cargar el WhatsApp del courier
                  </ActionButton>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plantillas */}
          {waLink && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base">Mensaje al cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md p-3 leading-relaxed">
                  {mensajeWa}
                </pre>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Se ajusta automáticamente al estado actual. Editás antes de mandar.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">Mensaje a imprenta</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md p-3 leading-relaxed">
                {mensajeImprenta}
              </pre>
              <p className="text-[11px] text-zinc-500 mt-2">
                Copiá y pegá junto al PDF descargado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-medium">
          {label}
        </p>
        <p className="text-zinc-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-sm h-9 justify-start font-medium border-zinc-200 ${
        disabled ? "text-zinc-400" : "text-zinc-900 hover:bg-zinc-50"
      }`}
    >
      <span className="mr-2">{icon}</span>
      {children}
    </Button>
  );
}

function SpinnerSmall({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-6 h-6 border-[3px] border-zinc-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
