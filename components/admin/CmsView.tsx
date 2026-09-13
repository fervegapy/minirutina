"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, EyeOff, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  actualizarPrecios,
  setProductoActivo,
  actualizarLabelsProducto,
  crearFaq,
  actualizarFaq,
  eliminarFaq,
  crearTestimonio,
  actualizarTestimonio,
  setTestimonioActivo,
  eliminarTestimonio,
} from "@/app/admin/(dashboard)/cms/actions";

export interface PrecioRow {
  producto:          string;
  precio_impreso:    number;
  precio_digital:    number;
  /** Only used for Recompensas — 20-stickers variant. Null for Rutinas. */
  precio_impreso_20: number | null;
  precio_digital_20: number | null;
  /** Exterior — fijados a mano en USD, sin conversión. Null = no ofrecido afuera. */
  precio_digital_usd:    number | null;
  precio_digital_20_usd: number | null;
}
export interface ProductoConfigRow {
  producto: string;
  activo:   boolean;
  nombre:   string | null;
  tagline:  string | null;
}
export interface Faq {
  id:        string;
  producto:  string;
  pregunta:  string;
  respuesta: string;
  orden:     number;
  region:    "py" | "intl" | "ambas";
}
export interface Testimonio {
  id:     string;
  texto:  string;
  autor:  string;
  activo: boolean;
  orden:  number;
}

export interface CmsData {
  precios:     PrecioRow[];
  config:      ProductoConfigRow[];
  faqs:        Faq[];
  testimonios: Testimonio[];
}

const PRODUCTO_LABEL: Record<string, string> = {
  rutinas:     "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
};
const PRODUCTOS = ["rutinas", "recompensas"] as const;

export default function CmsView({ data }: { data: CmsData }) {
  return (
    <div className="space-y-5">
      <PreciosSection precios={data.precios} config={data.config} />
      <FaqsSection faqs={data.faqs} />
      <TestimoniosSection testimonios={data.testimonios} />
    </div>
  );
}

// ─── Precios + activación por producto ───────────────────────────────────────

// Default fallback labels — must stay in sync with lib/productos.ts.
// Shown as placeholders + hint text on the CMS inputs.
const FALLBACK_LABELS: Record<string, { nombre: string; tagline: string }> = {
  rutinas: {
    nombre:  "Tablero de Rutinas",
    tagline: "Una rutina visual para que tu hijo sepa qué sigue sin que tengas que recordárselo.",
  },
  recompensas: {
    nombre:  "Tablero de Recompensas",
    tagline: "Estrellitas, hábitos y una recompensa que los motiva de verdad.",
  },
};

function PreciosSection({
  precios,
  config,
}: {
  precios: PrecioRow[];
  config:  ProductoConfigRow[];
}) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-base">Productos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {PRODUCTOS.map((p) => {
          const precio = precios.find((r) => r.producto === p);
          const cfg = config.find((r) => r.producto === p);
          return (
            <ProductoRow
              key={p}
              producto={p}
              precioImpreso={precio?.precio_impreso ?? 0}
              precioDigital={precio?.precio_digital ?? 0}
              precioImpreso20={precio?.precio_impreso_20 ?? 0}
              precioDigital20={precio?.precio_digital_20 ?? 0}
              precioDigitalUsd={precio?.precio_digital_usd ?? 0}
              precioDigital20Usd={precio?.precio_digital_20_usd ?? 0}
              activo={cfg?.activo ?? true}
              nombre={cfg?.nombre ?? null}
              tagline={cfg?.tagline ?? null}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function ProductoRow({
  producto,
  precioImpreso,
  precioDigital,
  precioImpreso20,
  precioDigital20,
  precioDigitalUsd,
  precioDigital20Usd,
  activo,
  nombre,
  tagline,
}: {
  producto: string;
  precioImpreso: number;
  precioDigital: number;
  precioImpreso20: number;
  precioDigital20: number;
  precioDigitalUsd: number;
  precioDigital20Usd: number;
  activo: boolean;
  nombre: string | null;
  tagline: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const esRecompensas = producto === "recompensas";

  // Prices
  const [impreso,   setImpreso]   = useState(precioImpreso);
  const [digital,   setDigital]   = useState(precioDigital);
  const [impreso20, setImpreso20] = useState(precioImpreso20);
  const [digital20, setDigital20] = useState(precioDigital20);
  const [digitalUsd,   setDigitalUsd]   = useState(precioDigitalUsd);
  const [digital20Usd, setDigital20Usd] = useState(precioDigital20Usd);
  const preciosDirty =
    impreso   !== precioImpreso   ||
    digital   !== precioDigital   ||
    digitalUsd !== precioDigitalUsd ||
    (esRecompensas && (
      impreso20 !== precioImpreso20 ||
      digital20 !== precioDigital20 ||
      digital20Usd !== precioDigital20Usd
    ));

  // Labels — empty input → vuelve al fallback hardcoded
  const fallback = FALLBACK_LABELS[producto] ?? { nombre: "", tagline: "" };
  const [nombreVal, setNombreVal]   = useState(nombre  ?? "");
  const [taglineVal, setTaglineVal] = useState(tagline ?? "");
  const labelsDirty =
    (nombreVal.trim()  || null) !== (nombre  ?? null) ||
    (taglineVal.trim() || null) !== (tagline ?? null);

  // Precio "desde" — derivado del menor entre TODOS los variantes
  const precioDesde = useMemo(() => {
    const valores = esRecompensas
      ? [impreso, digital, impreso20, digital20].filter((n) => n > 0)
      : [impreso, digital].filter((n) => n > 0);
    if (valores.length === 0) return null;
    return Math.min(...valores);
  }, [impreso, digital, impreso20, digital20, esRecompensas]);

  const guardarPrecios = () => {
    startTransition(async () => {
      const r = await actualizarPrecios(
        producto,
        impreso,
        digital,
        esRecompensas ? (impreso20 || null) : null,
        esRecompensas ? (digital20 || null) : null,
        digitalUsd || null,
        esRecompensas ? (digital20Usd || null) : null,
      );
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };
  const guardarLabels = () => {
    startTransition(async () => {
      const r = await actualizarLabelsProducto(
        producto,
        nombreVal.trim()  || null,
        taglineVal.trim() || null,
      );
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };
  const togglePausa = () => {
    startTransition(async () => {
      const r = await setProductoActivo(producto, !activo);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };

  return (
    <div className="border border-zinc-200 rounded-lg p-4 space-y-5">
      {/* Encabezado del producto */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-zinc-900">
            {nombreVal || fallback.nombre || (PRODUCTO_LABEL[producto] ?? producto)}
          </p>
          <p className="text-xs text-zinc-500">
            {activo ? "Visible en el catálogo" : "Pausado — oculto en el catálogo"}
            {precioDesde !== null && (
              <> · desde Gs. {precioDesde.toLocaleString("es-PY")}</>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={togglePausa}
          disabled={pending}
          className="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        >
          {activo ? (
            <>
              <EyeOff className="w-3.5 h-3.5 mr-1.5" />
              Pausar
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Reactivar
            </>
          )}
        </Button>
      </div>

      {/* Etiquetas */}
      <div className="space-y-3 pt-2 border-t border-zinc-100">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
            Nombre
          </label>
          <Input
            value={nombreVal}
            onChange={(e) => setNombreVal(e.target.value)}
            placeholder={fallback.nombre}
            className="text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
            Tagline
          </label>
          <textarea
            value={taglineVal}
            onChange={(e) => setTaglineVal(e.target.value)}
            placeholder={fallback.tagline}
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 resize-y"
          />
          <p className="text-[10px] text-zinc-400 mt-1">
            Dejá los campos vacíos para usar el texto por defecto del código.
          </p>
        </div>
        {labelsDirty && (
          <Button
            onClick={guardarLabels}
            disabled={pending}
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-8 rounded-md"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {pending ? "Guardando..." : "Guardar etiquetas"}
          </Button>
        )}
      </div>

      {/* Precios */}
      <div className="space-y-3 pt-2 border-t border-zinc-100">
        {esRecompensas ? (
          <>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">
              Precios — 10 stickers
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PriceField label="Impreso (Gs.)" value={impreso}   onChange={setImpreso} />
              <PriceField label="Digital (Gs.)" value={digital}   onChange={setDigital} />
            </div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mt-3">
              Precios — 20 stickers
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PriceField label="Impreso (Gs.)" value={impreso20} onChange={setImpreso20} />
              <PriceField label="Digital (Gs.)" value={digital20} onChange={setDigital20} />
            </div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mt-3">
              Exterior — digital en USD (fijado a mano, sin conversión)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PriceField label="Digital 10 (USD)" value={digitalUsd}   onChange={setDigitalUsd} />
              <PriceField label="Digital 20 (USD)" value={digital20Usd} onChange={setDigital20Usd} />
            </div>
            <p className="text-[10px] text-zinc-400">
              Vacío o 0 = este producto no se ofrece en el exterior todavía.
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">
              Precios
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PriceField label="Impreso (Gs.)" value={impreso} onChange={setImpreso} />
              <PriceField label="Digital (Gs.)" value={digital} onChange={setDigital} />
            </div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mt-3">
              Exterior — digital en USD (fijado a mano, sin conversión)
            </p>
            <PriceField label="Digital (USD)" value={digitalUsd} onChange={setDigitalUsd} />
            <p className="text-[10px] text-zinc-400">
              Vacío o 0 = este producto no se ofrece en el exterior todavía.
            </p>
          </>
        )}
        {preciosDirty && (
          <Button
            onClick={guardarPrecios}
            disabled={pending}
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-9 rounded-md"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {pending ? "Guardando..." : "Guardar precios"}
          </Button>
        )}
        <p className="text-[10px] text-zinc-400">
          &quot;Desde&quot; en el catálogo se calcula automáticamente del menor de los dos.
        </p>
      </div>
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
        {label}
      </label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        className="text-sm bg-white"
      />
    </div>
  );
}

// ─── FAQs ────────────────────────────────────────────────────────────────────

function FaqsSection({ faqs }: { faqs: Faq[] }) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-base">FAQs por producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {PRODUCTOS.map((p) => {
          const filtradas = faqs.filter((f) => f.producto === p);
          return (
            <div key={p}>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                {PRODUCTO_LABEL[p] ?? p}
              </h3>
              <div className="space-y-3">
                {filtradas.map((f) => (
                  <FaqEditor key={f.id} faq={f} />
                ))}
                <NuevaFaq producto={p} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

const REGION_FAQ_LABEL: Record<Faq["region"], string> = {
  py:    "🇵🇾 Solo Paraguay",
  intl:  "🌎 Solo exterior",
  ambas: "Ambas regiones",
};

function RegionFaqSelect({
  value,
  onChange,
}: {
  value: Faq["region"];
  onChange: (v: Faq["region"]) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Faq["region"])}
      className="text-xs rounded-md border border-zinc-200 bg-white text-zinc-700 h-7 px-2"
    >
      {(Object.keys(REGION_FAQ_LABEL) as Faq["region"][]).map((r) => (
        <option key={r} value={r}>{REGION_FAQ_LABEL[r]}</option>
      ))}
    </select>
  );
}

function FaqEditor({ faq }: { faq: Faq }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pregunta, setPregunta] = useState(faq.pregunta);
  const [respuesta, setRespuesta] = useState(faq.respuesta);
  const [region, setRegion] = useState<Faq["region"]>(faq.region ?? "ambas");
  const dirty = pregunta !== faq.pregunta || respuesta !== faq.respuesta || region !== faq.region;

  const guardar = () => {
    startTransition(async () => {
      const r = await actualizarFaq(faq.id, pregunta, respuesta, region);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };
  const borrar = () => {
    if (!confirm("¿Eliminar esta FAQ?")) return;
    startTransition(async () => {
      const r = await eliminarFaq(faq.id);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };

  return (
    <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
      <Input
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        placeholder="Pregunta"
        className="text-sm bg-white font-medium"
      />
      <textarea
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        placeholder="Respuesta"
        rows={2}
        className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 resize-y"
      />
      <div className="flex justify-between items-center gap-2">
        <button
          onClick={borrar}
          disabled={pending}
          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
        <div className="flex items-center gap-2">
          <RegionFaqSelect value={region} onChange={setRegion} />
          {dirty && (
            <Button
              onClick={guardar}
              disabled={pending}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs h-7 rounded-md"
            >
              <Save className="w-3 h-3 mr-1" />
              Guardar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function NuevaFaq({ producto }: { producto: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [region, setRegion] = useState<Faq["region"]>("ambas");

  const agregar = () => {
    if (!pregunta.trim() || !respuesta.trim()) return;
    startTransition(async () => {
      const r = await crearFaq(producto, pregunta.trim(), respuesta.trim(), region);
      if (r.ok) {
        setPregunta("");
        setRespuesta("");
        router.refresh();
      } else alert(r.error ?? "Error");
    });
  };

  return (
    <div className="border border-dashed border-zinc-300 rounded-lg p-3 space-y-2 bg-zinc-50/50">
      <Input
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        placeholder="Nueva pregunta..."
        className="text-sm bg-white font-medium"
      />
      <textarea
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        placeholder="Respuesta..."
        rows={2}
        className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 resize-y"
      />
      <div className="flex items-center gap-2">
        <RegionFaqSelect value={region} onChange={setRegion} />
        <Button
          onClick={agregar}
          disabled={pending || !pregunta.trim() || !respuesta.trim()}
          variant="outline"
          className="text-xs h-7 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        >
          <Plus className="w-3 h-3 mr-1" />
          Agregar FAQ
        </Button>
      </div>
    </div>
  );
}

// ─── Testimonios ─────────────────────────────────────────────────────────────

function TestimoniosSection({ testimonios }: { testimonios: Testimonio[] }) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-base">Testimonios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {testimonios.map((t) => (
          <TestimonioEditor key={t.id} t={t} />
        ))}
        <NuevoTestimonio />
      </CardContent>
    </Card>
  );
}

function TestimonioEditor({ t }: { t: Testimonio }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [texto, setTexto] = useState(t.texto);
  const [autor, setAutor] = useState(t.autor);
  const dirty = texto !== t.texto || autor !== t.autor;

  const guardar = () => {
    startTransition(async () => {
      const r = await actualizarTestimonio(t.id, texto, autor);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };
  const togglePausa = () => {
    startTransition(async () => {
      const r = await setTestimonioActivo(t.id, !t.activo);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };
  const borrar = () => {
    if (!confirm("¿Eliminar este testimonio?")) return;
    startTransition(async () => {
      const r = await eliminarTestimonio(t.id);
      if (r.ok) router.refresh();
      else alert(r.error ?? "Error");
    });
  };

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 ${
        t.activo ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50/70"
      }`}
    >
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Texto del testimonio"
        rows={3}
        className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 resize-y"
      />
      <Input
        value={autor}
        onChange={(e) => setAutor(e.target.value)}
        placeholder="Autor (ej: Mamá de Tomás, 4 años — Asunción)"
        className="text-sm bg-white"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={borrar}
          disabled={pending}
          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 mr-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
        <Button
          variant="outline"
          onClick={togglePausa}
          disabled={pending}
          className="text-xs h-7 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        >
          {t.activo ? (
            <>
              <EyeOff className="w-3 h-3 mr-1" />
              Pausar
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 mr-1" />
              Reactivar
            </>
          )}
        </Button>
        {dirty && (
          <Button
            onClick={guardar}
            disabled={pending}
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs h-7 rounded-md"
          >
            <Save className="w-3 h-3 mr-1" />
            Guardar
          </Button>
        )}
      </div>
    </div>
  );
}

function NuevoTestimonio() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [texto, setTexto] = useState("");
  const [autor, setAutor] = useState("");

  const agregar = () => {
    if (!texto.trim() || !autor.trim()) return;
    startTransition(async () => {
      const r = await crearTestimonio(texto.trim(), autor.trim());
      if (r.ok) {
        setTexto("");
        setAutor("");
        router.refresh();
      } else alert(r.error ?? "Error");
    });
  };

  return (
    <div className="border border-dashed border-zinc-300 rounded-lg p-3 space-y-2 bg-zinc-50/50">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Texto del nuevo testimonio..."
        rows={3}
        className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 resize-y"
      />
      <Input
        value={autor}
        onChange={(e) => setAutor(e.target.value)}
        placeholder="Autor..."
        className="text-sm bg-white"
      />
      <Button
        onClick={agregar}
        disabled={pending || !texto.trim() || !autor.trim()}
        variant="outline"
        className="text-xs h-7 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
      >
        <Plus className="w-3 h-3 mr-1" />
        Agregar testimonio
      </Button>
    </div>
  );
}
