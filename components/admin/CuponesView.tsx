"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import {
  crearCupon, actualizarCupon, eliminarCupon, toggleActivo,
  type CuponInput,
} from "@/app/admin/(dashboard)/cupones/actions";

export interface Cupon {
  id:             string;
  codigo:         string;
  tipo:           "monto" | "porcentaje";
  valor:          number;
  tope_descuento: number | null;
  monto_minimo:   number | null;
  vigencia_hasta: string | null;
  max_usos:       number | null;
  usos:           number;
  activo:         boolean;
  descripcion:    string | null;
  created_at:     string;
}

export interface CuponUso {
  id:              string;
  cupon_id:        string | null;
  codigo:          string;
  pedido_id:       string | null;
  email:           string | null;
  monto_original:  number;
  monto_descuento: number;
  monto_final:     number;
  created_at:      string;
}

function fmtGs(n: number) { return "Gs. " + Math.round(n).toLocaleString("es-PY"); }
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
}
function descuentoLabel(c: Pick<Cupon, "tipo" | "valor" | "tope_descuento">) {
  if (c.tipo === "monto") return fmtGs(c.valor);
  return `${c.valor}%${c.tope_descuento ? ` (tope ${fmtGs(c.tope_descuento)})` : ""}`;
}

export default function CuponesView({ cupones, usos }: { cupones: Cupon[]; usos: CuponUso[] }) {
  const usosPorCupon = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const u of usos) {
      const prev = map.get(u.codigo) ?? { count: 0, total: 0 };
      map.set(u.codigo, { count: prev.count + 1, total: prev.total + u.monto_descuento });
    }
    return map;
  }, [usos]);

  return (
    <div className="space-y-5">
      {cupones.map((c) => (
        <CuponRow
          key={c.id}
          cupon={c}
          usos={usos.filter((u) => u.codigo === c.codigo)}
          resumen={usosPorCupon.get(c.codigo) ?? { count: 0, total: 0 }}
        />
      ))}
      <NuevoCuponCard />
    </div>
  );
}

function CuponRow({
  cupon, usos, resumen,
}: {
  cupon: Cupon;
  usos: CuponUso[];
  resumen: { count: number; total: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  const venc = cupon.vigencia_hasta ? new Date(cupon.vigencia_hasta) : null;
  const vencido = venc ? venc < new Date() : false;
  const agotado = cupon.max_usos !== null && cupon.usos >= cupon.max_usos;

  const togglar = () => startTransition(async () => {
    await toggleActivo(cupon.id, !cupon.activo);
    router.refresh();
  });
  const borrar = () => {
    if (!confirm(`¿Eliminar el cupón ${cupon.codigo}? (se mantienen los registros de uso)`)) return;
    startTransition(async () => { await eliminarCupon(cupon.id); router.refresh(); });
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2 font-mono">
            {cupon.codigo}
            {!cupon.activo && <Badge className="bg-zinc-200 text-zinc-600 border-0 text-[10px] h-5 px-2">Inactivo</Badge>}
            {vencido && <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] h-5 px-2">Vencido</Badge>}
            {agotado && <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] h-5 px-2">Agotado</Badge>}
          </CardTitle>
          <span className="text-sm font-semibold text-zinc-700">{descuentoLabel(cupon)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat label="Usos" value={`${cupon.usos}${cupon.max_usos !== null ? ` / ${cupon.max_usos}` : ""}`} />
          <Stat label="Descontado" value={fmtGs(resumen.total)} />
          <Stat label="Vence" value={venc ? fmtFecha(cupon.vigencia_hasta!) : "Sin vto."} />
          <Stat label="Mínimo" value={cupon.monto_minimo ? fmtGs(cupon.monto_minimo) : "—"} />
        </div>
        {cupon.descripcion && (
          <p className="text-xs text-zinc-500 italic">{cupon.descripcion}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
          <Button onClick={() => setEdit(!edit)} variant="outline" className="text-xs h-8 border-zinc-200">
            {edit ? "Cancelar" : "Editar"}
          </Button>
          <Button onClick={togglar} disabled={pending} variant="outline" className="text-xs h-8 border-zinc-200">
            {cupon.activo ? "Desactivar" : "Activar"}
          </Button>
          {usos.length > 0 && (
            <Button onClick={() => setOpen(!open)} variant="outline" className="text-xs h-8 border-zinc-200">
              {open ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
              {usos.length} {usos.length === 1 ? "uso" : "usos"}
            </Button>
          )}
          <Button onClick={borrar} disabled={pending} variant="outline" className="ml-auto text-xs h-8 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {edit && <CuponForm cupon={cupon} onDone={() => { setEdit(false); router.refresh(); }} />}

        {open && usos.length > 0 && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="py-1.5 pr-3 font-medium">Fecha</th>
                  <th className="py-1.5 pr-3 font-medium">Email</th>
                  <th className="py-1.5 pr-3 font-medium">Descuento</th>
                  <th className="py-1.5 pr-3 font-medium">Pagó</th>
                </tr>
              </thead>
              <tbody>
                {usos.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100">
                    <td className="py-1.5 pr-3 text-zinc-600">{fmtFecha(u.created_at)}</td>
                    <td className="py-1.5 pr-3 text-zinc-600">{u.email ?? "—"}</td>
                    <td className="py-1.5 pr-3 text-zinc-900">−{fmtGs(u.monto_descuento)}</td>
                    <td className="py-1.5 pr-3 text-zinc-600">{fmtGs(u.monto_final)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-400 uppercase tracking-wide text-[10px] font-medium">{label}</p>
      <p className="text-zinc-900 font-semibold">{value}</p>
    </div>
  );
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function CuponForm({ cupon, onDone }: { cupon?: Cupon; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [codigo,        setCodigo]        = useState(cupon?.codigo ?? "");
  const [tipo,          setTipo]          = useState<"monto" | "porcentaje">(cupon?.tipo ?? "porcentaje");
  const [valor,         setValor]         = useState<number>(cupon?.valor ?? 0);
  const [tope,          setTope]          = useState<number | "">(cupon?.tope_descuento ?? "");
  const [minimo,        setMinimo]        = useState<number | "">(cupon?.monto_minimo ?? "");
  const [vence,         setVence]         = useState<string>(toDateInput(cupon?.vigencia_hasta ?? null));
  const [maxUsos,       setMaxUsos]       = useState<number | "">(cupon?.max_usos ?? "");
  const [activo,        setActivo]        = useState<boolean>(cupon?.activo ?? true);
  const [descripcion,   setDescripcion]   = useState(cupon?.descripcion ?? "");
  const [err, setErr] = useState<string | null>(null);

  const guardar = () => {
    setErr(null);
    const input: CuponInput = {
      codigo,
      tipo,
      valor: Number(valor),
      tope_descuento: tipo === "porcentaje" && tope !== "" ? Number(tope) : null,
      monto_minimo:   minimo !== "" ? Number(minimo) : null,
      vigencia_hasta: vence ? new Date(vence + "T23:59:59").toISOString() : null,
      max_usos:       maxUsos !== "" ? Number(maxUsos) : null,
      activo,
      descripcion:    descripcion || null,
    };
    startTransition(async () => {
      const r = cupon ? await actualizarCupon(cupon.id, input) : await crearCupon(input);
      if (r.ok) onDone();
      else setErr(r.error ?? "Error");
    });
  };

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3 mt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Código">
          <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="EJ: BIENVENIDA15" className="text-sm uppercase" />
        </Field>
        <Field label="Tipo de descuento">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "monto" | "porcentaje")}
            className="w-full text-sm h-10 px-3 rounded-md border border-zinc-200 bg-white"
          >
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto">Monto fijo (Gs.)</option>
          </select>
        </Field>
        <Field label={tipo === "monto" ? "Monto a descontar (Gs.)" : "Porcentaje (%)"}>
          <Input type="text" inputMode="numeric" value={valor || ""} onChange={(e) => setValor(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)} className="text-sm" />
        </Field>
        {tipo === "porcentaje" && (
          <Field label="Tope de descuento (Gs.) — opcional">
            <Input type="text" inputMode="numeric" value={tope === "" ? "" : tope} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setTope(v ? parseInt(v, 10) : ""); }} className="text-sm" placeholder="Sin tope" />
          </Field>
        )}
        <Field label="Compra mínima (Gs.) — opcional">
          <Input type="text" inputMode="numeric" value={minimo === "" ? "" : minimo} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMinimo(v ? parseInt(v, 10) : ""); }} className="text-sm" placeholder="Sin mínimo" />
        </Field>
        <Field label="Vigencia hasta — opcional">
          <Input type="date" value={vence} onChange={(e) => setVence(e.target.value)} className="text-sm" />
        </Field>
        <Field label="Máximo de usos — vacío = ilimitado">
          <Input type="text" inputMode="numeric" value={maxUsos === "" ? "" : maxUsos} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMaxUsos(v ? parseInt(v, 10) : ""); }} className="text-sm" placeholder="Ilimitado" />
        </Field>
        <Field label="Descripción / campaña — opcional">
          <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="text-sm" placeholder="Ej: @creador IG mayo" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Activo
      </label>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <Button onClick={guardar} disabled={pending} className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-9 rounded-md">
        <Save className="w-3.5 h-3.5 mr-1.5" />
        {pending ? "Guardando..." : (cupon ? "Guardar cambios" : "Crear cupón")}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function NuevoCuponCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="border-dashed border-zinc-300 text-zinc-600 h-11 w-full">
        <Plus className="w-4 h-4 mr-1.5" />
        Nuevo cupón
      </Button>
    );
  }
  return (
    <Card className="bg-white border-dashed">
      <CardHeader><CardTitle className="text-base text-zinc-700">Nuevo cupón</CardTitle></CardHeader>
      <CardContent>
        <CuponForm onDone={() => { setOpen(false); router.refresh(); }} />
      </CardContent>
    </Card>
  );
}
