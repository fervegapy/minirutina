"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, TrendingUp } from "lucide-react";
import { crearTasa } from "@/app/admin/(dashboard)/tipo-cambio/actions";
import type { TipoCambio } from "@/lib/tipo-cambio";

interface Props {
  tasaActual: number;
  actual:     TipoCambio | null;
  historial:  TipoCambio[];
}

function fmtPyg(n: number) {
  return "Gs. " + Math.round(n).toLocaleString("es-PY");
}
function fmtUsd(n: number) {
  return "USD " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PY", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export default function TipoCambioView({ tasaActual, actual, historial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [tasa,         setTasa]      = useState<string>("");
  const [vigenteDesde, setVigente]   = useState<string>("");   // datetime-local, empty = now
  const [notas,        setNotas]     = useState<string>("");
  const [msg,          setMsg]       = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const tasaNum = Number(tasa.replace(",", "."));
  const valido  = Number.isFinite(tasaNum) && tasaNum > 0;

  const guardar = () => {
    if (!valido) return;
    setMsg(null);
    startTransition(async () => {
      const r = await crearTasa(
        tasaNum,
        vigenteDesde ? new Date(vigenteDesde).toISOString() : null,
        notas,
      );
      if (r.ok) {
        setMsg({ kind: "ok", text: "Tasa guardada." });
        setTasa(""); setNotas(""); setVigente("");
        router.refresh();
      } else {
        setMsg({ kind: "err", text: r.error ?? "Error" });
      }
    });
  };

  // Ejemplo: cuánto sale un tablero de Gs. 149.000 con la tasa que están por guardar.
  const previewPyg = 149000;
  const previewUsd = valido ? previewPyg / tasaNum : null;

  return (
    <div className="space-y-6">
      {/* Tasa actual */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            Tasa vigente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="text-3xl font-semibold text-zinc-900">
              {tasaActual.toLocaleString("es-PY")}
            </div>
            <div className="text-sm text-zinc-500">
              Gs. por 1 {actual?.moneda_destino ?? "USD"}
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Un tablero de {fmtPyg(149000)} se cobra como{" "}
            <strong className="text-zinc-900">
              {fmtUsd(149000 / tasaActual)}
            </strong>
            .
          </p>
          {actual && (
            <p className="text-[11px] text-zinc-400 mt-2">
              Vigente desde {fmtFecha(actual.vigente_desde)}
              {actual.creado_por && <> · por {actual.creado_por}</>}
              {actual.notas && <> · {actual.notas}</>}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nueva tasa */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Registrar nueva tasa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
                Nueva tasa (1 USD = N Gs.)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="7300"
                value={tasa}
                onChange={(e) => setTasa(e.target.value)}
                className="text-base"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
                Vigente desde (opcional, default = ahora)
              </label>
              <Input
                type="datetime-local"
                value={vigenteDesde}
                onChange={(e) => setVigente(e.target.value)}
                className="text-base"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
              Notas (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej: ajuste mensual, BCP del día, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="text-base"
            />
          </div>

          {previewUsd !== null && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-xs text-zinc-600">
              Preview: {fmtPyg(previewPyg)} ={" "}
              <strong className="text-zinc-900">{fmtUsd(previewUsd)}</strong>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={guardar}
              disabled={!valido || pending}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-9 rounded-md"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {pending ? "Guardando..." : "Guardar tasa"}
            </Button>
            {msg && (
              <span
                className={`text-xs ${
                  msg.kind === "ok" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {msg.text}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">Sin registros todavía.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500 border-b border-zinc-200">
                    <th className="py-2 pr-3 font-medium">Vigente desde</th>
                    <th className="py-2 pr-3 font-medium">Tasa</th>
                    <th className="py-2 pr-3 font-medium">Cobro de Gs. 149.000</th>
                    <th className="py-2 pr-3 font-medium">Por</th>
                    <th className="py-2 pr-3 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-zinc-100 ${i === 0 ? "bg-zinc-50/60" : ""}`}
                    >
                      <td className="py-2 pr-3 text-zinc-700">{fmtFecha(r.vigente_desde)}</td>
                      <td className="py-2 pr-3 font-mono text-zinc-900">
                        {Number(r.tasa).toLocaleString("es-PY")}
                      </td>
                      <td className="py-2 pr-3 text-zinc-700">
                        {fmtUsd(149000 / Number(r.tasa))}
                      </td>
                      <td className="py-2 pr-3 text-zinc-500 text-xs">{r.creado_por ?? "—"}</td>
                      <td className="py-2 pr-3 text-zinc-500 text-xs">{r.notas ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
