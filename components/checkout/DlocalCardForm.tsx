"use client";

import {
  forwardRef, useEffect, useImperativeHandle, useRef, useState,
} from "react";

// Minimal typings for the dlocal.js global. The SDK is loaded at runtime
// from js.dlocal.com so we don't have official types.
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    dlocal?: (apiKey: string) => any;
  }
}

const SMARTFIELDS_KEY = process.env.NEXT_PUBLIC_DLOCAL_SMARTFIELDS_KEY ?? "";
const IS_SANDBOX = (process.env.NEXT_PUBLIC_DLOCAL_ENV ?? "production") === "sandbox";
const JS_URL = IS_SANDBOX ? "https://js-sandbox.dlocal.com/" : "https://js.dlocal.com/";

export interface DlocalCardFormHandle {
  /** Tokenizes the card. Resolves with the token or rejects with a message. */
  tokenize: (cardHolderName: string) => Promise<string>;
}

function loadDlocalScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.dlocal) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${JS_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("dlocal.js no cargó")));
      return;
    }
    const script = document.createElement("script");
    script.src = JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("dlocal.js no cargó"));
    document.head.appendChild(script);
  });
}

const DlocalCardForm = forwardRef<DlocalCardFormHandle, object>(function DlocalCardForm(_props, ref) {
  const cardElRef = useRef<HTMLDivElement>(null);
  const dlocalRef = useRef<any>(null);
  const cardRef   = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!SMARTFIELDS_KEY) throw new Error("Falta NEXT_PUBLIC_DLOCAL_SMARTFIELDS_KEY.");
        await loadDlocalScript();
        if (cancelled || !window.dlocal) return;

        const dlocal = window.dlocal(SMARTFIELDS_KEY);
        dlocalRef.current = dlocal;

        const fields = dlocal.fields({ locale: "es", country: "PY" });
        const card = fields.create("card", {
          style: {
            base: {
              fontSize:    "16px",
              color:       "#22244e",
              fontFamily:  "inherit",
              "::placeholder": { color: "#22244e66" },
            },
            invalid: { color: "#dc2626" },
          },
        });
        if (cancelled) return;
        card.mount(cardElRef.current);
        cardRef.current = card;

        card.addEventListener("change", (ev: any) => {
          setError(ev?.error?.message ?? null);
        });

        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el formulario de pago.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useImperativeHandle(ref, () => ({
    tokenize: (cardHolderName: string) =>
      new Promise<string>((resolve, reject) => {
        if (!dlocalRef.current || !cardRef.current) {
          return reject(new Error("El formulario de pago no está listo."));
        }
        dlocalRef.current
          .createToken(cardRef.current, { name: cardHolderName })
          .then((result: any) => {
            if (result?.token) resolve(result.token);
            else reject(new Error("No se pudo tokenizar la tarjeta."));
          })
          .catch((result: any) => {
            reject(new Error(result?.error?.message ?? "Tarjeta inválida."));
          });
      }),
  }), []);

  return (
    <div className="space-y-2">
      <label className="text-[11px] uppercase tracking-widest text-[#22244e]/60 font-bold block">
        Datos de la tarjeta
      </label>
      <div
        ref={cardElRef}
        className="w-full min-h-[48px] px-3 py-3 rounded-md border border-[#e5e7eb] bg-white"
      />
      {!ready && !error && (
        <p className="text-xs text-[#22244e]/40">Cargando formulario seguro…</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-[#22244e]/40">
        🔒 Tus datos viajan cifrados directo a dLocal. Minirutina nunca ve el número de tu tarjeta.
      </p>
    </div>
  );
});

export default DlocalCardForm;
