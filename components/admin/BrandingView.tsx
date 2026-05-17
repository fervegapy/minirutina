"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  actualizarSiteConfig,
  subirAsset,
  quitarAsset,
  type AssetKind,
} from "@/app/admin/(dashboard)/branding/actions";

export interface SiteConfigRow {
  site_name:         string;
  site_description:  string;
  logo_url:          string | null;
  favicon_url:       string | null;
  og_image_url:      string | null;
  support_image_url: string | null;
  theme_color:       string;
}

const ASSETS: {
  kind:      AssetKind;
  label:     string;
  hint:      string;
  recommended: string;
  field:     keyof SiteConfigRow;
}[] = [
  {
    kind:        "logo",
    label:       "Logo",
    hint:        "Aparece en el header y en el footer del sitio.",
    recommended: "PNG transparente · 512×128 px (proporción 4:1)",
    field:       "logo_url",
  },
  {
    kind:        "favicon",
    label:       "Favicon",
    hint:        "El íconito que aparece en la pestaña del navegador.",
    recommended: "PNG cuadrado · 64×64 o 128×128 px",
    field:       "favicon_url",
  },
  {
    kind:        "og",
    label:       "Imagen para compartir (Open Graph)",
    hint:        "Lo que se ve cuando alguien comparte el link en WhatsApp / Facebook / Twitter.",
    recommended: "JPG o PNG · 1200×630 px (proporción 1.91:1)",
    field:       "og_image_url",
  },
  {
    kind:        "support",
    label:       "Imagen de soporte / marketing",
    hint:        "Imagen genérica para emails y materiales — opcional.",
    recommended: "JPG o PNG · 1200×800 px",
    field:       "support_image_url",
  },
];

export default function BrandingView({ initial }: { initial: SiteConfigRow }) {
  return (
    <div className="space-y-8">
      <TextoSection initial={initial} />
      <div className="border-t border-zinc-200" />
      <div className="space-y-5">
        <header>
          <h2 className="text-base font-semibold text-zinc-900">Imágenes</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Subí los archivos. Se guardan en Supabase Storage y se reflejan
            en el sitio público al instante.
          </p>
        </header>
        {ASSETS.map((a) => (
          <AssetRow
            key={a.kind}
            kind={a.kind}
            label={a.label}
            hint={a.hint}
            recommended={a.recommended}
            currentUrl={initial[a.field] as string | null}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Text section ────────────────────────────────────────────────────────────

function TextoSection({ initial }: { initial: SiteConfigRow }) {
  const [name, setName] = useState(initial.site_name);
  const [desc, setDesc] = useState(initial.site_description);
  const [theme, setTheme] = useState(initial.theme_color);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const guardar = () => {
    setMsg(null);
    start(async () => {
      const res = await actualizarSiteConfig(name, desc, theme);
      setMsg(
        res.ok
          ? { ok: true,  text: "Guardado." }
          : { ok: false, text: res.error ?? "Error" },
      );
    });
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-zinc-900">Identidad del sitio</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Nombre, descripción y color principal — aparecen en metadatos y en el navegador.
        </p>
      </header>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Nombre del sitio
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Descripción (meta description, máx. 160 caracteres)
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full text-sm rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
          />
          <p className="text-[11px] text-zinc-400 mt-1 text-right">
            {desc.length}/160
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Color principal (theme color)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-12 h-10 rounded-md border border-zinc-200 cursor-pointer bg-white"
            />
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="font-mono text-sm w-32"
            />
            <span className="text-[11px] text-zinc-400">
              Color de la barra del navegador en mobile.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs">
            {msg && (
              <span className={msg.ok ? "text-emerald-600" : "text-red-600"}>
                {msg.text}
              </span>
            )}
          </div>
          <Button
            onClick={guardar}
            disabled={pending}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Asset row ───────────────────────────────────────────────────────────────

function AssetRow({
  kind,
  label,
  hint,
  recommended,
  currentUrl,
}: {
  kind:        AssetKind;
  label:       string;
  hint:        string;
  recommended: string;
  currentUrl:  string | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const subir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const res = await subirAsset(kind, fd);
      setMsg(
        res.ok
          ? { ok: true,  text: "Subido." }
          : { ok: false, text: res.error ?? "Error" },
      );
      // Reset the input so the same file can be re-selected if needed.
      e.target.value = "";
    });
  };

  const quitar = () => {
    if (!confirm(`¿Quitar ${label.toLowerCase()}?`)) return;
    setMsg(null);
    start(async () => {
      const res = await quitarAsset(kind);
      setMsg(
        res.ok
          ? { ok: true,  text: "Quitado." }
          : { ok: false, text: res.error ?? "Error" },
      );
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-start gap-5">
        {/* Preview */}
        <div className="w-32 h-20 shrink-0 rounded-md border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={label}
              width={128}
              height={80}
              unoptimized
              className="object-contain w-full h-full"
            />
          ) : (
            <span className="text-[10px] text-zinc-400">sin imagen</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-zinc-900">{label}</h3>
            <span className="text-[10px] text-zinc-400 shrink-0">
              {recommended}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-3">{hint}</p>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center justify-center text-sm font-medium px-3 py-1.5 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 cursor-pointer">
              {currentUrl ? "Reemplazar" : "Subir"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                className="hidden"
                onChange={subir}
                disabled={pending}
              />
            </label>
            {currentUrl && (
              <button
                type="button"
                onClick={quitar}
                disabled={pending}
                className="text-xs font-medium text-zinc-500 hover:text-red-600 px-2 py-1.5"
              >
                Quitar
              </button>
            )}
            {pending && (
              <span className="text-xs text-zinc-400">Procesando…</span>
            )}
            {msg && !pending && (
              <span
                className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}
              >
                {msg.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
