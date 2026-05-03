import fs from "fs";
import path from "path";

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

const DECO_KEYS = [
  "manana-left",
  "manana-right",
  "siesta-left",
  "siesta-right",
  "noche-left",
  "noche-right",
];

export function loadImages(iconIds: string[]): Record<string, string> {
  const images: Record<string, string> = {};

  for (const id of iconIds) {
    const src = tryRead(path.join(ICONS_DIR, `${id}.png`));
    if (src) images[id] = src;
  }

  for (const key of DECO_KEYS) {
    const src = tryRead(path.join(DECO_DIR, `${key}.png`));
    if (src) images[`deco:${key}`] = src;
  }

  return images;
}
