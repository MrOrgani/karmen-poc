export type EventType =
  | 'case.list.viewed'
  | 'case.opened'
  | 'cockpit.section.expanded'
  | 'follow-up.modal.opened'
  | 'follow-up.draft.generated'
  | 'follow-up.sent'
  | 'decision.made'
  | 'http.request';

export type TrackedEvent = {
  ts: number;
  type: EventType | string;
  caseId?: string;
  durationMs?: number;
  payload?: Record<string, unknown>;
};
