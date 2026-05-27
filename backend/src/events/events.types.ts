export type EventType =
  | 'dossier.list.viewed'
  | 'dossier.opened'
  | 'cockpit.section.expanded'
  | 'relance.modal.opened'
  | 'relance.draft.generated'
  | 'relance.sent'
  | 'decision.made'
  | 'http.request';

export type TrackedEvent = {
  ts: number;
  type: EventType | string;
  dossierId?: string;
  durationMs?: number;
  payload?: Record<string, unknown>;
};
