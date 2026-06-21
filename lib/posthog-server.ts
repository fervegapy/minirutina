// Server-side PostHog client. Use this from API routes / webhooks to
// capture events that should NEVER depend on the browser being alive
// (e.g. payment confirmations from the dLocal webhook).
//
// We instantiate lazily because some env contexts (build-time route
// scans) don't have the env var available and posthog-node throws on
// missing key.
import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  if (_client) return _client;
  const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!key) return null;
  _client = new PostHog(key, {
    host,
    // Send events ASAP — these are payment confirmations, low volume,
    // worth one HTTP roundtrip each.
    flushAt:       1,
    flushInterval: 0,
  });
  return _client;
}

export interface ServerCaptureArgs {
  distinctId: string;            // usually the customer email
  event:      string;
  properties?: Record<string, unknown>;
  // Set these so PostHog merges this event into the person's timeline
  // even though it fires from the server.
  setOnce?:   Record<string, unknown>;
}

/** Fire-and-forget server-side capture. */
export async function captureServerEvent(args: ServerCaptureArgs): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    client.capture({
      distinctId: args.distinctId,
      event:      args.event,
      properties: args.properties,
    });
    if (args.setOnce && Object.keys(args.setOnce).length > 0) {
      client.identify({
        distinctId:   args.distinctId,
        properties:   args.setOnce,
      });
    }
    // Flush so the event leaves the lambda before the response returns.
    await client.flush();
  } catch (e) {
    console.error("[posthog-server] capture failed:", e);
  }
}
