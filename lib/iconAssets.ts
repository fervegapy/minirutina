// Shared resolver for icon asset paths.
// Some illustrations have boy/girl variants (e.g. agua-nino.png / agua-nina.png).
// Everything else uses a single shared PNG (e.g. bano.png).

export type Genero = "nino" | "nina";

// IDs that have gender-specific variants in /public/icons/.
// File convention: `${id}-${genero}.png` (e.g. agua-nino.png, agua-nina.png).
export const GENDERED_ICONS = new Set<string>([
  "agua",
  "cama",
  "cancion",
  "levantarse",
  "vestirse",
]);

/** Returns just the filename (without the leading folder). */
export function iconFileName(id: string, genero?: Genero | null): string {
  if (genero && GENDERED_ICONS.has(id)) {
    return `${id}-${genero}.png`;
  }
  return `${id}.png`;
}

/** Returns the public URL for use in <img src> on the web. */
export function iconUrl(id: string, genero?: Genero | null): string {
  return `/icons/${iconFileName(id, genero)}`;
}
