import type { CockpitResponse, DossierSummary } from './types';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    throw new ApiError(0, `Backend injoignable (${reason})`);
  }
  if (!response.ok) {
    throw new ApiError(response.status, `${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function getDossiers(): Promise<DossierSummary[]> {
  return request<DossierSummary[]>('/dossiers');
}

export function getCockpit(id: string): Promise<CockpitResponse> {
  return request<CockpitResponse>(`/dossiers/${encodeURIComponent(id)}/cockpit`);
}

export type RelanceDraft = { subject: string; body: string; missingDocs: string[] };

export function draftRelance(dossierId: string, opts?: { signal?: AbortSignal }): Promise<RelanceDraft> {
  return request<RelanceDraft>('/relances/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dossierId }),
    signal: opts?.signal,
  });
}

export type DecisionType = 'approve' | 'request_docs' | 'reject';
export type DecisionResponse = { ok: true; decision: DecisionType; dossierId: string; ts: number };

export function recordDecision(
  dossierId: string,
  decision: DecisionType,
  justification: string,
): Promise<DecisionResponse> {
  return post<DecisionResponse>('/decisions', { dossierId, decision, justification });
}
