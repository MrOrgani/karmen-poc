import { post } from '@/shared/lib/http';

export type DecisionType = 'approve' | 'request_docs' | 'reject';
export type DecisionResponse = {
  ok: true;
  decision: DecisionType;
  dossierId: string;
  ts: number;
};

export function recordDecision(
  dossierId: string,
  decision: DecisionType,
  justification: string,
): Promise<DecisionResponse> {
  return post<DecisionResponse>('/decisions', { dossierId, decision, justification });
}
