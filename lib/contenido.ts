/** Kanban de contenido — constantes y helpers sin DB (versión lite del tablero de mcv-OS). */

export const ESTADOS = [
  { id: "ideas",     label: "Ideas",               color: "#e0a25f" },
  { id: "guion",     label: "Guión",               color: "#cf7d66" },
  { id: "produccion", label: "Producción",         color: "#8f7bad" },
  { id: "edicion",   label: "Edición",             color: "#5b3f5f" },
  { id: "listo",     label: "Listo para publicar", color: "#7d9367" },
  { id: "publicado", label: "Publicado",           color: "#9a8b84" },
] as const;

export type Estado = (typeof ESTADOS)[number]["id"];

export const FORMATOS = ["reel", "carrusel", "post", "story", "otro"];
export const LIMITE_IG = 2200;

export interface Pieza {
  id:      string;
  titulo:  string;
  estado:  string;
  formato: string | null;
  fecha:   string | null; // YYYY-MM-DD
  caption:   string;
  inspo:     string;
  contenido: string;
  orden:   number;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "18 ago", sin depender del locale ni de la zona horaria. */
export function fechaCorta(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
}

/** null si no hay fecha o ya se publicó. "pronto" = hoy o en los próximos 3 días. */
export function urgencia(iso: string | null, estado: string): "vencida" | "pronto" | "normal" | null {
  if (!iso || estado === "publicado") return null;
  const [y, m, d] = iso.split("-").map(Number);
  const h = new Date();
  const dias = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
  if (dias < 0) return "vencida";
  if (dias <= 3) return "pronto";
  return "normal";
}
