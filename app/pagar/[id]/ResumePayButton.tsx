"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  pedidoId:        string;
  productoPyg:     number;
  envioPyg:        number;
  cuponCodigo:     string | null;
  email:           string | null;
  nombreComprador: string | null;
  nombreNino:      string;
  producto:        string;
  tipoEntrega:     "fisico" | "digital";
  modalidad:       "pickup" | "delivery" | null;
  total:           number;
}

const fmt = (n: number) => "Gs. " + Math.round(n).toLocaleString("es-PY");

export default function ResumePayButton(props: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pagar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/create-session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pedidoId:        props.pedidoId,
          productoPyg:     props.productoPyg,
          envioPyg:        props.envioPyg,
          cuponCodigo:     props.cuponCodigo,
          email:           props.email,
          nombreComprador: props.nombreComprador,
          nombreNino:      props.nombreNino,
          producto:        props.producto,
          tipoEntrega:     props.tipoEntrega,
          modalidad:       props.modalidad,
        }),
      });
      const json = await res.json();
      if (json.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error(json.error ?? "No se pudo iniciar el pago.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar el pago.");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={pagar}
        disabled={loading}
        className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl shadow-none border-0 text-base h-12"
      >
        {loading ? "Redirigiendo…" : `Pagar ${fmt(props.total)}`}
      </Button>
      {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}
    </div>
  );
}
