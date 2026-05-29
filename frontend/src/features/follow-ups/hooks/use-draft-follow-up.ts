import { useQuery } from "@tanstack/react-query";
import { draftFollowUp, type FollowUpDraft } from "../api";

// POST utilisé en lecture paresseuse (génération idempotente, déclenchée à l'ouverture).
export function useDraftFollowUp(caseId: string, enabled: boolean) {
  return useQuery<FollowUpDraft>({
    queryKey: ["follow-up-draft", caseId],
    queryFn: ({ signal }) => draftFollowUp(caseId, { signal }),
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });
}
