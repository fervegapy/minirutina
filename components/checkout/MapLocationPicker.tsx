"use client";

// Map-based delivery address picker. Built on OpenStreetMap + Leaflet
// (no API key) with Nominatim for forward/reverse geocoding.
//
// Three ways to set the address, all of which converge on a single
// lat/lng + auto-filled (but editable) text fields:
//   1. "Usar mi ubicación"  → browser geolocation → reverse geocode
//   2. Address search box    → Nominatim forward geocode → pick a result
//   3. Drag the pin          → reverse geocode the dropped point
//
// The text fields stay editable because Nominatim's city names don't
// always match our delivery_zonas exactly — the customer can correct the
// ciudad so zona pricing resolves. The component emits on every change.

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

// Asunción centro — sensible default before the user does anything.
const DEFAULT_CENTER: [number, number] = [-25.2987, -57.6359];
const DEFAULT_ZOOM = 13;

interface NominatimAddress {
  road?:         string;
  house_number?: string;
  neighbourhood?: string;
  suburb?:       string;
  quarter?:      string;
  city?:         string;
  town?:         string;
  village?:      string;
  municipality?: string;
  city_district?: string;
  state?:        string;
  region?:       string;
}

interface NominatimResult {
  lat:          string;
  lon:          string;
  display_name: string;
  address?:     NominatimAddress;
}

function addressToValue(a: NominatimAddress, lat: number, lng: number): MapLocationValue {
  return {
    departamento: a.state ?? a.region ?? "",
    ciudad:       a.city ?? a.town ?? a.village ?? a.municipality ?? a.city_district ?? "",
    barrio:       a.suburb ?? a.neighbourhood ?? a.quarter ?? "",
    calle:        a.road ?? "",
    numero:       a.house_number ?? "",
    lat,
    lng,
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

  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "denied" | "error">("idle");
  const [mapReady, setMapReady]   = useState(false);

  // Keep the latest onChange without forcing map re-inits.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Merge a patch into value + bubble up.
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

      // Custom SVG pin — avoids the broken default-marker asset paths that
      // bundlers trip on.
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
      // Click on the map also moves the pin.
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
      // Leaflet needs a size recalculation once it's visible in the layout.
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

  // Move map + marker to a point.
  const moveTo = useCallback((lat: number, lng: number, zoom = 16) => {
    mapRef.current?.setView([lat, lng], zoom);
    markerRef.current?.setLatLng([lat, lng]);
  }, []);

  // ─── Reverse geocode (coords → address) ──────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    // Optimistic: set coords immediately so the order has a pin even if the
    // reverse lookup is slow/fails.
    patch({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=es&zoom=18&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return;
      const json = (await res.json()) as NominatimResult;
      if (json.address) patch(addressToValue(json.address, lat, lng));
    } catch {
      /* keep the coords-only patch */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patch]);

  // ─── Geolocation ──────────────────────────────────────────────────────────
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

  // ─── Forward search (text → candidates), debounced ────────────────────────
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=py&addressdetails=1&accept-language=es&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } },
        );
        const json = res.ok ? ((await res.json()) as NominatimResult[]) : [];
        setResults(json);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 600); // Nominatim policy: ≤1 req/s
    return () => clearTimeout(t);
  }, [query]);

  const pickResult = useCallback((r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setQuery("");
    setResults([]);
    moveTo(lat, lng);
    if (r.address) patch(addressToValue(r.address, lat, lng));
    else reverseGeocode(lat, lng);
  }, [moveTo, patch, reverseGeocode]);

  return (
    <div className="space-y-3">
      {/* Search + geolocation */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscá tu dirección (ej. Av. España 1234)"
            className={inputClass}
            autoComplete="off"
          />
          {(results.length > 0 || searching) && (
            <div className="absolute z-[1000] left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden">
              {searching && results.length === 0 && (
                <div className="px-3 py-2 text-xs text-[#22244e]/50">Buscando…</div>
              )}
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickResult(r)}
                  className="block w-full text-left px-3 py-2 text-xs text-[#22244e] hover:bg-[#336aea]/10 border-b border-[#e5e7eb] last:border-0"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoStatus === "locating"}
          className="shrink-0 h-10 px-3 rounded-lg border border-[#22244e] text-[#22244e] text-xs font-bold hover:bg-[#22244e]/5 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          📍 {geoStatus === "locating" ? "Ubicando…" : "Mi ubicación"}
        </button>
      </div>

      {geoStatus === "denied" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No nos diste permiso de ubicación. Buscá tu dirección arriba o movés el pin en el mapa.
        </p>
      )}
      {geoStatus === "error" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No pudimos obtener tu ubicación. Probá buscando la dirección o moviendo el pin.
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
          <span>Ubicación marcada — el texto se puede corregir abajo si el nombre de la calle no es exacto.</span>
        </div>
      ) : (
        <p className="text-[11px] text-[#22244e]/50 text-center">
          Tocá el mapa, arrastrá el pin o buscá tu dirección arriba.
        </p>
      )}

      {/* Editable auto-filled fields */}
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
