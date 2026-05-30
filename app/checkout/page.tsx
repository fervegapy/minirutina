"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import LocationPicker, { LocationValue } from "@/components/checkout/LocationPicker";
import { track } from "@/lib/tracking";
import { findZonaForCiudad, type DeliveryZona } from "@/lib/delivery";
import DlocalCardForm, { type DlocalCardFormHandle } from "@/components/checkout/DlocalCardForm";

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas: "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
};


const PRECIO_DELIVERY_FALLBACK = 35000;     // used only if delivery_zonas is empty
const FALLBACK_IMPRESO = 149000;
const FALLBACK_DIGITAL = 89000;

function fmt(n: number) {
  return "Gs. " + n.toLocaleString("es-PY");
}

// Checkout mode is resolved at runtime from /api/dlocal/public-config so
// the admin can switch redirect ↔ embedded from /admin/pagos without a
// redeploy. Env-var fallback for the very first render before the fetch
// resolves.
type CheckoutMode = "redirect" | "embedded";
const CHECKOUT_MODE_FALLBACK = (process.env.NEXT_PUBLIC_CHECKOUT_MODE ?? "redirect") as CheckoutMode;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Numbered step heading used across the checkout sections.
function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-6 rounded-full bg-[#22244e] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <h2 className="font-bold text-sm text-[#22244e]">{children}</h2>
    </div>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();

  const producto = params.get("producto") ?? "";
  const nombreNino = params.get("nombre_nino") ?? "";
  const colorAcento = params.get("color_acento") ?? "";
  const personalizacionRaw = params.get("personalizacion") ?? "{}";

  const [tipoEntrega, setTipoEntrega] = useState<"fisico" | "digital">("fisico");
  const [modalidad, setModalidad] = useState<"pickup" | "delivery">("pickup");
  const [nombre,   setNombre]   = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState<LocationValue>({ departamento: "", ciudad: "", barrio: "" });
  const [calle,      setCalle]      = useState("");
  const [numero,     setNumero]     = useState("");
  const [referencia, setReferencia] = useState("");
  const [zonas, setZonas] = useState<DeliveryZona[]>([]);
  const [titular, setTitular] = useState("");        // nombre del titular de la tarjeta
  const cardRef = useRef<DlocalCardFormHandle>(null);

  // Facturación (opcional, expandible).
  const [necesitaFactura, setNecesitaFactura] = useState(false);
  const [ruc,          setRuc]          = useState("");
  const [razonSocial,  setRazonSocial]   = useState("");

  // Dynamic checkout mode — fetched from /api/dlocal/public-config so the
  // admin can flip between embedded and redirect without a redeploy.
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>(CHECKOUT_MODE_FALLBACK);
  useEffect(() => {
    fetch("/api/dlocal/public-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((c: { checkout_mode?: CheckoutMode }) => {
        if (c.checkout_mode === "embedded" || c.checkout_mode === "redirect") {
          setCheckoutMode(c.checkout_mode);
        }
      })
      .catch(() => {/* keep fallback */});
  }, []);

  // Cupón de descuento
  const [cuponInput,    setCuponInput]    = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string; descuento: number } | null>(null);
  const [cuponError,    setCuponError]    = useState<string | null>(null);
  const [cuponLoading,  setCuponLoading]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [precioImpreso,   setPrecioImpreso]   = useState(FALLBACK_IMPRESO);
  const [precioDigital,   setPrecioDigital]   = useState(FALLBACK_DIGITAL);
  const [precioImpreso20, setPrecioImpreso20] = useState<number | null>(null);
  const [precioDigital20, setPrecioDigital20] = useState<number | null>(null);
  const [loadingPrecios,  setLoadingPrecios]  = useState(true);

  // For Recompensas, the customizer chose `cantidad` (10 or 20). When it's
  // 20 we use the precio_*_20 variant; for everything else (including
  // Rutinas, which has no cantidad) we use the base columns.
  const cantidadRecompensas: 10 | 20 = (() => {
    try {
      const p = JSON.parse(personalizacionRaw);
      return p?.cantidad === 20 ? 20 : 10;
    } catch {
      return 10;
    }
  })();

  useEffect(() => {
    if (!producto) return;
    supabase
      .from("precios")
      .select("precio_impreso, precio_digital, precio_impreso_20, precio_digital_20")
      .eq("producto", producto)
      .single()
      .then(({ data }) => {
        if (data) {
          setPrecioImpreso(data.precio_impreso);
          setPrecioDigital(data.precio_digital);
          setPrecioImpreso20(data.precio_impreso_20 ?? null);
          setPrecioDigital20(data.precio_digital_20 ?? null);
        }
        setLoadingPrecios(false);
      });
  }, [producto]);

  // Load delivery zones — one query, cached for the session.
  useEffect(() => {
    supabase
      .from("delivery_zonas")
      .select("*")
      .order("orden", { ascending: true })
      .then(({ data }) => {
        if (data) setZonas(data as DeliveryZona[]);
      });
  }, []);

  // Funnel: landed on /checkout (fires once).
  useEffect(() => {
    const validProducto = producto === "rutinas" || producto === "recompensas"
      ? (producto as "rutinas" | "recompensas")
      : undefined;
    track({ evento: "checkout_started", producto: validProducto });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire checkout_filled the FIRST time the user provides any contact info.
  // Captures the email/whatsapp in the event payload so we can follow up
  // with abandoned carts. Debounced via a ref-style boolean so we only
  // emit one event per session even if they keep typing.
  const [filledFired, setFilledFired] = useState(false);
  useEffect(() => {
    if (filledFired) return;
    if (!email.trim() && !whatsapp.trim()) return;
    setFilledFired(true);
    const validProducto = producto === "rutinas" || producto === "recompensas"
      ? (producto as "rutinas" | "recompensas")
      : undefined;
    track({
      evento:   "checkout_filled",
      producto: validProducto,
      data: {
        email: email.trim() || null,
        whatsapp: whatsapp.trim() || null,
        nombre_nino: nombreNino,
      },
    });
  }, [email, whatsapp, filledFired, producto, nombreNino]);

  // Resolve the correct variant price. Recompensas + cantidad 20 → _20
  // columns (if set, otherwise gracefully fall back to the base price).
  const usar20 = producto === "recompensas" && cantidadRecompensas === 20;
  const precioImpresoEfectivo = usar20 && precioImpreso20 ? precioImpreso20 : precioImpreso;
  const precioDigitalEfectivo = usar20 && precioDigital20 ? precioDigital20 : precioDigital;
  const precioBase  = tipoEntrega === "digital" ? precioDigitalEfectivo : precioImpresoEfectivo;

  // Delivery cost depends on the selected city. Falls back to the legacy
  // flat rate while zonas hasn't loaded (avoids showing 0 in the breakdown
  // while the data is in-flight).
  const zonaActual = findZonaForCiudad(location.ciudad, zonas);
  const precioEnvio = tipoEntrega === "fisico" && modalidad === "delivery"
    ? (zonaActual?.precio ?? PRECIO_DELIVERY_FALLBACK)
    : 0;

  // Coupon discount applies to the PRODUCT subtotal (shipping stays full).
  const descuentoCupon = cuponAplicado ? Math.min(cuponAplicado.descuento, precioBase) : 0;
  const precioTotal = precioBase - descuentoCupon + precioEnvio;

  const aplicarCupon = async () => {
    const codigo = cuponInput.trim();
    if (!codigo) return;
    setCuponLoading(true);
    setCuponError(null);
    try {
      const res = await fetch("/api/cupon/validar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ codigo, montoBase: precioBase }),
      });
      const json = await res.json();
      if (json.ok) {
        setCuponAplicado({ codigo: codigo.toUpperCase(), descuento: json.descuento });
        setCuponError(null);
      } else {
        setCuponAplicado(null);
        setCuponError(json.error ?? "Cupón inválido.");
      }
    } catch {
      setCuponError("No se pudo validar el cupón.");
    } finally {
      setCuponLoading(false);
    }
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setCuponInput("");
    setCuponError(null);
  };

  // Completeness — drives the disabled state of the pay button.
  const emailValido = EMAIL_RX.test(email.trim());
  // WhatsApp es obligatorio. Aceptamos varios formatos — al menos 7 dígitos.
  const whatsappValido = whatsapp.replace(/\D/g, "").length >= 7;
  const datosEntregaOk =
    !(tipoEntrega === "fisico" && modalidad === "delivery") ||
    !!(location.departamento && location.ciudad && calle.trim() && numero.trim());
  const facturaOk = !necesitaFactura || (!!ruc.trim() && !!razonSocial.trim());
  const formValido =
    !!nombre.trim() && !!apellido.trim() && emailValido && whatsappValido &&
    datosEntregaOk && facturaOk && !loadingPrecios;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !apellido.trim()) {
      setError("Ingresá tu nombre y apellido.");
      return;
    }
    if (!emailValido) {
      setError("Ingresá un email válido.");
      return;
    }
    if (!whatsappValido) {
      setError("Ingresá un número de WhatsApp válido.");
      return;
    }
    if (necesitaFactura && (!ruc.trim() || !razonSocial.trim())) {
      setError("Completá RUC y Razón Social para la factura.");
      return;
    }
    if (tipoEntrega === "fisico" && modalidad === "delivery") {
      if (!location.departamento || !location.ciudad) {
        setError("Seleccioná el departamento y la ciudad.");
        return;
      }
      if (!calle.trim() || !numero.trim()) {
        setError("Completá calle y número.");
        return;
      }
    }

    setLoading(true);
    setError("");

    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`;
    const contacto = [
      `Nombre: ${nombreCompleto}`,
      email.trim() && `Email: ${email.trim()}`,
      whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
    ]
      .filter(Boolean)
      .join(" | ");

    let direccion: string | null = null;
    if (tipoEntrega === "fisico") {
      if (modalidad === "pickup") {
        direccion = "Pickup — Villamorra, Asunción";
      } else {
        const { departamento, ciudad, barrio } = location;
        const partes = [
          `Delivery — ${departamento}, ${ciudad}${barrio ? `, ${barrio}` : ""}`,
          `Calle: ${calle.trim()} ${numero.trim()}`,
          referencia.trim() && `Referencia: ${referencia.trim()}`,
        ].filter(Boolean);
        direccion = partes.join(" · ");
      }
    }

    let personalizacion: unknown;
    try {
      personalizacion = JSON.parse(personalizacionRaw);
    } catch {
      personalizacion = {};
    }

    const esDelivery = tipoEntrega === "fisico" && modalidad === "delivery";
    const { data, error: dbError } = await supabase
      .from("pedidos")
      .insert({
        producto,
        nombre_nino: nombreNino,
        color_acento: colorAcento,
        personalizacion,
        tipo_entrega: tipoEntrega,
        contacto,
        direccion,
        estado: "pendiente",
        // Snapshot del costo y dirección de envío — para que reportes
        // históricos no cambien si después cambias precios de zona.
        costo_envio:      esDelivery ? precioEnvio : 0,
        envio_zona:       esDelivery ? (zonaActual?.nombre ?? null) : null,
        envio_calle:      esDelivery ? calle.trim() : null,
        envio_numero:     esDelivery ? numero.trim() : null,
        envio_referencia: esDelivery ? (referencia.trim() || null) : null,
        // Datos de facturación (opcionales).
        ruc:              necesitaFactura ? ruc.trim() : null,
        razon_social:     necesitaFactura ? razonSocial.trim() : null,
      })
      .select("id")
      .single();

    if (dbError) {
      setLoading(false);
      setError("Hubo un error al guardar tu pedido. Intentá de nuevo.");
      return;
    }

    const validProducto = producto === "rutinas" || producto === "recompensas"
      ? (producto as "rutinas" | "recompensas")
      : undefined;
    track({
      evento:   "pedido_created",
      producto: validProducto,
      pedidoId: data.id,
    });

    // NOTE: the confirmation email is NOT sent here. It only goes out
    // once dLocal confirms the payment (PAID) via /api/dlocal/webhook,
    // so customers don't get a "thanks" email for an unpaid order.

    try {
      if (checkoutMode === "embedded") {
        // SmartFields: tokenize client-side, charge server-side. Customer
        // never leaves the site (unless 3DS).
        const token = await cardRef.current!.tokenize(titular.trim() || nombreNino);
        const res = await fetch("/api/checkout/pay-with-token", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            pedidoId:    data.id,
            token,
            productoPyg: precioBase,
            envioPyg:    precioEnvio,
            cuponCodigo: cuponAplicado?.codigo ?? null,
            email:       email.trim() || null,
            nombre:      `${nombre.trim()} ${apellido.trim()}`,
            nombreNino, producto, tipoEntrega,
            modalidad:   tipoEntrega === "fisico" ? modalidad : undefined,
          }),
        });
        const json = await res.json();
        if (json.ok && json.status === "PAID") {
          const p = new URLSearchParams({ nombre_nino: nombreNino, tipo_entrega: tipoEntrega, pedido_id: data.id, pagado: "1" });
          router.push(`/confirmacion?${p.toString()}`);
          return;
        }
        if (json.ok && json.status === "PENDING" && json.redirectUrl) {
          window.location.href = json.redirectUrl;
          return;
        }
        throw new Error(json.error ?? "No se pudo procesar el pago.");
      }

      // Redirect flow: create a dLocal hosted-checkout session and send the
      // browser there. Proven working; the default mode.
      const res = await fetch("/api/checkout/create-session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pedidoId:    data.id,
          productoPyg: precioBase,
          envioPyg:    precioEnvio,
          cuponCodigo: cuponAplicado?.codigo ?? null,
          email:       email.trim() || null,
          nombreComprador: `${nombre.trim()} ${apellido.trim()}`,
          nombreNino, producto, tipoEntrega,
          modalidad:   tipoEntrega === "fisico" ? modalidad : undefined,
        }),
      });
      const json = await res.json();
      if (json.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error(json.error ?? "No se pudo iniciar el pago.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf6e7] px-4 py-10 pb-44">
      <div className="max-w-md md:max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-[#22244e] mb-2 text-center">
          Confirmá tu pedido
        </h1>
        <p className="text-sm text-[#22244e]/60 text-center mb-8">
          Estás a un paso de tener tu tablero
        </p>

        {params.get("cancelado") === "1" && (
          <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Cancelaste el pago. Tu pedido sigue acá — completá el formulario abajo
            para reintentar.
          </div>
        )}

        {/* Order summary — contexto del pedido (no es un paso accionable) */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 mb-5">
          <p className="text-[11px] uppercase tracking-widest text-[#22244e]/40 font-bold mb-4">
            Tu pedido
          </p>

          {/* Header con miniatura del producto */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e5e7eb]">
            <div
              className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#e5e7eb] relative"
              style={{ backgroundColor: colorAcento + "22" }}
            >
              {(producto === "rutinas" || producto === "recompensas") && (
                <Image
                  src={`/productos/${producto}.png`}
                  alt={NOMBRE_PRODUCTO[producto] ?? producto}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#22244e] truncate">
                {NOMBRE_PRODUCTO[producto] ?? producto}
              </p>
              <p className="text-xs text-[#22244e]/60 truncate">Para {nombreNino}</p>
            </div>
            <div
              className="w-5 h-5 rounded-full border border-[#e5e7eb] shrink-0"
              style={{ backgroundColor: colorAcento }}
              title="Color elegido"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-[#22244e]/70">Precio del tablero</span>
            {loadingPrecios ? (
              <span className="w-20 h-4 bg-[#e5e7eb] rounded animate-pulse" />
            ) : (
              <span className="font-bold text-[#22244e]">{fmt(precioImpresoEfectivo)}</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipo de entrega */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
            <StepTitle n={1}>Elegí cómo querés recibirlo</StepTitle>

            {tipoEntrega === "fisico" ? (
              <>
                <div className="rounded-xl border-2 border-[#22244e] bg-[#336aea]/10 p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">📦</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold text-sm text-[#22244e]">Impreso y enviado</p>
                      <p className="font-bold text-sm text-[#22244e] shrink-0">{loadingPrecios ? "—" : fmt(precioImpreso)}</p>
                    </div>
                    <p className="text-xs text-[#22244e]/60 mt-0.5">
                      Imprimimos en alta calidad y lo entregamos listo para colgar.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTipoEntrega("digital")}
                  className="mt-3 text-xs text-[#22244e]/40 hover:text-[#22244e] underline underline-offset-2 w-full text-center transition-colors"
                >
                  ¿Preferís solo el archivo digital para imprimir vos?
                </button>
              </>
            ) : (
              <>
                <div className="rounded-xl border-2 border-[#a8c8e8] bg-[#a8c8e8]/10 p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">📲</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold text-sm text-[#22244e]">Archivo digital</p>
                      <p className="font-bold text-sm text-[#22244e] shrink-0">{loadingPrecios ? "—" : fmt(precioDigital)}</p>
                    </div>
                    <p className="text-xs text-[#22244e]/60 mt-0.5">
                      Recibís el PDF listo para imprimir donde quieras.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setTipoEntrega("fisico"); setModalidad("pickup"); }}
                  className="mt-3 text-xs text-[#22244e]/40 hover:text-[#22244e] underline underline-offset-2 w-full text-center transition-colors"
                >
                  ← Volver a impreso y enviado
                </button>
              </>
            )}
          </div>

          {/* Modalidad de entrega (solo físico) */}
          {tipoEntrega === "fisico" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
              <StepTitle n={2}>¿Pickup o delivery?</StepTitle>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalidad("pickup")}
                  className={`rounded-xl p-4 border-2 text-left transition-all ${
                    modalidad === "pickup"
                      ? "border-[#22244e] bg-[#336aea]/10"
                      : "border-[#e5e7eb] hover:border-[#22244e]/30"
                  }`}
                >
                  <div className="text-xl mb-1">🏠</div>
                  <div className="font-bold text-sm text-[#22244e]">Pickup</div>
                  <div className="text-xs font-bold text-[#a8c5a0] mt-0.5">Gs. 0</div>
                  <div className="text-xs text-[#22244e]/50 mt-1 leading-relaxed">
                    Retirás en Villamorra, Asunción. Dirección exacta por WhatsApp.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setModalidad("delivery")}
                  className={`rounded-xl p-4 border-2 text-left transition-all ${
                    modalidad === "delivery"
                      ? "border-[#22244e] bg-[#336aea]/10"
                      : "border-[#e5e7eb] hover:border-[#22244e]/30"
                  }`}
                >
                  <div className="text-xl mb-1">🛵</div>
                  <div className="font-bold text-sm text-[#22244e]">Delivery</div>
                  <div className="text-xs font-bold text-[#22244e]/70 mt-0.5">
                    {location.ciudad && zonaActual
                      ? fmt(zonaActual.precio)
                      : "desde " + fmt(zonas[0]?.precio ?? PRECIO_DELIVERY_FALLBACK)}
                  </div>
                  <div className="text-xs text-[#22244e]/50 mt-1 leading-relaxed">
                    A tu puerta. El precio se ajusta según tu ciudad.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Datos de entrega (solo delivery) */}
          {tipoEntrega === "fisico" && modalidad === "delivery" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
              <StepTitle n={3}>Decinos a dónde te lo llevamos</StepTitle>
              <LocationPicker onChange={setLocation} />

              {/* Calle + Número + Referencia. Aparecen después de elegir
                  ciudad para que la cascada visual tenga sentido. */}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  className="col-span-2"
                  placeholder="Calle"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                />
                <Input
                  placeholder="Número"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>
              <Input
                placeholder="Referencia (opcional — ej. portón verde, casa esquinera)"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />

              {/* Aviso de zona detectada */}
              {location.ciudad && zonaActual && (
                <div className="bg-[#a8c5a0]/15 border border-[#a8c5a0]/40 rounded-lg px-3 py-2 text-xs text-[#22244e]/80">
                  Zona: <strong>{zonaActual.nombre}</strong> · Envío {fmt(zonaActual.precio)}
                </div>
              )}
            </div>
          )}

          {/* Tus datos */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
            <StepTitle n={tipoEntrega === "fisico" && modalidad === "delivery" ? 4 : 3}>
              Dejanos tus datos
            </StepTitle>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="given-name"
              />
              <Input
                placeholder="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                autoComplete="family-name"
              />
            </div>
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              placeholder="WhatsApp (ej: +595 981 123456)"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              autoComplete="tel"
            />
            <p className="text-xs text-[#22244e]/50">
              Te contactamos por WhatsApp para confirmar y coordinar tu pedido.
            </p>

            {/* Facturación — opcional, expandible */}
            <div className="pt-3 border-t border-[#e5e7eb]">
              <label className="flex items-center gap-2 text-sm text-[#22244e]/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={necesitaFactura}
                  onChange={(e) => setNecesitaFactura(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e5e7eb] text-[#336aea] focus:ring-[#336aea]/30"
                />
                ¿Necesitás factura?
              </label>
              {necesitaFactura && (
                <div className="grid grid-cols-1 gap-2 mt-3">
                  <Input
                    placeholder="RUC"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                  />
                  <Input
                    placeholder="Razón social"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cupón de descuento — opcional, sin número de paso */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-[#22244e]/40 font-bold">
              ¿Tenés un cupón? <span className="text-[#22244e]/30 normal-case">· opcional</span>
            </p>
            {cuponAplicado ? (
              <div className="flex items-center justify-between bg-[#a8c5a0]/15 border border-[#a8c5a0]/40 rounded-lg px-3 py-2.5">
                <div className="text-sm">
                  <span className="font-bold text-[#22244e]">{cuponAplicado.codigo}</span>
                  <span className="text-[#22244e]/60"> · −{fmt(descuentoCupon)}</span>
                </div>
                <button
                  type="button"
                  onClick={quitarCupon}
                  className="text-xs text-[#22244e]/50 hover:text-red-600 underline underline-offset-2"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Código de cupón"
                    value={cuponInput}
                    onChange={(e) => setCuponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aplicarCupon(); } }}
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    onClick={aplicarCupon}
                    disabled={!cuponInput.trim() || cuponLoading}
                    variant="outline"
                    className="border-[#22244e] text-[#22244e] h-10 px-5 shrink-0"
                  >
                    {cuponLoading ? "..." : "Aplicar"}
                  </Button>
                </div>
                {cuponError && <p className="text-xs text-red-600">{cuponError}</p>}
              </>
            )}
          </div>

          {/* Pago con tarjeta (SmartFields embebido) — solo en modo embedded */}
          {checkoutMode === "embedded" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
              <StepTitle
                n={tipoEntrega === "fisico" && modalidad === "delivery" ? 5 : 4}
              >
                Pagá con tu tarjeta
              </StepTitle>
              <Input
                placeholder="Nombre del titular de la tarjeta"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                autoComplete="cc-name"
              />
              <DlocalCardForm ref={cardRef} />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Sticky summary bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] shadow-[0_-4px_24px_rgba(0,0,0,0.07)] px-4 pt-4 pb-6 z-50">
            <div className="max-w-md mx-auto space-y-1.5">
              <div className="flex justify-between text-sm text-[#22244e]/60">
                <span>Tablero {tipoEntrega === "fisico" ? "Impreso" : "Digital"}</span>
                <span>{fmt(precioBase)}</span>
              </div>
              {descuentoCupon > 0 && (
                <div className="flex justify-between text-sm text-[#a8c5a0] font-semibold">
                  <span>Cupón {cuponAplicado?.codigo}</span>
                  <span>−{fmt(descuentoCupon)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#22244e]/60">
                <span>Envío ({tipoEntrega === "fisico" ? (modalidad === "delivery" ? "Delivery" : "Pickup") : "Digital"})</span>
                <span>{precioEnvio === 0 ? "Gs. 0" : fmt(precioEnvio)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#22244e] pt-2 border-t border-[#e5e7eb]">
                <span>Total</span>
                {loadingPrecios ? (
                  <span className="w-24 h-5 bg-[#e5e7eb] rounded animate-pulse" />
                ) : (
                  <span className="text-lg">{fmt(precioTotal)}</span>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || !formValido}
                className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl text-base shadow-none border-0 mt-3 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Procesando..."
                  : checkoutMode === "embedded"
                  ? `Pagar ${loadingPrecios ? "" : fmt(precioTotal)}`
                  : `Ir a pagar ${loadingPrecios ? "" : fmt(precioTotal)}`}
              </Button>
              {!formValido && !loading && (
                <p className="text-[11px] text-[#22244e]/40 text-center mt-1.5">
                  {!nombre.trim() || !apellido.trim()
                    ? "Completá tu nombre y apellido"
                    : !emailValido
                    ? "Ingresá un email válido"
                    : !whatsappValido
                    ? "Ingresá tu número de WhatsApp"
                    : !datosEntregaOk
                    ? "Completá la dirección de entrega"
                    : !facturaOk
                    ? "Completá RUC y razón social"
                    : "Completá los datos para continuar"}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
