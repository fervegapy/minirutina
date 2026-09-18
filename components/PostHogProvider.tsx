"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
// Solo el tipo: un `import type` se borra al compilar, así que no arrastra la
// librería al bundle. El import real es dinámico, más abajo.
import type { PostHog } from "posthog-js";
import { setPostHog } from "@/lib/posthog-client";

const KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY  ?? "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Initializes PostHog once on the client and tracks pageviews on every
 * client-side navigation. Wraps the whole app from layout.tsx.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ph, setPh] = useState<PostHog | null>(null);

  // posthog-js se importa dinámicamente y después del load. Importarlo arriba
  // lo metía en el bundle inicial (203 KB sin comprimir) y el navegador lo
  // parseaba durante la hidratación, justo cuando quería pintar el LCP: en la
  // CPU emulada de PageSpeed eso eran 1,9 s de "element render delay".
  // El costo aceptado es que quien rebota antes del load no queda registrado;
  // la atribución de campaña no se toca porque de eso se encarga el Pixel de
  // Meta, que dispara inline en el HTML.
  useEffect(() => {
    if (!KEY || typeof window === "undefined") return;

    let cancelado = false;

    const iniciar = async () => {
      const { default: posthog } = await import("posthog-js");
      if (cancelado) return;

      // Guard against re-init on fast-refresh.
      if (!posthog.__loaded) {
        posthog.init(KEY, {
          api_host: HOST,
          // Pageviews are tracked manually below (App Router doesn't fire the
          // SDK's auto-pageview reliably on route changes).
          capture_pageview: false,
          // Captures clicks/inputs without code changes — gold for finding UX
          // friction points.
          autocapture: true,
          // Captures UTMs as person + event properties automatically.
          persistence: "localStorage+cookie",
          // No usamos encuestas de PostHog: sin esto igual baja y parsea
          // surveys.js (34 KB) en cada visita.
          disable_surveys: true,
          // Performance: only load session replay when explicitly enabled.
          disable_session_recording: false,
          session_recording: {
            // Mask sensitive form inputs by default (we never want to record
            // card data even though SmartFields handles that separately).
            maskAllInputs: true,
            maskInputOptions: {
              password: true,
            },
          },
        });
      }
      // lib/tracking.ts la lee desde acá en vez de importar la librería.
      setPostHog(posthog);
      setPh(posthog);
    };

    if (document.readyState === "complete") {
      iniciar();
    } else {
      window.addEventListener("load", iniciar, { once: true });
    }

    return () => {
      cancelado = true;
      window.removeEventListener("load", iniciar);
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker ph={ph} />
      </Suspense>
      {children}
    </>
  );
}

// `ph` va en las dependencias para que el pageview inicial se mande cuando
// termina el init. Los efectos de los hijos corren antes que los del padre,
// así que en el primer render PostHog todavía no existe.
function PageviewTracker({ ph }: { ph: PostHog | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!ph) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    ph.capture("$pageview", { $current_url: window.location.origin + url });
  }, [ph, pathname, searchParams]);
  return null;
}
