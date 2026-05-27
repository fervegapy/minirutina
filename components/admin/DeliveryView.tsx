"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, X } from "lucide-react";
import { crearZona, actualizarZona, eliminarZona } from "@/app/admin/(dashboard)/delivery/actions";
import type { DeliveryZona } from "@/lib/delivery";

function fmtGs(n: number) {
  return "Gs. " + n.toLocaleString("es-PY");
}

export default function DeliveryView({ zonas }: { zonas: DeliveryZona[] }) {
  return (
    <div className="space-y-5">
      {zonas.map((z) => <ZonaRow key={z.id} zona={z} />)}
      <NuevaZonaCard />
    </div>
  );
}

function ZonaRow({ zona }: { zona: DeliveryZona }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nombre,    setNombre]    = useState(zona.nombre);
  const [precio,    setPrecio]    = useState<number>(zona.precio);
  const [ciudades,  setCiudades]  = useState<string[]>(zona.ciudades);
  const [esDefault, setEsDefault] = useState(zona.es_default);
  const [nuevaCiudad, setNuevaCiudad] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty =
    nombre !== zona.nombre ||
    precio !== zona.precio ||
    esDefault !== zona.es_default ||
    JSON.stringify(ciudades) !== JSON.stringify(zona.ciudades);

  const addCiudad = () => {
    const c = nuevaCiudad.trim();
    if (!c || ciudades.includes(c)) return;
    setCiudades([...ciudades, c]);
    setNuevaCiudad("");
  };

  const removeCiudad = (c: string) => {
    setCiudades(ciudades.filter((x) => x !== c));
  };

  const guardar = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await actualizarZona(zona.id, nombre, precio, ciudades, esDefault);
      if (r.ok) { setMsg({ ok: true, text: "Guardado." }); router.refresh(); }
      else      { setMsg({ ok: false, text: r.error ?? "Error" }); }
    });
  };

  const eliminar = () => {
    if (!confirm(`¿Eliminar la zona "${zona.nombre}"?`)) return;
    startTransition(async () => {
      const r = await eliminarZona(zona.id);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            {zona.nombre}
            {zona.es_default && (
              <Badge className="bg-zinc-900 text-white border-0 text-[10px] h-5 px-2">
                Default
              </Badge>
            )}
          </CardTitle>
          <span className="text-sm font-semibold text-zinc-700">{fmtGs(precio)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
              Nombre
            </label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
              Precio (Gs.)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={precio || ""}
              onChange={(e) => setPrecio(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
            Ciudades incluidas
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ciudades.length === 0 && (
              <span className="text-xs text-zinc-400 italic">
                Sin ciudades — solo se aplica si esta zona es default.
              </span>
            )}
            {ciudades.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-md"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCiudad(c)}
                  className="text-zinc-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={nuevaCiudad}
              onChange={(e) => setNuevaCiudad(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCiudad(); } }}
              placeholder="Agregar ciudad..."
              className="text-sm"
            />
            <Button type="button" onClick={addCiudad} variant="outline" className="h-9 text-sm">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={esDefault}
            onChange={(e) => setEsDefault(e.target.checked)}
          />
          Zona default (para ciudades fuera de cualquier otra zona)
        </label>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <Button
            onClick={eliminar}
            disabled={pending}
            variant="outline"
            className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Eliminar
          </Button>
          <div className="flex items-center gap-3">
            {msg && (
              <span className={msg.ok ? "text-xs text-emerald-600" : "text-xs text-red-600"}>
                {msg.text}
              </span>
            )}
            {dirty && (
              <Button
                onClick={guardar}
                disabled={pending}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-8 rounded-md"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {pending ? "Guardando..." : "Guardar"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NuevaZonaCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nombre,    setNombre]    = useState("");
  const [precio,    setPrecio]    = useState<number>(0);
  const [ciudades,  setCiudades]  = useState<string[]>([]);
  const [esDefault, setEsDefault] = useState(false);
  const [nuevaCiudad, setNuevaCiudad] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const addCiudad = () => {
    const c = nuevaCiudad.trim();
    if (!c || ciudades.includes(c)) return;
    setCiudades([...ciudades, c]);
    setNuevaCiudad("");
  };

  const crear = () => {
    setErr(null);
    startTransition(async () => {
      const r = await crearZona(nombre, precio, ciudades, esDefault);
      if (r.ok) {
        setNombre(""); setPrecio(0); setCiudades([]); setEsDefault(false);
        router.refresh();
      } else {
        setErr(r.error ?? "Error");
      }
    });
  };

  return (
    <Card className="bg-white border-dashed">
      <CardHeader>
        <CardTitle className="text-base text-zinc-700">+ Nueva zona</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (ej. 'Encarnación')" className="text-sm" />
          <Input
            type="text"
            inputMode="numeric"
            value={precio || ""}
            onChange={(e) => setPrecio(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
            placeholder="Precio en Gs."
            className="text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ciudades.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-md">
              {c}
              <button type="button" onClick={() => setCiudades(ciudades.filter((x) => x !== c))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={nuevaCiudad}
            onChange={(e) => setNuevaCiudad(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCiudad(); } }}
            placeholder="Agregar ciudad..."
            className="text-sm"
          />
          <Button type="button" onClick={addCiudad} variant="outline" className="h-9 text-sm">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input type="checkbox" checked={esDefault} onChange={(e) => setEsDefault(e.target.checked)} />
          Marcar como default
        </label>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <Button
          onClick={crear}
          disabled={pending || !nombre.trim() || precio < 0}
          className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-9 rounded-md"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {pending ? "Creando..." : "Crear zona"}
        </Button>
      </CardContent>
    </Card>
  );
}
