import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordDecision, type DecisionResponse, type DecisionType } from '../api';

export function useRecordDecision(dossierId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    DecisionResponse,
    Error,
    { decision: DecisionType; justification: string }
  >({
    mutationFn: ({ decision, justification }) =>
      recordDecision(dossierId, decision, justification),
    // Invalide la lecture cockpit pour refléter la décision sans refetch manuel.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cockpit', dossierId] });
    },
  });
}
