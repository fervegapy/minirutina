"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
import {
  crearTarjeta, actualizarTarjeta, eliminarTarjeta, type Cambios,
} from "@/app/admin/(dashboard)/kanban/actions";
import {
  ESTADOS, FORMATOS, LIMITE_IG, fechaCorta, urgencia, type Pieza,
} from "@/lib/contenido";

const selectCls =
  "h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900";
const areaCls =
  "w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900";
const labelCls = "text-xs font-medium text-zinc-500 mb-1 block";

export default function KanbanView({ piezas }: { piezas: Pieza[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nueva, setNueva] = useState<string | null>(null); // estado inicial del modal
  // Estado optimista mientras la server action está en vuelo.
  const [override, setOverride] = useState<Record<string, string>>({});

  const estadoDe = (p: Pieza) => override[p.id] ?? p.estado;

  // Sin realtime: al volver a la pestaña se relee.
  useEffect(() => {
    const alVolver = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [router]);

  const mover = (id: string, estado: string) => {
    setOverride((o) => ({ ...o, [id]: estado }));
    startTransition(async () => {
      const r = await actualizarTarjeta(id, { estado });
      if (!r.ok) setError(r.error ?? "No se pudo mover.");
      router.refresh();
      setOverride((o) => {
        const { [id]: _omit, ...rest } = o;
        return rest;
      });
    });
  };

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="mb-4">
        <Button className="h-10" onClick={() => setNueva("ideas")}>
          <Plus className="w-4 h-4 mr-1" /> Nueva pieza
        </Button>
      </div>
      {nueva && <ModalNueva estadoInicial={nueva} onClose={() => setNueva(null)} />}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {ESTADOS.map((col) => {
          const items = piezas
            .filter((p) => estadoDe(p) === col.id)
            .sort((a, b) => a.orden - b.orden);
          return (
            <section
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setSobre(col.id); }}
              onDragLeave={() => setSobre((s) => (s === col.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setSobre(null);
                if (arrastrando) mover(arrastrando, col.id);
                setArrastrando(null);
              }}
              className={`w-72 shrink-0 rounded-lg border p-3 space-y-3 ${
                sobre === col.id ? "border-zinc-400 bg-zinc-100" : "border-zinc-200 bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                <h2 className="text-sm font-semibold text-zinc-800">{col.label}</h2>
                <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
              </div>
              {items.map((p) => (
                <TarjetaCard
                  key={p.id}
                  pieza={p}
                  estado={estadoDe(p)}
                  onDragStart={() => setArrastrando(p.id)}
                  onDragEnd={() => { setArrastrando(null); setSobre(null); }}
                  onMover={(e) => mover(p.id, e)}
                />
              ))}
              {items.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-2">Vacío</p>
              )}
              <Button
                variant="ghost"
                className="h-10 w-full justify-start text-zinc-500"
                onClick={() => setNueva(col.id)}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TarjetaCard({
  pieza, estado, onDragStart, onDragEnd, onMover,
}: {
  pieza: Pieza;
  estado: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMover: (estado: string) => void;
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [p, setP] = useState(pieza);
  const [guardado, setGuardado] = useState<"" | "guardando" | "ok" | "error">("");
  const [, startTransition] = useTransition();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Lo que manda el server gana al refrescar (salvo que se esté editando).
  useEffect(() => { if (!abierta) setP(pieza); }, [pieza, abierta]);

  const guardar = (cambios: Cambios) => {
    setGuardado("guardando");
    startTransition(async () => {
      const r = await actualizarTarjeta(pieza.id, cambios);
      setGuardado(r.ok ? "ok" : "error");
    });
  };

  /** Actualiza local y guarda: inmediato para selects, con debounce para textos largos. */
  function cambiar<K extends keyof Cambios>(k: K, v: NonNullable<Cambios[K]> | null, demora = 0) {
    setP((prev) => ({ ...prev, [k]: v }));
    clearTimeout(timers.current[k]);
    if (demora) timers.current[k] = setTimeout(() => guardar({ [k]: v } as Cambios), demora);
    else guardar({ [k]: v } as Cambios);
  }

  const borrar = () => {
    if (!confirm("¿Borrar esta pieza? No se puede deshacer.")) return;
    startTransition(async () => {
      await eliminarTarjeta(pieza.id);
      router.refresh();
    });
  };

  const u = urgencia(p.fecha, estado);

  return (
    <Card
      draggable={!abierta}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white ${abierta ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <CardContent className="p-3 space-y-2">
        <button
          type="button"
          onClick={() => { setAbierta((a) => !a); if (abierta) router.refresh(); }}
          className="w-full text-left text-sm font-medium text-zinc-900"
        >
          {p.titulo || "Sin título"}
        </button>
        {(p.fecha || p.formato) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {p.fecha && (
              <Badge
                variant="outline"
                className={
                  u === "vencida" ? "border-red-300 bg-red-50 text-red-700"
                  : u === "pronto" ? "border-amber-300 bg-amber-50 text-amber-800"
                  : ""
                }
              >
                {fechaCorta(p.fecha)}
              </Badge>
            )}
            {p.formato && <Badge variant="secondary">{p.formato}</Badge>}
          </div>
        )}

        {abierta && (
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <Input
              value={p.titulo}
              placeholder="Título de la pieza"
              onChange={(e) => setP({ ...p, titulo: e.target.value })}
              onBlur={() => guardar({ titulo: p.titulo.trim() || "Sin título" })}
            />
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className={labelCls}>Estado</span>
                <select className={selectCls} value={estado} onChange={(e) => onMover(e.target.value)}>
                  {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </label>
              <label>
                <span className={labelCls}>Formato</span>
                <select className={selectCls} value={p.formato ?? ""} onChange={(e) => cambiar("formato", e.target.value || null)}>
                  <option value="">—</option>
                  {FORMATOS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className={labelCls}>Publicación proyectada</span>
              <Input type="date" value={p.fecha ?? ""} onChange={(e) => cambiar("fecha", e.target.value || null)} />
            </label>
            <label className="block">
              <span className={labelCls}>Contenido</span>
              <textarea
                rows={7} className={areaCls} value={p.contenido}
                placeholder="Gancho, desarrollo, CTA… lo que se dice o muestra"
                onChange={(e) => cambiar("contenido", e.target.value, 900)}
              />
            </label>
            <label className="block">
              <span className={`${labelCls} flex justify-between`}>
                Caption
                <span className={p.caption.length > LIMITE_IG ? "text-red-600" : ""}>
                  {p.caption.length} / {LIMITE_IG}
                </span>
              </span>
              <textarea
                rows={4} className={areaCls} value={p.caption}
                placeholder="Caption del posteo. Hashtags al final."
                onChange={(e) => cambiar("caption", e.target.value, 900)}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Inspo (link)</span>
              <div className="flex gap-1.5">
                <Input
                  value={p.inspo} placeholder="https://…"
                  onChange={(e) => cambiar("inspo", e.target.value, 900)}
                />
                {/^https?:\/\//.test(p.inspo) && (
                  <a
                    href={p.inspo} target="_blank" rel="noopener noreferrer"
                    className="h-10 px-3 shrink-0 inline-flex items-center rounded-md border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Abrir
                  </a>
                )}
              </div>
            </label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {guardado === "guardando" ? "Guardando…" : guardado === "ok" ? "Guardado ✓"
                  : guardado === "error" ? "No se pudo guardar — reintentá" : ""}
              </span>
              <Button variant="outline" className="h-10" onClick={borrar}>
                <Trash2 className="w-4 h-4 mr-1" /> Borrar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModalNueva({ estadoInicial, onClose }: { estadoInicial: string; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    titulo: "", estado: estadoInicial, formato: "", fecha: "",
    contenido: "", caption: "", inspo: "",
  });

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const crear = () => {
    if (!f.titulo.trim()) { setError("Poné un título."); return; }
    startTransition(async () => {
      const r = await crearTarjeta({
        ...f, formato: f.formato || null, fecha: f.fecha || null,
      });
      if (!r.ok) { setError(r.error ?? "No se pudo crear."); return; }
      router.refresh();
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Nueva pieza"
        className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl border border-zinc-200 p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Nueva pieza</h2>
          <Button variant="ghost" className="h-10 w-10 p-0" aria-label="Cerrar" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Input
          autoFocus value={f.titulo} placeholder="Título de la pieza"
          onChange={(e) => setF({ ...f, titulo: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") crear(); }}
        />
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className={labelCls}>Estado</span>
            <select className={selectCls} value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value })}>
              {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </label>
          <label>
            <span className={labelCls}>Formato</span>
            <select className={selectCls} value={f.formato} onChange={(e) => setF({ ...f, formato: e.target.value })}>
              <option value="">—</option>
              {FORMATOS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <span className={labelCls}>Publicación proyectada</span>
          <Input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
        </label>
        <label className="block">
          <span className={labelCls}>Contenido</span>
          <textarea rows={4} className={areaCls} value={f.contenido}
            placeholder="Gancho, desarrollo, CTA…"
            onChange={(e) => setF({ ...f, contenido: e.target.value })} />
        </label>
        <label className="block">
          <span className={`${labelCls} flex justify-between`}>
            Caption
            <span className={f.caption.length > LIMITE_IG ? "text-red-600" : ""}>
              {f.caption.length} / {LIMITE_IG}
            </span>
          </span>
          <textarea rows={3} className={areaCls} value={f.caption}
            placeholder="Caption del posteo"
            onChange={(e) => setF({ ...f, caption: e.target.value })} />
        </label>
        <label className="block">
          <span className={labelCls}>Inspo (link)</span>
          <Input value={f.inspo} placeholder="https://…" onChange={(e) => setF({ ...f, inspo: e.target.value })} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button className="h-10 flex-1" disabled={pending} onClick={crear}>Crear</Button>
          <Button variant="outline" className="h-10" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
