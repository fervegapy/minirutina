"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { waMeUrl } from "@/lib/contacto";
import type { EventoRow } from "@/app/admin/(dashboard)/intenciones/page";

// Funnel stages in display order. Each maps to one or more raw event ids;
// "step_completed" isn't a stage itself — we just track it so we can later
// break down which intra-customizer step loses people.
const STAGES: { id: string; label: string; eventos: string[] }[] = [
  { id: "started",  label: "Entró al customizer",  eventos: ["customizer_started"] },
  { id: "preview",  label: "Generó vista previa",  eventos: ["preview_generated"] },
  { id: "checkout", label: "Llegó al checkout",    eventos: ["checkout_started"] },
  { id: "filled",   label: "Llenó contacto",       eventos: ["checkout_filled"] },
  { id: "pedido",   label: "Creó el pedido",       eventos: ["pedido_created"] },
];

const RANGE_LABEL: Record<string, string> = {
  "7d":  "Últimos 7 días",
  "30d": "Últimos 30 días",
  all:   "Todo el período",
};

const formatoFecha = (iso: string) =>
  new Date(iso).toLocaleString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function IntencionesView({
  eventos,
  range,
}: {
  eventos: EventoRow[];
  range: "7d" | "30d" | "all";
}) {
  const router = useRouter();

  // ── Aggregations ───────────────────────────────────────────────────────────
  const { stageCounts, abandoned, totalSessions } = useMemo(() => {
    // For each session, which events did it fire? (Set of evento names.)
    const sessionEvents = new Map<string, Set<string>>();
    // For each session, the most recent event (for the abandoned table).
    const sessionLast   = new Map<string, EventoRow>();
    // For each session, the latest checkout_filled (carries contact info).
    const sessionFilled = new Map<string, EventoRow>();

    for (const e of eventos) {
      let set = sessionEvents.get(e.session_id);
      if (!set) {
        set = new Set();
        sessionEvents.set(e.session_id, set);
      }
      set.add(e.evento);

      // events come ordered desc → first time we see a session is its latest
      if (!sessionLast.has(e.session_id)) sessionLast.set(e.session_id, e);

      if (e.evento === "checkout_filled" && !sessionFilled.has(e.session_id)) {
        sessionFilled.set(e.session_id, e);
      }
    }

    const stageCounts = STAGES.map((s) => {
      let n = 0;
      for (const events of Array.from(sessionEvents.values())) {
        if (s.eventos.some((id) => events.has(id))) n++;
      }
      return { ...s, count: n };
    });

    // Abandoned = reached checkout_filled but never pedido_created
    const abandoned: {
      sessionId: string;
      last:      EventoRow;
      filled:    EventoRow;
    }[] = [];
    for (const [sid, events] of sessionEvents) {
      if (events.has("checkout_filled") && !events.has("pedido_created")) {
        const last = sessionLast.get(sid)!;
        const filled = sessionFilled.get(sid)!;
        abandoned.push({ sessionId: sid, last, filled });
      }
    }
    // Most recent abandoned first
    abandoned.sort((a, b) =>
      a.last.created_at < b.last.created_at ? 1 : -1
    );

    return { stageCounts, abandoned, totalSessions: sessionEvents.size };
  }, [eventos]);

  const cambiarRange = (r: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("range", r);
    router.push(url.pathname + url.search);
  };

  const pct = (n: number, total: number) =>
    total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`;

  const top = stageCounts[0]?.count ?? 0;

  return (
    <div className="space-y-5">
      {/* Range filter */}
      <Card className="bg-white">
        <CardContent className="px-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium mr-2">
            Período
          </span>
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => cambiarRange(r)}
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
            {totalSessions} sesión{totalSessions !== 1 ? "es" : ""} únicas
          </span>
        </CardContent>
      </Card>

      {/* Funnel */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Funnel de conversión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stageCounts.map((stage, i) => {
            const prev = i === 0 ? null : stageCounts[i - 1];
            const widthPct = top === 0 ? 0 : (stage.count / top) * 100;
            return (
              <div key={stage.id}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-900">
                    {stage.label}
                  </span>
                  <span className="text-sm text-zinc-700">
                    <span className="font-semibold">{stage.count}</span>
                    {prev && prev.count > 0 && (
                      <span className="text-zinc-400 ml-2">
                        ({pct(stage.count, prev.count)} desde anterior)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {top > 0 && (
            <p className="text-xs text-zinc-500 pt-1">
              Conversión global: {pct(stageCounts[stageCounts.length - 1].count, top)} de
              los visitantes que entraron al customizer completaron el pedido.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Abandoned sessions */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">
            Sesiones abandonadas con contacto
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Llenaron email o WhatsApp pero no completaron el pedido. Acá podés
            contactarlos directo.
          </p>
        </CardHeader>
        <CardContent>
          {abandoned.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">
              No hay sesiones abandonadas con contacto en este período.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200">
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">Último evento</th>
                  <th className="px-3 py-2 font-medium">Producto</th>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Contacto</th>
                  <th className="px-3 py-2 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {abandoned.map(({ sessionId, last, filled }) => {
                  const data = (filled.data ?? {}) as {
                    email?: string | null;
                    whatsapp?: string | null;
                    nombre_nino?: string | null;
                  };
                  const wa = waMeUrl(
                    data.whatsapp ?? null,
                    "Hola, vi que empezaste a personalizar tu tablero en Minirutina pero no completaste el pedido. ¿Te puedo ayudar con algo? 💛",
                  );
                  return (
                    <tr
                      key={sessionId}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-3 py-2 text-zinc-700 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">
                          {labelEvento(last.evento)}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {formatoFecha(last.created_at)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-zinc-700 capitalize">
                        {last.producto ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-900 font-medium">
                        {data.nombre_nino ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-700">
                        <div className="space-y-0.5">
                          {data.email && (
                            <a
                              href={`mailto:${data.email}`}
                              className="flex items-center gap-1.5 text-xs hover:underline"
                            >
                              <Mail className="w-3 h-3 text-zinc-400" />
                              {data.email}
                            </a>
                          )}
                          {data.whatsapp && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="w-3 h-3 text-zinc-400" />
                              {data.whatsapp}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Contactar por WhatsApp"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-emerald-600 hover:bg-emerald-50"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-zinc-300 inline" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function labelEvento(evento: string): string {
  switch (evento) {
    case "customizer_started": return "Entró al customizer";
    case "step_completed":     return "Avanzó un paso";
    case "preview_generated":  return "Generó vista previa";
    case "checkout_started":   return "Llegó al checkout";
    case "checkout_filled":    return "Llenó contacto";
    case "pedido_created":     return "Creó el pedido";
    default:                   return evento;
  }
}
