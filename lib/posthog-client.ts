"use client";

// Browser-side PostHog client. Initialized once via PostHogProvider; this
// module just re-exports the singleton for direct use inside client
// components (e.g. lib/tracking.ts mirroring events).
import posthog from "posthog-js";

export { posthog };
