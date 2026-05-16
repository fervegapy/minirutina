"use client";

import { useMemo, useState } from "react";
import { TrendingUp, ShoppingBag, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Pedido } from "@/types/pedido";
import {
  esCobrado,
  esDelivery,
  montoPedido,
  PRECIO_DELIVERY,
  type PreciosMap,
} from "@/lib/precios";

type Range = "7d" | "30d" | "90d" | "all";

const RANGE_LABEL: Record<Range, string> = {
  "7d":  "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  all:   "Todo",
};

const PRODUCTO_LABEL: Record<string, string> = {
  rutinas:     "Rutinas",
  recompensas: "Recompensas",
};

function fmtGs(n: number) {
  return "Gs. " + n.toLocaleString("es-PY");
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function VentasView({
  pedidos,
  precios,
}: {
  pedidos: Pedido[];
  precios: PreciosMap;
}) {
  const [range, setRange] = useState<Range>("30d");

  const view = useMemo(() => {
    // Time window
    const cutoff =
      range === "all"
        ? null
        : new Date(
            Date.now() -
              { "7d": 7, "30d": 30, "90d": 90 }[range] * 24 * 60 * 60 * 1000,
          );
    const inRange = (p: Pedido) =>
      !cutoff || new Date(p.created_at) >= cutoff;

    const enRango  = pedidos.filter(inRange);
    const cobrados = enRango.filter(esCobrado);
    const ingresos = cobrados.reduce((sum, p) => sum + montoPedido(p, precios), 0);
    const pendientes = enRango.filter((p) => p.estado === "pendiente").length;
    const ticket = cobrados.length === 0 ? 0 : ingresos / cobrados.length;

    // Breakdown por producto
    const porProducto: Record<string, { cantidad: number; ingresos: number }> = {};
    for (const p of cobrados) {
      const k = p.producto;
      if (!porProducto[k]) porProducto[k] = { cantidad: 0, ingresos: 0 };
      porProducto[k].cantidad += 1;
      porProducto[k].ingresos += montoPedido(p, precios);
    }

    // Breakdown por tipo de entrega
    const fisicos  = cobrados.filter((p) => p.tipo_entrega === "fisico");
    const digitales = cobrados.filter((p) => p.tipo_entrega === "digital");
    const ingresosFisico  = fisicos.reduce((s, p) => s + montoPedido(p, precios), 0);
    const ingresosDigital = digitales.reduce((s, p) => s + montoPedido(p, precios), 0);

    // Delivery vs pickup (solo físicos)
    const conDelivery = fisicos.filter(esDelivery).length;
    const conPickup   = fisicos.length - conDelivery;

    // Daily series (sólo cuando hay un cutoff)
    let dailySeries: { date: Date; ingresos: number; pedidos: number }[] = [];
    if (cutoff) {
      const days = Math.round((Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000));
      const bucket = new Map<string, { ingresos: number; pedidos: number }>();
      for (let i = 0; i < days; i++) {
        const d = startOfDay(new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000));
        bucket.set(d.toISOString().slice(0, 10), { ingresos: 0, pedidos: 0 });
      }
      for (const p of cobrados) {
        const key = p.created_at.slice(0, 10);
        const entry = bucket.get(key);
        if (entry) {
          entry.ingresos += montoPedido(p, precios);
          entry.pedidos  += 1;
        }
      }
      dailySeries = Array.from(bucket.entries()).map(([k, v]) => ({
        date:     new Date(k),
        ingresos: v.ingresos,
        pedidos:  v.pedidos,
      }));
    }

    return {
      ingresos,
      ticket,
      pendientes,
      countCobrados: cobrados.length,
      countEnRango:  enRango.length,
      porProducto,
      ingresosFisico,
      ingresosDigital,
      conDelivery,
      conPickup,
      dailySeries,
    };
  }, [pedidos, precios, range]);

  const top = useMemo(() => {
    return Math.max(1, ...view.dailySeries.map((d) => d.ingresos));
  }, [view]);

  return (
    <div className="space-y-5">
      {/* Range filter */}
      <Card className="bg-white">
        <CardContent className="px-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium mr-2">
            Período
          </span>
          {(["7d", "30d", "90d", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                range === r
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
          <span className="ml-auto text-xs text-zinc-500">
            {view.countEnRango} pedido{view.countEnRango !== 1 ? "s" : ""} en el período
          </span>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<DollarSign className="w-4 h-4 text-zinc-400" />}
          label="Ingresos"
          value={fmtGs(view.ingresos)}
          hint={`${view.countCobrados} pedido${view.countCobrados !== 1 ? "s" : ""} cobrado${view.countCobrados !== 1 ? "s" : ""}`}
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4 text-zinc-400" />}
          label="Ticket promedio"
          value={fmtGs(Math.round(view.ticket))}
          hint="Sobre pedidos cobrados"
        />
        <Kpi
          icon={<Clock className="w-4 h-4 text-zinc-400" />}
          label="Pendientes"
          value={`${view.pendientes}`}
          hint="Esperan confirmación de pago"
        />
        <Kpi
          icon={<ShoppingBag className="w-4 h-4 text-zinc-400" />}
          label="Pedidos totales"
          value={`${view.countEnRango}`}
          hint="Todos los estados"
        />
      </div>

      {/* Daily series */}
      {view.dailySeries.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Ingresos por día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {view.dailySeries.map((d, i) => {
                const h = d.ingresos === 0 ? 0 : (d.ingresos / top) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                    title={`${d.date.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit" })} · ${fmtGs(d.ingresos)} · ${d.pedidos} pedido${d.pedidos !== 1 ? "s" : ""}`}
                  >
                    <div
                      className="w-full bg-zinc-900 rounded-sm transition-all group-hover:bg-zinc-700"
                      style={{ height: `${h}%`, minHeight: d.ingresos > 0 ? 2 : 0 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
              <span>
                {view.dailySeries[0]?.date.toLocaleDateString("es-PY", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              <span>
                {view.dailySeries[view.dailySeries.length - 1]?.date.toLocaleDateString("es-PY", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(view.porProducto).length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">Sin ventas.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(view.porProducto)
                  .sort(([, a], [, b]) => b.ingresos - a.ingresos)
                  .map(([k, v]) => (
                    <Breakdown
                      key={k}
                      label={PRODUCTO_LABEL[k] ?? k}
                      sub={`${v.cantidad} pedido${v.cantidad !== 1 ? "s" : ""}`}
                      value={fmtGs(v.ingresos)}
                      pct={view.ingresos > 0 ? v.ingresos / view.ingresos : 0}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Por tipo de entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Breakdown
                label="Físico"
                sub={`${view.conPickup} pickup · ${view.conDelivery} delivery`}
                value={fmtGs(view.ingresosFisico)}
                pct={view.ingresos > 0 ? view.ingresosFisico / view.ingresos : 0}
              />
              <Breakdown
                label="Digital"
                sub="Descarga"
                value={fmtGs(view.ingresosDigital)}
                pct={view.ingresos > 0 ? view.ingresosDigital / view.ingresos : 0}
              />
            </div>
            {view.conDelivery > 0 && (
              <p className="text-[11px] text-zinc-500 mt-3 pt-3 border-t border-zinc-100">
                Envíos delivery incluyen {fmtGs(PRECIO_DELIVERY)} de costo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="bg-white">
      <CardContent className="px-4">
        <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wide font-medium">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl font-semibold text-zinc-900 mt-2">{value}</p>
        {hint && <p className="text-[11px] text-zinc-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Breakdown({
  label,
  sub,
  value,
  pct,
}: {
  label: string;
  sub: string;
  value: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <p className="text-sm font-medium text-zinc-900">{label}</p>
          <p className="text-[11px] text-zinc-500">{sub}</p>
        </div>
        <p className="text-sm font-semibold text-zinc-900">{value}</p>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-900 transition-all"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
