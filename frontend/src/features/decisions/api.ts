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

// The two verdicts that warrant an AI-drafted justification (cf. ✨ menu).
export type JustificationDirection = "approve" | "reject";

// How the chosen direction stands vs the deterministic diagnostic.
// `divergent` drafts are never LLM-generated — the backend returns a deterministic warning.
export type JustificationAlignment = "aligned" | "judgment-zone" | "divergent";

export type JustificationDraft = {
  direction: JustificationDirection;
  alignment: JustificationAlignment;
  body: string;
  source: "llm" | "template";
  latencyMs: number;
};

export function draftJustification(
  caseId: string,
  decision: JustificationDirection,
  opts?: { signal?: AbortSignal },
): Promise<JustificationDraft> {
  return post<JustificationDraft>(
    "/decisions/justification",
    { caseId, decision },
    { signal: opts?.signal },
  );
}
