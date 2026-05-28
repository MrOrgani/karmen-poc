import { useQuery } from '@tanstack/react-query';
import { draftRelance, type RelanceDraft } from '../api';

// POST utilisé en lecture paresseuse (génération idempotente, déclenchée à l'ouverture).
export function useDraftRelance(dossierId: string, enabled: boolean) {
  return useQuery<RelanceDraft>({
    queryKey: ['relance-draft', dossierId],
    queryFn: ({ signal }) => draftRelance(dossierId, { signal }),
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });
}
