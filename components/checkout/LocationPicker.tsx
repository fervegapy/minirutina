"use client";
import { useEffect, useRef, useState } from "react";

const BASE = "https://api.delpi.dev/api";

async function fetchItems(url: string): Promise<{ id: number; nombre: string }[]> {
  try {
    const res = await fetch(`${url}?limit=500&sort=nombre+asc`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

export interface LocationValue {
  departamento: string;
  ciudad: string;
  barrio: string;
}

interface Props {
  onChange: (val: LocationValue) => void;
}

const selectClass =
  "w-full h-10 px-3 pr-8 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#233933] focus:outline-none focus:border-[#233933] transition-colors appearance-none disabled:opacity-40 disabled:cursor-not-allowed";

export default function LocationPicker({ onChange }: Props) {
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([]);
  const [ciudades, setCiudades] = useState<{ id: number; nombre: string }[]>([]);
  const [barrios, setBarrios] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingDep, setLoadingDep] = useState(true);
  const [loadingCiu, setLoadingCiu] = useState(false);
  const [loadingBar, setLoadingBar] = useState(false);

  const [deptoId, setDeptoId] = useState<number | "">("");
  const [ciudadId, setCiudadId] = useState<number | "">("");

  const valueRef = useRef<LocationValue>({ departamento: "", ciudad: "", barrio: "" });

  const emit = (partial: Partial<LocationValue>) => {
    valueRef.current = { ...valueRef.current, ...partial };
    onChange(valueRef.current);
  };

  useEffect(() => {
    fetchItems(`${BASE}/departamentos`).then((data) => {
      setDepartamentos(data);
      setLoadingDep(false);
    });
  }, []);

  const handleDepto = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value) || "";
    const nombre = departamentos.find((d) => d.id === id)?.nombre ?? "";
    setDeptoId(id);
    setCiudadId("");
    setCiudades([]);
    setBarrios([]);
    emit({ departamento: nombre, ciudad: "", barrio: "" });
    if (!id) return;
    setLoadingCiu(true);
    const data = await fetchItems(`${BASE}/ciudades/${id}`);
    setCiudades(data);
    setLoadingCiu(false);
  };

  const handleCiudad = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value) || "";
    const nombre = ciudades.find((c) => c.id === id)?.nombre ?? "";
    setCiudadId(id);
    setBarrios([]);
    emit({ ciudad: nombre, barrio: "" });
    if (!id) return;
    setLoadingBar(true);
    const data = await fetchItems(`${BASE}/barrios/${id}`);
    setBarrios(data);
    setLoadingBar(false);
  };

  const handleBarrio = (e: React.ChangeEvent<HTMLSelectElement>) => {
    emit({ barrio: e.target.value });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={deptoId}
          onChange={handleDepto}
          disabled={loadingDep}
          className={selectClass}
        >
          <option value="">
            {loadingDep ? "Cargando departamentos…" : "Departamento"}
          </option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
        <Chevron />
      </div>

      <div className="relative">
        <select
          value={ciudadId}
          onChange={handleCiudad}
          disabled={!deptoId || loadingCiu}
          className={selectClass}
        >
          <option value="">
            {loadingCiu ? "Cargando ciudades…" : "Ciudad"}
          </option>
          {ciudades.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <Chevron />
      </div>

      <div className="relative">
        <select
          onChange={handleBarrio}
          disabled={!ciudadId || loadingBar}
          className={selectClass}
          defaultValue=""
        >
          <option value="">
            {loadingBar ? "Cargando barrios…" : barrios.length === 0 && ciudadId ? "Sin barrios registrados" : "Barrio (opcional)"}
          </option>
          {barrios.map((b) => (
            <option key={b.id} value={b.nombre}>
              {b.nombre}
            </option>
          ))}
        </select>
        <Chevron />
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-[#233933]/40"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
