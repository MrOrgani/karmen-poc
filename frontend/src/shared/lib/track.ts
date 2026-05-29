/**
 * Canonical event taxonomy. Mirror of backend `EventType` in
 * `backend/src/events/events.types.ts`. `http.request` is emitted server-side
 * only (tracking middleware) — declared here for cross-stack consistency.
 */
export type EventType =
  | "cases.list.viewed"
  | "case.opened"
  | "cockpit.section.expanded"
  | "follow-up.modal.opened"
  | "follow-up.draft.generated"
  | "follow-up.sent"
  | "decision.justification.drafted"
  | "decision.made"
  | "http.request";

type Payload = Record<string, unknown>;

/**
 * Fire-and-forget tracking. Logs to console + POST /api/events.
 * Never throws — instrumentation must never break the user flow.
 */
export function track(
  type: EventType,
  caseId?: string,
  payload?: Payload,
): void {
  const event = { ts: Date.now(), type, caseId, payload };
  if (import.meta.env.DEV) {
    console.log("📊 [track]", event);
  }
  // Use sendBeacon when available (queued, non-blocking, survives page unload).
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([JSON.stringify(event)], {
        type: "application/json",
      });
      if (navigator.sendBeacon("/api/events", blob)) return;
    } catch {
      // fall through to fetch
    }
  }
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch((err: unknown) => {
    if (import.meta.env.DEV)
      console.warn("🚨 [track] POST /events failed", err);
  });
}
