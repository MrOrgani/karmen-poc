/**
 * Canonical event taxonomy. Mirror of backend `EventType` in
 * `backend/src/events/events.types.ts`. Members tagged `server-side only` are
 * never emitted by this client — they are pushed by the backend (tracking
 * middleware / decisions controller) and declared here only to keep the
 * cross-stack taxonomy complete.
 */
export type EventType =
  | "case.list.viewed"
  | "case.opened"
  | "follow-up.modal.opened"
  | "follow-up.draft.generated"
  | "follow-up.sent"
  | "decision.made" // server-side only (decisions controller)
  | "http.request"; // server-side only (tracking middleware)

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
  // fetch + keepalive: reliable delivery that also survives page unload.
  // sendBeacon was dropped on purpose — with an `application/json` Blob it
  // returns true ("queued") but Chrome silently drops the non-CORS-safelisted
  // body, and the early return then skipped any fallback → events lost.
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
