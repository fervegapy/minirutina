"use client";

// Upload + preview + send flow for a pedido's factura. Self-contained
// overlay (no shadcn Dialog primitive in this codebase yet) — matches the
// hand-rolled component style already used across the admin (SpinnerSmall,
// ActionButton, etc. in PedidoDetail.tsx).
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, Upload, FileText as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enviarFacturaPedido } from "@/app/admin/(dashboard)/pedidos/[id]/actions";

const PdfPagesPreview = dynamic(
  () => import("@/components/customizer/PdfPagesPreview"),
  { ssr: false },
);

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];

export default function FacturaModal({
  pedidoId,
  email,
  onClose,
  onSent,
}: {
  pedidoId: string;
  email:    string | null;
  onClose:  () => void;
  onSent:   () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const pickFile = (f: File | null) => {
    setError(null);
    if (!f) { setFile(null); setPreviewUrl(null); return; }
    if (!ACCEPTED.includes(f.type)) {
      setError("Formato no soportado. Subí un PDF, JPG o PNG.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("El archivo pesa más de 10MB.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const enviar = async () => {
    if (!file) return;
    setSending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("factura", file);
      const res = await enviarFacturaPedido(pedidoId, fd);
      if (!res.ok) {
        setError(res.error ?? "No se pudo enviar la factura.");
        return;
      }
      onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-zinc-900">Enviar factura</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 w-7 h-7 rounded-md flex items-center justify-center hover:bg-zinc-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!email && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Este pedido no tiene email registrado — no vamos a poder enviarla.
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-200 rounded-xl py-10 flex flex-col items-center gap-2 text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">Elegí un archivo (PDF, JPG o PNG)</span>
              <span className="text-xs">Máximo 10MB</span>
            </button>
          ) : (
            <div>
              <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
                {file.type === "application/pdf" ? (
                  previewUrl && <PdfPagesPreview url={previewUrl} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl ?? ""} alt={file.name} className="w-full max-h-[50vh] object-contain" />
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 min-w-0 truncate">
                  <FileIcon className="w-3.5 h-3.5 shrink-0" />
                  {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => { pickFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                  className="text-xs text-zinc-400 hover:text-red-600 shrink-0 ml-2"
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            onClick={enviar}
            disabled={!file || !email || sending}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-10 rounded-md disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar factura al cliente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
