// Shared resolver for icon asset paths.
// Some illustrations have boy/girl variants (e.g. agua-nino.png / agua-nina.png).
// Everything else uses a single shared PNG (e.g. bano.png).

export type Genero = "nino" | "nina";

// IDs that have gender-specific variants in /public/icons/.
// File convention: `${id}-${genero}.png` (e.g. agua-nino.png, agua-nina.png).
export const GENDERED_ICONS = new Set<string>([
  "agua",
  "cama",
  "calma",
  "cancion",
  "cara",
  "charla",
  "levantarse",
  "ordenar",
  "peinarse",
  "vestirse",
  "zapatos",
]);

/** Returns just the filename (without the leading folder). */
export function iconFileName(id: string, genero?: Genero | null): string {
  if (genero && GENDERED_ICONS.has(id)) {
    return `${id}-${genero}.png`;
  }
  return `${id}.png`;
}

/** Carpeta del idioma: las ilustraciones traen la etiqueta dibujada, así que
 *  en inglés y portugués se usan las de public/icons/{en,pt}/ (generadas con
 *  scripts/traducir-imagenes.py). El español está en la raíz. */
export function iconDir(idioma?: string | null): string {
  return idioma === "en" || idioma === "pt" ? `${idioma}/` : "";
}

/** Returns the public URL for use in <img src> on the web. */
export function iconUrl(id: string, genero?: Genero | null, idioma?: string | null): string {
  return `/icons/${iconDir(idioma)}${iconFileName(id, genero)}`;
}
