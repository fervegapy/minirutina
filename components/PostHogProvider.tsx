"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY  ?? "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Initializes PostHog once on the client and tracks pageviews on every
 * client-side navigation. Wraps the whole app from layout.tsx.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!KEY || typeof window === "undefined") return;
    // Guard against re-init on fast-refresh.
    if (posthog.__loaded) return;

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
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!posthog.__loaded) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: window.location.origin + url });
  }, [pathname, searchParams]);
  return null;
}
