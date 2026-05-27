import { request } from '@/shared/lib/http';

export type RelanceDraft = {
  subject: string;
  body: string;
  missingDocs: string[];
};

export function draftRelance(
  dossierId: string,
  opts?: { signal?: AbortSignal },
): Promise<RelanceDraft> {
  return request<RelanceDraft>('/relances/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dossierId }),
    signal: opts?.signal,
  });
}
