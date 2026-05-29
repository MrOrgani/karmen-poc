import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  recordDecision,
  type DecisionResponse,
  type DecisionType,
} from "../api";

export function useRecordDecision(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    DecisionResponse,
    Error,
    { decision: DecisionType; justification: string }
  >({
    mutationFn: ({ decision, justification }) =>
      recordDecision(caseId, decision, justification),
    // Le statut du case est muté côté serveur, donc cockpit ET liste doivent refetch.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      void queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}
