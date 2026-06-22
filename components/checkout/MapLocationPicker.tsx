"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapLocationValue {
  departamento: string;
  ciudad:       string;
  barrio:       string;
  calle:        string;
  numero:       string;
  lat:          number | null;
  lng:          number | null;
}

interface Props {
  onChange: (val: MapLocationValue) => void;
}

const DEFAULT_CENTER: [number, number] = [-25.2987, -57.6359];
const DEFAULT_ZOOM = 13;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const MAPBOX_BASE  = "https://api.mapbox.com/geocoding/v5/mapbox.places";

interface MapboxContext { id: string; text: string; }
interface MapboxFeature {
  place_type?: string[];
  center:      [number, number];
  text:        string;
  context?:    MapboxContext[];
}
interface MapboxResponse { features: MapboxFeature[]; }

function featureToPartial(f: MapboxFeature): Partial<MapLocationValue> & { lat: number; lng: number } {
  const ctx = f.context ?? [];
  const get = (prefix: string) => ctx.find((c) => c.id.startsWith(prefix))?.text ?? "";
  const isCity = f.place_type?.includes("place");
  const ciudad = isCity ? f.text : get("place");
  const barrio = isCity
    ? get("locality") || get("neighborhood")
    : (f.place_type?.includes("locality") ? f.text : get("locality") || get("neighborhood"));
  return {
    ciudad:       ciudad ?? "",
    departamento: get("region") ?? "",
    barrio:       barrio ?? "",
    lat: f.center[1],
    lng: f.center[0],
  };
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#22244e] focus:outline-none focus:border-[#22244e] transition-colors";

export default function MapLocationPicker({ onChange }: Props) {
  const mapElRef  = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [value, setValue] = useState<MapLocationValue>({
    departamento: "", ciudad: "", barrio: "", calle: "", numero: "", lat: null, lng: null,
  });
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "denied" | "error">("idle");
  const [mapReady, setMapReady]   = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const patch = useCallback((p: Partial<MapLocationValue>) => {
    setValue((prev) => {
      const next = { ...prev, ...p };
      onChangeRef.current(next);
      return next;
    });
  }, []);

  // ─── Init Leaflet map once ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapElRef.current || mapRef.current) return;

      const map = L.map(mapElRef.current, {
        center: DEFAULT_CENTER,
        zoom:   DEFAULT_ZOOM,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const pin = L.divIcon({
        className: "",
        html: `<div style="transform:translate(-50%,-100%);">
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="#336aea"/>
            <circle cx="17" cy="17" r="6" fill="#fff"/>
          </svg></div>`,
        iconSize:   [34, 44],
        iconAnchor: [17, 44],
      });

      const marker = L.marker(DEFAULT_CENTER, { draggable: true, icon: pin }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        reverseGeocode(lat, lng);
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveTo = useCallback((lat: number, lng: number, zoom = 16) => {
    mapRef.current?.setView([lat, lng], zoom);
    markerRef.current?.setLatLng([lat, lng]);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    patch({ lat, lng });
    if (!MAPBOX_TOKEN) return;
    try {
      const res = await fetch(
        `${MAPBOX_BASE}/${lng},${lat}.json?language=es&types=locality,place,region&access_token=${MAPBOX_TOKEN}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as MapboxResponse;
      const feature = json.features[0];
      if (feature) patch(featureToPartial(feature));
    } catch { /* keep coords-only patch */ }
  }, [patch]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoStatus("idle");
        moveTo(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [moveTo, reverseGeocode]);

  return (
    <div className="space-y-3">
      {/* Mi ubicación */}
      <button
        type="button"
        onClick={useMyLocation}
        disabled={geoStatus === "locating"}
        className="w-full h-10 rounded-lg border border-[#22244e] text-[#22244e] text-sm font-bold hover:bg-[#22244e]/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        📍 {geoStatus === "locating" ? "Ubicando…" : "Usar mi ubicación"}
      </button>

      {geoStatus === "denied" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No nos diste permiso de ubicación. Mové el pin en el mapa para marcar tu casa.
        </p>
      )}
      {geoStatus === "error" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No pudimos obtener tu ubicación. Mové el pin en el mapa para marcar tu casa.
        </p>
      )}

      {/* Map */}
      <div className="relative">
        <div
          ref={mapElRef}
          className="w-full h-56 md:h-64 rounded-xl overflow-hidden border border-[#e5e7eb] bg-[#eef0f2] z-0"
        />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#22244e]/40">
            Cargando mapa…
          </div>
        )}
      </div>
      {value.lat != null ? (
        <div className="flex items-center gap-1.5 text-[11px] text-[#a8c5a0] font-semibold">
          <span>📍</span>
          <span>Ubicación marcada — completá calle y número abajo.</span>
        </div>
      ) : (
        <p className="text-[11px] text-[#22244e]/50 text-center">
          Tocá el mapa o arrastrá el pin para marcar tu casa exacta.
        </p>
      )}

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-2">
        <input
          className={inputClass}
          placeholder="Ciudad"
          value={value.ciudad}
          onChange={(e) => patch({ ciudad: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Departamento"
          value={value.departamento}
          onChange={(e) => patch({ departamento: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Calle"
          value={value.calle}
          onChange={(e) => patch({ calle: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Número"
          value={value.numero}
          onChange={(e) => patch({ numero: e.target.value })}
        />
      </div>
    </div>
  );
}
