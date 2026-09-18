"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY  ?? "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Initializes PostHog once on the client and tracks pageviews on every
 * client-side navigation. Wraps the whole app from layout.tsx.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);

  // El init espera al load de la página. El SDK trae ~112 KB entre recorder,
  // autocapture y web-vitals, y arrancaba a los 915 ms, justo cuando la página
  // pelea por ancho de banda y main thread. El costo es que quien rebota antes
  // del load no queda en PostHog; la atribución de campaña no se ve afectada
  // porque de eso se encarga el Pixel de Meta, que dispara en el HTML.
  useEffect(() => {
    if (!KEY || typeof window === "undefined") return;
    // Guard against re-init on fast-refresh.
    if (posthog.__loaded) {
      setListo(true);
      return;
    }

    const iniciar = () => {
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
      setListo(true);
    };

    if (document.readyState === "complete") {
      iniciar();
      return;
    }
    window.addEventListener("load", iniciar, { once: true });
    return () => window.removeEventListener("load", iniciar);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker listo={listo} />
      </Suspense>
      {children}
    </>
  );
}

function PageviewTracker({ listo }: { listo: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // `listo` va en las dependencias para que el pageview inicial se mande cuando
  // termina el init. Los efectos de los hijos corren antes que los del padre,
  // así que en el primer render PostHog todavía no existe.
  useEffect(() => {
    if (!listo) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: window.location.origin + url });
  }, [listo, pathname, searchParams]);
  return null;
}
