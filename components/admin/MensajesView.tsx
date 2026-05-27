"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, Check, Reply } from "lucide-react";
import {
  marcarLeido, marcarRespondido, eliminarMensaje,
} from "@/app/admin/(dashboard)/mensajes/actions";

export interface Mensaje {
  id:          string;
  nombre:      string;
  email:       string;
  mensaje:     string;
  leido:       boolean;
  respondido:  boolean;
  created_at:  string;
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

export default function MensajesView({ mensajes }: { mensajes: Mensaje[] }) {
  if (mensajes.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="py-16 text-center text-sm text-zinc-500">
          Todavía no hay mensajes.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {mensajes.map((m) => <MensajeRow key={m.id} mensaje={m} />)}
    </div>
  );
}

function MensajeRow({ mensaje }: { mensaje: Mensaje }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(!mensaje.leido);

  const toggleExpand = () => {
    if (!expanded && !mensaje.leido) {
      // Mark as read when opening for the first time.
      startTransition(async () => {
        await marcarLeido(mensaje.id, true);
        router.refresh();
      });
    }
    setExpanded(!expanded);
  };

  const toggleRespondido = () => {
    startTransition(async () => {
      await marcarRespondido(mensaje.id, !mensaje.respondido);
      router.refresh();
    });
  };

  const eliminar = () => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    startTransition(async () => {
      await eliminarMensaje(mensaje.id);
      router.refresh();
    });
  };

  return (
    <Card className={`bg-white ${!mensaje.leido ? "border-l-4 border-l-[#336aea]" : ""}`}>
      <CardContent className="p-4">
        <button
          type="button"
          onClick={toggleExpand}
          className="w-full text-left flex items-start justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-zinc-900 truncate">{mensaje.nombre}</p>
              {!mensaje.leido && (
                <Badge className="bg-[#336aea] text-white text-[10px] h-4 px-1.5 border-0">
                  Nuevo
                </Badge>
              )}
              {mensaje.respondido && (
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] h-4 px-1.5 border border-emerald-200">
                  Respondido
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {mensaje.email} · {fmtFecha(mensaje.created_at)}
            </p>
            {!expanded && (
              <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                {mensaje.mensaje}
              </p>
            )}
          </div>
        </button>

        {expanded && (
          <div className="mt-4 pt-3 border-t border-zinc-100 space-y-3">
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
              {mensaje.mensaje}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={`mailto:${mensaje.email}?subject=Re: tu mensaje a Minirutina`}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Responder por email
              </a>
              <Button
                onClick={toggleRespondido}
                disabled={pending}
                variant="outline"
                className="text-xs h-8 border-zinc-200"
              >
                {mensaje.respondido ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Marcar pendiente
                  </>
                ) : (
                  <>
                    <Reply className="w-3.5 h-3.5 mr-1.5" />
                    Marcar respondido
                  </>
                )}
              </Button>
              <Button
                onClick={eliminar}
                disabled={pending}
                variant="outline"
                className="ml-auto text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
