import { post } from "@/shared/lib/http";

export type FollowUpDraft = {
  subject: string;
  body: string;
  missingDocs: string[];
};

export function draftFollowUp(
  caseId: string,
  opts?: { signal?: AbortSignal },
): Promise<FollowUpDraft> {
  return post<FollowUpDraft>(
    `/cases/${encodeURIComponent(caseId)}/follow-ups`,
    undefined,
    { signal: opts?.signal },
  );
}
