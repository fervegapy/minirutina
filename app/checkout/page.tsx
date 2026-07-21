"use client";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Plus, X, Package, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import type { LocationValue } from "@/components/checkout/LocationPicker";
import type { MapLocationValue } from "@/components/checkout/MapLocationPicker";
import { track, identify } from "@/lib/tracking";

// Leaflet needs the DOM at module load — client-only, no SSR.
const MapLocationPicker = dynamic(
  () => import("@/components/checkout/MapLocationPicker"),
  { ssr: false, loading: () => (
    <div className="w-full h-56 rounded-xl border border-[#e5e7eb] bg-[#eef0f2] flex items-center justify-center text-xs text-[#22244e]/40">
      Cargando mapa…
    </div>
  ) },
);
import { findZonaForCiudad, type DeliveryZona } from "@/lib/delivery";
import DlocalCardForm, { type DlocalCardFormHandle } from "@/components/checkout/DlocalCardForm";
import { useCarrito, type CartItem, type Formato, type Producto } from "@/lib/carrito";

const NOMBRE_PRODUCTO: Record<string, string> = {
  rutinas:     "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
};

const PRECIO_DELIVERY_FALLBACK = 35000;
const FALLBACK_IMPRESO = 149000;
const FALLBACK_DIGITAL = 89000;

function fmt(n: number) {
  return "Gs. " + n.toLocaleString("es-PY");
}

type CheckoutMode = "redirect" | "embedded";
const CHECKOUT_MODE_FALLBACK = (process.env.NEXT_PUBLIC_CHECKOUT_MODE ?? "redirect") as CheckoutMode;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// ─── Pricing ─────────────────────────────────────────────────────────────────
// Precios row from Supabase. We fetch once for BOTH products and resolve
// each cart item's price client-side.
interface PrecioRow {
  producto:           string;
  precio_impreso:     number;
  precio_digital:     number;
  precio_impreso_20:  number | null;
  precio_digital_20:  number | null;
}

function getItemPrice(item: CartItem, prices: Record<string, PrecioRow>): number {
  const row = prices[item.producto];
  if (!row) {
    // Fallback if precios row not loaded — keeps the UI usable even if DB is slow.
    return item.formato === "digital" ? FALLBACK_DIGITAL : FALLBACK_IMPRESO;
  }
  const usar20 =
    item.producto === "recompensas" &&
    (item.personalizacion as { cantidad?: number } | null)?.cantidad === 20;
  if (item.formato === "digital") {
    return (usar20 && row.precio_digital_20) || row.precio_digital;
  }
  return (usar20 && row.precio_impreso_20) || row.precio_impreso;
}

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { items, removeItem, setFormato, clear } = useCarrito();

  // Form state — order-level (shared by all items)
  const [modalidad, setModalidad] = useState<"pickup" | "delivery">("pickup");
  const [nombre,    setNombre]    = useState("");
  const [apellido,  setApellido]  = useState("");
  const [email,     setEmail]     = useState("");
  const [whatsapp,  setWhatsapp]  = useState("");
  const [location,  setLocation]  = useState<LocationValue>({ departamento: "", ciudad: "", barrio: "" });
  const [calle,      setCalle]      = useState("");
  const [numero,     setNumero]     = useState("");
  const [referencia, setReferencia] = useState("");
  const [coords,     setCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [zonas, setZonas] = useState<DeliveryZona[]>([]);

  // The map picker auto-fills ciudad/depto/calle/numero (all editable) and
  // gives us a precise pin we attach to the order's address.
  const handleMapChange = (v: MapLocationValue) => {
    setLocation({ departamento: v.departamento, ciudad: v.ciudad, barrio: v.barrio });
    setCalle(v.calle);
    setNumero(v.numero);
    setCoords(v.lat != null && v.lng != null ? { lat: v.lat, lng: v.lng } : null);
  };
  const [titular, setTitular] = useState("");
  const cardRef = useRef<DlocalCardFormHandle>(null);

  // Facturación
  const [necesitaFactura, setNecesitaFactura] = useState(false);
  const [ruc,         setRuc]         = useState("");
  const [razonSocial, setRazonSocial] = useState("");

  // Checkout mode (dynamic from /api/dlocal/public-config)
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>(CHECKOUT_MODE_FALLBACK);
  useEffect(() => {
    fetch("/api/dlocal/public-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((c: { checkout_mode?: CheckoutMode }) => {
        if (c.checkout_mode === "embedded" || c.checkout_mode === "redirect") {
          setCheckoutMode(c.checkout_mode);
        }
      })
      .catch(() => {});
  }, []);

  // Cupón
  const [cuponInput,    setCuponInput]    = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string; descuento: number } | null>(null);
  const [cuponError,    setCuponError]    = useState<string | null>(null);
  const [cuponLoading,  setCuponLoading]  = useState(false);

  // Loading / error
  const [loading, setLoading] = useState(false);
  // True only during the final hop to the external payment gateway — the
  // browser is fetching an off-site page, which can take several seconds on
  // a slow connection while THIS page just sits there. A distinct message +
  // spinner here keeps that stretch from reading as a frozen/broken screen.
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  // Add-another panel toggle
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Prices for BOTH products (we don't know which the cart has until items load)
  const [pricesMap, setPricesMap] = useState<Record<string, PrecioRow>>({});
  const [loadingPrecios, setLoadingPrecios] = useState(true);

  useEffect(() => {
    supabase
      .from("precios")
      .select("producto, precio_impreso, precio_digital, precio_impreso_20, precio_digital_20")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, PrecioRow> = {};
          for (const row of data as PrecioRow[]) map[row.producto] = row;
          setPricesMap(map);
        }
        setLoadingPrecios(false);
      });
  }, []);

  useEffect(() => {
    supabase
      .from("delivery_zonas")
      .select("*")
      .order("orden", { ascending: true })
      .then(({ data }) => {
        if (data) setZonas(data as DeliveryZona[]);
      });
  }, []);

  // Funnel — once per page load
  useEffect(() => {
    if (items.length > 0) {
      track({
        evento: "cart_viewed",
        data: {
          items_count: items.length,
          productos:   items.map((it) => it.producto),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // checkout_filled — first time the user types contact info
  const [filledFired, setFilledFired] = useState(false);
  useEffect(() => {
    if (filledFired) return;
    if (!email.trim() && !whatsapp.trim()) return;
    setFilledFired(true);
    track({
      evento: "checkout_filled",
      data: { email: email.trim() || null, whatsapp: whatsapp.trim() || null },
    });
  }, [email, whatsapp, filledFired]);

  // ─── Derived ────────────────────────────────────────────────────────────
  const itemsConPrecio = useMemo(
    () => items.map((it) => ({ ...it, precio: getItemPrice(it, pricesMap) })),
    [items, pricesMap],
  );

  const anyFisico = items.some((it) => it.formato === "fisico");

  const subtotal = itemsConPrecio.reduce((acc, it) => acc + it.precio, 0);

  const zonaActual = findZonaForCiudad(location.ciudad, zonas);
  const precioEnvio = anyFisico && modalidad === "delivery"
    ? (zonaActual?.precio ?? PRECIO_DELIVERY_FALLBACK)
    : 0;

  const descuentoCupon = cuponAplicado ? Math.min(cuponAplicado.descuento, subtotal) : 0;
  const total = subtotal - descuentoCupon + precioEnvio;

  // ─── Coupon ─────────────────────────────────────────────────────────────
  const aplicarCupon = async () => {
    const codigo = cuponInput.trim();
    if (!codigo) return;
    setCuponLoading(true);
    setCuponError(null);
    try {
      const res = await fetch("/api/cupon/validar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ codigo, montoBase: subtotal }),
      });
      const json = await res.json();
      if (json.ok) {
        setCuponAplicado({ codigo: codigo.toUpperCase(), descuento: json.descuento });
        track({
          evento: "cupon_aplicado",
          data:   { codigo: codigo.toUpperCase(), descuento: json.descuento, monto_base: subtotal },
        });
      } else {
        setCuponAplicado(null);
        setCuponError(json.error ?? "Cupón inválido.");
        track({
          evento: "cupon_invalido",
          data:   { codigo: codigo.toUpperCase(), motivo: json.error ?? "unknown" },
        });
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

  // ─── Validation ──────────────────────────────────────────────────────────
  const emailValido = EMAIL_RX.test(email.trim());
  const whatsappValido = whatsapp.replace(/\D/g, "").length >= 7;
  const datosEntregaOk =
    !(anyFisico && modalidad === "delivery") ||
    !!(location.departamento && location.ciudad && calle.trim() && numero.trim());
  const facturaOk = !necesitaFactura || (!!ruc.trim() && !!razonSocial.trim());
  const formValido =
    items.length > 0 &&
    !!nombre.trim() && !!apellido.trim() && emailValido && whatsappValido &&
    datosEntregaOk && facturaOk && !loadingPrecios;

  // Navigates to an external URL (the payment gateway) after giving React a
  // chance to paint the "Redirigiendo..." button state. Without the rAF
  // hop, `setRedirecting(true)` and `window.location.href = url` land in the
  // same tick and the browser never paints the update before unloading the
  // page — on a slow connection the screen just sits there looking frozen
  // for however long the off-site page takes to start loading.
  const redirectToGateway = (url: string) => {
    setRedirecting(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.location.href = url;
    }));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }
    if (!nombre.trim() || !apellido.trim()) return setError("Ingresá tu nombre y apellido.");
    if (!emailValido) return setError("Ingresá un email válido.");
    if (!whatsappValido) return setError("Ingresá un número de WhatsApp válido.");
    if (necesitaFactura && (!ruc.trim() || !razonSocial.trim()))
      return setError("Completá RUC y Razón Social para la factura.");
    if (anyFisico && modalidad === "delivery") {
      if (!location.departamento || !location.ciudad) return setError("Seleccioná departamento y ciudad.");
      if (!calle.trim() || !numero.trim()) return setError("Completá calle y número.");
    }

    setLoading(true);
    setError("");

    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`;
    const contacto = [
      `Nombre: ${nombreCompleto}`,
      email.trim() && `Email: ${email.trim()}`,
      whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
    ].filter(Boolean).join(" | ");

    let direccion: string | null = null;
    if (anyFisico) {
      if (modalidad === "pickup") {
        direccion = "Pickup — Asunción";
      } else {
        const { departamento, ciudad, barrio } = location;
        const partes = [
          `Delivery — ${departamento}, ${ciudad}${barrio ? `, ${barrio}` : ""}`,
          `Calle: ${calle.trim()} ${numero.trim()}`,
          referencia.trim() && `Referencia: ${referencia.trim()}`,
          // Precise pin from the map — a Google Maps link the courier can open.
          coords && `Ubicación: https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
        ].filter(Boolean);
        direccion = partes.join(" · ");
      }
    }

    const esDelivery = anyFisico && modalidad === "delivery";

    // 1. Insert the order (pedido) — legacy columns get the FIRST item's
    //    values so admin / PDF code that still reads pedido.producto keeps
    //    working as a fallback.
    const first = itemsConPrecio[0]!;
    const { data: pedidoData, error: dbError } = await supabase
      .from("pedidos")
      .insert({
        producto:        first.producto,
        nombre_nino:     first.nombre_nino,
        color_acento:    first.color_acento,
        personalizacion: first.personalizacion,
        tipo_entrega:    first.formato,
        contacto,
        direccion,
        estado:          "pendiente",
        costo_envio:      esDelivery ? precioEnvio : 0,
        envio_zona:       esDelivery ? (zonaActual?.nombre ?? null) : null,
        envio_calle:      esDelivery ? calle.trim() : null,
        envio_numero:     esDelivery ? numero.trim() : null,
        envio_referencia: esDelivery ? (referencia.trim() || null) : null,
        ruc:              necesitaFactura ? ruc.trim() : null,
        razon_social:     necesitaFactura ? razonSocial.trim() : null,
      })
      .select("id")
      .single();

    if (dbError || !pedidoData) {
      setLoading(false);
      setError("Hubo un error al guardar tu pedido. Intentá de nuevo.");
      return;
    }

    // 2. Insert all items.
    const itemsPayload = itemsConPrecio.map((it, idx) => ({
      pedido_id:       pedidoData.id,
      producto:        it.producto,
      nombre_nino:     it.nombre_nino,
      color_acento:    it.color_acento,
      personalizacion: it.personalizacion,
      tipo_entrega:    it.formato,
      precio_pyg:      it.precio,
      orden:           idx,
    }));
    const { error: itemsErr } = await supabase.from("pedido_items").insert(itemsPayload);
    if (itemsErr) {
      setLoading(false);
      setError("Hubo un error al guardar los items del pedido.");
      return;
    }

    track({
      evento:   "pedido_created",
      pedidoId: pedidoData.id,
      data: {
        items_count:     items.length,
        total_pyg:       total,
        subtotal_pyg:    subtotal,
        envio_pyg:       precioEnvio,
        cupon_codigo:    cuponAplicado?.codigo ?? null,
        cupon_descuento: descuentoCupon || null,
      },
    });

    identify(email.trim(), {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      whatsapp: whatsapp.trim() || null,
    });

    track({
      evento:   "pago_iniciado",
      pedidoId: pedidoData.id,
      data:     { modo: checkoutMode, total_pyg: total, items_count: items.length },
    });

    // Description for dLocal — single item: "Tablero X — Mati"; multi: "N tableros"
    const descripcion = items.length === 1
      ? `${NOMBRE_PRODUCTO[first.producto] ?? first.producto} — ${first.nombre_nino}`
      : `${items.length} tableros (${itemsConPrecio.map((it) => it.nombre_nino).join(", ")})`;

    try {
      if (checkoutMode === "embedded") {
        const token = await cardRef.current!.tokenize(titular.trim() || nombreCompleto);
        const res = await fetch("/api/checkout/pay-with-token", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            pedidoId:    pedidoData.id,
            token,
            productoPyg: subtotal,
            envioPyg:    precioEnvio,
            cuponCodigo: cuponAplicado?.codigo ?? null,
            email:       email.trim() || null,
            nombre:      nombreCompleto,
            nombreNino:  first.nombre_nino,
            producto:    first.producto,
            tipoEntrega: first.formato,
            modalidad:   anyFisico ? modalidad : undefined,
            descripcion,
          }),
        });
        const json = await res.json();
        if (json.ok && json.status === "PAID") {
          clear();
          const p = new URLSearchParams({ nombre_nino: first.nombre_nino, pedido_id: pedidoData.id, pagado: "1" });
          router.push(`/confirmacion?${p.toString()}`);
          return;
        }
        if (json.ok && json.status === "PENDING" && json.redirectUrl) {
          clear();
          redirectToGateway(json.redirectUrl);
          return;
        }
        throw new Error(json.error ?? "No se pudo procesar el pago.");
      }

      const res = await fetch("/api/checkout/create-session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pedidoId:    pedidoData.id,
          productoPyg: subtotal,
          envioPyg:    precioEnvio,
          cuponCodigo: cuponAplicado?.codigo ?? null,
          email:       email.trim() || null,
          nombreComprador: nombreCompleto,
          nombreNino:  first.nombre_nino,
          producto:    first.producto,
          tipoEntrega: first.formato,
          modalidad:   anyFisico ? modalidad : undefined,
          descripcion,
        }),
      });
      const json = await res.json();
      if (json.ok && json.url) {
        clear();
        redirectToGateway(json.url);
        return;
      }
      throw new Error(json.error ?? "No se pudo iniciar el pago.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo procesar el pago. Intentá de nuevo.";
      setError(msg);
      setRedirecting(false);
      track({
        evento:   "pago_fallido_cliente",
        pedidoId: pedidoData.id,
        data:     { modo: checkoutMode, error: msg },
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render: empty state ────────────────────────────────────────────────
  // Skipped while redirecting to the gateway: clear() empties the cart right
  // before the hop, and without this guard the whole form (including the
  // "Redirigiendo..." button) got replaced by "Tu carrito está vacío" for
  // however long the external page took to start loading — exactly the
  // confusing-looking freeze this fix is meant to get rid of.
  if (items.length === 0 && !redirecting) {
    return (
      <main className="min-h-screen bg-[#faf6e7] px-4 py-20 flex items-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h1 className="text-2xl font-bold text-[#22244e] mb-2">Tu carrito está vacío</h1>
          <p className="text-sm text-[#22244e]/60 mb-8">
            Empezá personalizando un tablero — podés agregar varios y pagarlos juntos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/personalizar/rutinas">
              <Button className="bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-lg h-12 px-6 w-full sm:w-auto">
                Tablero de Rutinas
              </Button>
            </Link>
            <Link href="/personalizar/recompensas">
              <Button variant="outline" className="border-[#22244e] text-[#22244e] rounded-lg h-12 px-6 w-full sm:w-auto">
                Tablero de Recompensas
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─── Render: redirecting to the payment gateway ────────────────────────
  // Own screen (not just a state on the submit button): clear() already
  // emptied the cart, so the form below would show a stale "0 tableros"
  // summary while we wait for the external page to start loading — this
  // covers that instead of leaving it half-visible.
  if (redirecting) {
    return (
      <main className="min-h-screen bg-[#faf6e7] px-4 py-20 flex items-center">
        <div className="max-w-md mx-auto text-center">
          <span className="inline-block w-10 h-10 border-[3px] border-[#336aea]/25 border-t-[#336aea] rounded-full animate-spin mb-6" />
          <h1 className="text-xl font-bold text-[#22244e] mb-2">
            Redirigiendo a la pasarela de pago...
          </h1>
          <p className="text-sm text-[#22244e]/60">
            Puede tardar unos segundos según tu conexión. No cierres ni recargues la página.
          </p>
        </div>
      </main>
    );
  }

  // ─── Render: normal checkout ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#faf6e7] px-4 py-10 pb-44">
      <div className="max-w-md md:max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#22244e] mb-2 text-center">
          Confirmá tu pedido
        </h1>
        <p className="text-sm text-[#22244e]/60 text-center mb-8">
          {items.length === 1 ? "Estás a un paso de tener tu tablero" : `Estás a un paso de tener tus ${items.length} tableros`}
        </p>

        {params.get("cancelado") === "1" && (
          <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Cancelaste el pago. Tu carrito sigue acá — completá el formulario abajo para reintentar.
          </div>
        )}

        {/* Cart items */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 mb-5">
          <p className="text-[11px] uppercase tracking-widest text-[#22244e]/40 font-bold mb-4">
            Tu carrito · {items.length} {items.length === 1 ? "tablero" : "tableros"}
          </p>

          <div className="space-y-4">
            {itemsConPrecio.map((it) => (
              <CartItemRow
                key={it.id}
                item={it}
                price={it.precio}
                onRemove={() => {
                  track({ evento: "checkout_filled", data: { _removed: it.producto } });
                  removeItem(it.id);
                }}
                onChangeFormato={(f) => setFormato(it.id, f)}
              />
            ))}
          </div>

          {/* Add-another panel */}
          <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
            {!showAddPanel ? (
              <Button
                type="button"
                onClick={() => setShowAddPanel(true)}
                variant="outline"
                className="w-full border-dashed border-[#22244e]/30 text-[#22244e] hover:bg-[#22244e]/5 h-12 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Agregar otro tablero
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#22244e]/60 text-center">¿Qué tablero querés agregar?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/personalizar/rutinas" className="block">
                    <div className="rounded-lg border border-[#e5e7eb] hover:border-[#22244e] p-3 text-center transition-colors">
                      <p className="text-sm font-bold text-[#22244e]">Rutinas</p>
                      <p className="text-[10px] text-[#22244e]/50 mt-0.5">Día + noche</p>
                    </div>
                  </Link>
                  <Link href="/personalizar/recompensas" className="block">
                    <div className="rounded-lg border border-[#e5e7eb] hover:border-[#22244e] p-3 text-center transition-colors">
                      <p className="text-sm font-bold text-[#22244e]">Recompensas</p>
                      <p className="text-[10px] text-[#22244e]/50 mt-0.5">10 o 20 pasos</p>
                    </div>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPanel(false)}
                  className="text-[11px] text-[#22244e]/40 hover:text-[#22244e] underline w-full text-center"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Modalidad — only if any item is físico */}
          {anyFisico && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
              <StepTitle n={1}>¿Pickup o delivery?</StepTitle>
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
                    Retirás en Asunción — te pasamos la ubicación exacta por WhatsApp.
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
                    A tu puerta. Se ajusta según tu ciudad.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Dirección — only if delivery */}
          {anyFisico && modalidad === "delivery" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
              <StepTitle n={2}>Decinos a dónde te lo llevamos</StepTitle>
              <MapLocationPicker onChange={handleMapChange} />
              <Input
                placeholder="Referencia (opcional — ej. portón verde)"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
              {location.ciudad && zonaActual && (
                <div className="bg-[#a8c5a0]/15 border border-[#a8c5a0]/40 rounded-lg px-3 py-2 text-xs text-[#22244e]/80">
                  Zona: <strong>{zonaActual.nombre}</strong> · Envío {fmt(zonaActual.precio)}
                </div>
              )}
            </div>
          )}

          {/* Tus datos */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
            <StepTitle n={anyFisico ? (modalidad === "delivery" ? 3 : 2) : 1}>
              Dejanos tus datos
            </StepTitle>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nombre"   value={nombre}   onChange={(e) => setNombre(e.target.value)}   autoComplete="given-name" />
              <Input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} autoComplete="family-name" />
            </div>
            <Input placeholder="Email" type="email" value={email}    onChange={(e) => setEmail(e.target.value)}    autoComplete="email" />
            <Input placeholder="WhatsApp (ej: +595 981 123456)" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} autoComplete="tel" />
            <p className="text-xs text-[#22244e]/50">
              Te contactamos por WhatsApp para confirmar y coordinar tu pedido.
            </p>

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
                  <Input placeholder="RUC"          value={ruc}         onChange={(e) => setRuc(e.target.value)} />
                  <Input placeholder="Razón social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Cupón */}
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
                <button type="button" onClick={quitarCupon} className="text-xs text-[#22244e]/50 hover:text-red-600 underline underline-offset-2">
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
                  <Button type="button" onClick={aplicarCupon} disabled={!cuponInput.trim() || cuponLoading} variant="outline" className="border-[#22244e] text-[#22244e] h-10 px-5 shrink-0">
                    {cuponLoading ? "..." : "Aplicar"}
                  </Button>
                </div>
                {cuponError && <p className="text-xs text-red-600">{cuponError}</p>}
              </>
            )}
          </div>

          {/* Pago embebido */}
          {checkoutMode === "embedded" && (
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3">
              <StepTitle n={anyFisico ? (modalidad === "delivery" ? 4 : 3) : 2}>
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
                <span>Subtotal ({items.length} {items.length === 1 ? "item" : "items"})</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {descuentoCupon > 0 && (
                <div className="flex justify-between text-sm text-[#a8c5a0] font-semibold">
                  <span>Cupón {cuponAplicado?.codigo}</span>
                  <span>−{fmt(descuentoCupon)}</span>
                </div>
              )}
              {anyFisico && (
                <div className="flex justify-between text-sm text-[#22244e]/60">
                  <span>Envío ({modalidad === "delivery" ? "Delivery" : "Pickup"})</span>
                  <span>{precioEnvio === 0 ? "Gs. 0" : fmt(precioEnvio)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#22244e] pt-2 border-t border-[#e5e7eb]">
                <span>Total</span>
                {loadingPrecios ? (
                  <span className="w-24 h-5 bg-[#e5e7eb] rounded animate-pulse" />
                ) : (
                  <span className="text-lg">{fmt(total)}</span>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || !formValido}
                className="w-full bg-[#336aea] hover:bg-[#2856c7] text-white font-bold rounded-xl text-base shadow-none border-0 mt-3 h-12 disabled:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                )}
                {loading
                  ? "Procesando..."
                  : checkoutMode === "embedded"
                  ? `Pagar ${loadingPrecios ? "" : fmt(total)}`
                  : `Ir a pagar ${loadingPrecios ? "" : fmt(total)}`}
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

// ─── Cart item row ─────────────────────────────────────────────────────────
function CartItemRow({
  item,
  price,
  onRemove,
  onChangeFormato,
}: {
  item:    CartItem & { producto: Producto };
  price:   number;
  onRemove: () => void;
  onChangeFormato: (f: Formato) => void;
}) {
  const productoLabel = NOMBRE_PRODUCTO[item.producto] ?? item.producto;

  // Personalization summary — what feels meaningful per product
  const summary = (() => {
    const p = item.personalizacion as Record<string, unknown> | null;
    if (!p) return "";
    if (item.producto === "rutinas") {
      const m = Array.isArray((p as { manana?: unknown }).manana) ? (p as { manana: unknown[] }).manana.length : 0;
      const n = Array.isArray((p as { noche?: unknown }).noche)   ? (p as { noche: unknown[] }).noche.length   : 0;
      return `${m} actividades de mañana · ${n} de noche`;
    }
    if (item.producto === "recompensas") {
      const cantidad = (p as { cantidad?: number }).cantidad ?? 10;
      return `${cantidad} pasos`;
    }
    return "";
  })();

  return (
    <div className="flex gap-3">
      <div
        className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#e5e7eb] relative"
        style={{ backgroundColor: item.color_acento + "22" }}
      >
        <Image
          src={`/productos/${item.producto}.png`}
          alt={productoLabel}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#22244e] truncate">
              {productoLabel}
            </p>
            <p className="text-xs text-[#22244e]/60 truncate">
              Para {item.nombre_nino} · {summary}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Eliminar"
            className="shrink-0 w-7 h-7 rounded-md text-[#22244e]/40 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format toggle */}
        <div className="flex items-center gap-2 mt-2">
          <div className="inline-flex rounded-lg border border-[#e5e7eb] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => onChangeFormato("fisico")}
              className={`px-2 py-1 flex items-center gap-1 transition-colors ${
                item.formato === "fisico"
                  ? "bg-[#22244e] text-white"
                  : "bg-white text-[#22244e]/70 hover:bg-[#22244e]/5"
              }`}
            >
              <Package className="w-3 h-3" />
              Impreso
            </button>
            <button
              type="button"
              onClick={() => onChangeFormato("digital")}
              className={`px-2 py-1 flex items-center gap-1 transition-colors ${
                item.formato === "digital"
                  ? "bg-[#22244e] text-white"
                  : "bg-white text-[#22244e]/70 hover:bg-[#22244e]/5"
              }`}
            >
              <Smartphone className="w-3 h-3" />
              Digital
            </button>
          </div>
          <span className="ml-auto text-sm font-bold text-[#22244e] tabular-nums">
            {fmt(price)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
