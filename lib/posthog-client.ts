"use client";

// Referencia a la instancia de PostHog, sin importar la librería.
//
// PostHogProvider importa posthog-js de forma dinámica después del load y deja
// acá la instancia; el resto del código cliente la lee con getPostHog(). Un
// `import type` se borra al compilar, así que este módulo no arrastra nada al
// bundle: importarla estáticamente metía 203 KB en la carga inicial que el
// navegador parseaba durante la hidratación, justo cuando quería pintar el LCP.
//
// Antes de que termine el init getPostHog() devuelve null, y quien la usa ya
// salía temprano en ese caso.
import type { PostHog } from "posthog-js";

let instancia: PostHog | null = null;

export function setPostHog(ph: PostHog): void {
  instancia = ph;
}

export function getPostHog(): PostHog | null {
  return instancia;
}
