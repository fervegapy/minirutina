import fs from "fs";
import path from "path";
import { iconFileName, type Genero } from "./iconAssets";

function toDataUrl(filePath: string, mime = "image/png"): string {
  const buffer = fs.readFileSync(filePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function tryRead(filePath: string): string | null {
  try {
    return toDataUrl(filePath);
  } catch {
    return null;
  }
}

const ICONS_DIR = path.join(process.cwd(), "public", "icons");
const DECO_DIR = path.join(process.cwd(), "public", "decorations");
const RECOMPENSAS_DIR = path.join(process.cwd(), "public", "recompensas");

const DECO_KEYS = [
  "manana-left",
  "manana-right",
  "siesta-left",
  "siesta-right",
  "noche-left",
  "noche-right",
];

// Asset keys for the Tablero de Recompensas. Files live in /public/recompensas/
// and are loaded into a flat dict keyed by these names.
const RECOMPENSAS_KEYS = [
  "comienza-aqui",
  "lo-lograste-nino",
  "lo-lograste-nina",
  "circulo-nino",
  "circulo-nina",
];

export function loadImages(
  iconIds: string[],
  genero?: Genero | null,
): Record<string, string> {
  const images: Record<string, string> = {};

  for (const id of iconIds) {
    // Resolve gendered variants (e.g. agua-nino.png) when applicable.
    // The dictionary is still keyed by the bare id so TableroPDF doesn't need to know.
    const fileName = iconFileName(id, genero);
    let src = tryRead(path.join(ICONS_DIR, fileName));
    // Defensive fallback: if the gendered file is missing, try the bare id.
    if (!src && fileName !== `${id}.png`) {
      src = tryRead(path.join(ICONS_DIR, `${id}.png`));
    }
    if (src) images[id] = src;
  }

  for (const key of DECO_KEYS) {
    const src = tryRead(path.join(DECO_DIR, `${key}.png`));
    if (src) images[`deco:${key}`] = src;
  }

  return images;
}

/** Loads the Tablero de Recompensas asset set. Keys come back without prefix. */
export function loadRecompensaImages(): Record<string, string> {
  const images: Record<string, string> = {};
  for (const key of RECOMPENSAS_KEYS) {
    const src = tryRead(path.join(RECOMPENSAS_DIR, `${key}.png`));
    if (src) images[key] = src;
  }
  return images;
}

/** Loads a single sticker PNG from /public/recompensas/stickers/{id}.png. */
export function loadStickerImage(stickerId: string): string | null {
  return tryRead(path.join(RECOMPENSAS_DIR, "stickers", `${stickerId}.png`));
}
