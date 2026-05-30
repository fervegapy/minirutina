"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { guardarDlocalConfig } from "@/app/admin/(dashboard)/pagos/actions";
import type { DlocalConfigRow, Ambiente, CheckoutMode } from "@/lib/dlocal-config";

export default function PagosView({ cfg }: { cfg: DlocalConfigRow | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [ambiente,     setAmbiente]     = useState<Ambiente>(cfg?.ambiente ?? "sandbox");
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>(cfg?.checkout_mode ?? "redirect");
  const [sbxApi,    setSbxApi]    = useState(cfg?.sandbox_api_key ?? "");
  const [sbxSecret, setSbxSecret] = useState(cfg?.sandbox_secret_key ?? "");
  const [sbxSf,     setSbxSf]     = useState(cfg?.sandbox_smartfields_key ?? "");
  const [prodApi,    setProdApi]    = useState(cfg?.prod_api_key ?? "");
  const [prodSecret, setProdSecret] = useState(cfg?.prod_secret_key ?? "");
  const [prodSf,     setProdSf]     = useState(cfg?.prod_smartfields_key ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const sandboxCompleta = !!(sbxApi.trim() && sbxSecret.trim() && sbxSf.trim());
  const prodCompleta    = !!(prodApi.trim() && prodSecret.trim() && prodSf.trim());
  const activoOk = ambiente === "sandbox" ? sandboxCompleta : prodCompleta;

  const guardar = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await guardarDlocalConfig({
        ambiente, checkout_mode: checkoutMode,
        sandbox_api_key: sbxApi, sandbox_secret_key: sbxSecret, sandbox_smartfields_key: sbxSf,
        prod_api_key: prodApi,   prod_secret_key: prodSecret,   prod_smartfields_key: prodSf,
      });
      if (r.ok) { setMsg({ ok: true, text: "Cambios aplicados al instante." }); router.refresh(); }
      else      { setMsg({ ok: false, text: r.error ?? "Error" }); }
    });
  };

  return (
    <div className="space-y-5">
      {/* Ambiente + modo */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Ambiente activo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <ModeButton
              active={ambiente === "sandbox"}
              onClick={() => setAmbiente("sandbox")}
              label="Sandbox"
              hint="Pruebas — tarjetas de test, no se cobra"
            />
            <ModeButton
              active={ambiente === "production"}
              onClick={() => setAmbiente("production")}
              label="Producción"
              hint="Cobros reales con tarjeta"
            />
          </div>

          {!activoOk && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Faltan las claves de <strong>{ambiente === "sandbox" ? "sandbox" : "producción"}</strong>.
                Completalas abajo para que el checkout funcione.
              </span>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mb-2">
              Modo del checkout
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ModeButton
                active={checkoutMode === "redirect"}
                onClick={() => setCheckoutMode("redirect")}
                label="Redirect"
                hint="Cliente paga en la página hosteada de dLocal"
              />
              <ModeButton
                active={checkoutMode === "embedded"}
                onClick={() => setCheckoutMode("embedded")}
                label="Embedded · SmartFields"
                hint="Form de tarjeta dentro de minirutina.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claves Sandbox */}
      <KeysCard
        title="Sandbox"
        badgeActive={ambiente === "sandbox"}
        apiKey={sbxApi}   setApiKey={setSbxApi}
        secret={sbxSecret} setSecret={setSbxSecret}
        smart={sbxSf}     setSmart={setSbxSf}
      />

      {/* Claves Producción */}
      <KeysCard
        title="Producción"
        badgeActive={ambiente === "production"}
        apiKey={prodApi}   setApiKey={setProdApi}
        secret={prodSecret} setSecret={setProdSecret}
        smart={prodSf}     setSmart={setProdSf}
      />

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <Button
          onClick={guardar}
          disabled={pending}
          className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm h-9 rounded-md"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        {msg && (
          <span className={msg.ok ? "text-xs text-emerald-600" : "text-xs text-red-600"}>
            {msg.text}
          </span>
        )}
      </div>

      <p className="text-[11px] text-zinc-400">
        Los cambios se aplican al instante a todos los visitantes del sitio (el
        checkout consulta esta config en cada request). Las claves nunca se
        exponen al browser — solo la SmartFields key del ambiente activo, que
        es de uso público por diseño.
      </p>
    </div>
  );
}

function ModeButton({
  active, onClick, label, hint,
}: {
  active: boolean; onClick: () => void; label: string; hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg p-3 border-2 text-left transition-all ${
        active
          ? "border-zinc-900 bg-zinc-900/5"
          : "border-zinc-200 hover:border-zinc-400"
      }`}
    >
      <div className="text-sm font-bold text-zinc-900">{label}</div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{hint}</div>
    </button>
  );
}

function KeysCard({
  title, badgeActive,
  apiKey, setApiKey,
  secret, setSecret,
  smart,  setSmart,
}: {
  title: string;
  badgeActive: boolean;
  apiKey: string; setApiKey: (s: string) => void;
  secret: string; setSecret: (s: string) => void;
  smart:  string; setSmart:  (s: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {title}
            {badgeActive && (
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] h-5 px-2">
                Activo
              </Badge>
            )}
          </CardTitle>
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {show ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <KeyField label="API Key"        value={apiKey} onChange={setApiKey} reveal={show} />
        <KeyField label="Secret Key"     value={secret} onChange={setSecret} reveal={show} />
        <KeyField label="SmartFields Key" value={smart}  onChange={setSmart}  reveal={show} />
      </CardContent>
    </Card>
  );
}

function KeyField({
  label, value, onChange, reveal,
}: {
  label: string; value: string; onChange: (s: string) => void; reveal: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium block mb-1">
        {label}
      </label>
      <Input
        type={reveal ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-mono"
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
