import { post } from "@/shared/lib/http";

export type DecisionType = "approve" | "request_docs" | "reject";
export type DecisionResponse = {
  ok: true;
  decision: DecisionType;
  caseId: string;
  ts: number;
};

export function recordDecision(
  caseId: string,
  decision: DecisionType,
  justification: string,
): Promise<DecisionResponse> {
  return post<DecisionResponse>("/decisions", {
    caseId,
    decision,
    justification,
  });
}
