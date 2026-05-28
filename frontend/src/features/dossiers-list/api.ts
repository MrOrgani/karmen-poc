import { queryOptions } from '@tanstack/react-query';
import type { DossierSummary } from '@/shared/types';
import { request } from '@/shared/lib/http';

export function getDossiers(): Promise<DossierSummary[]> {
  return request<DossierSummary[]>('/dossiers');
}

export const dossiersQuery = queryOptions({
  queryKey: ['dossiers'] as const,
  queryFn: getDossiers,
});
