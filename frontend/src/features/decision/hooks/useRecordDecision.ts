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
    // Le statut du dossier est muté côté serveur, donc cockpit ET liste doivent refetch.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cockpit', dossierId] });
      void queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });
}
