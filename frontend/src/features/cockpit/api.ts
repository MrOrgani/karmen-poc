import { queryOptions } from '@tanstack/react-query';
import type { CockpitResponse } from '@/shared/types';
import { request } from '@/shared/lib/http';

export function getCockpit(id: string): Promise<CockpitResponse> {
  return request<CockpitResponse>(`/dossiers/${encodeURIComponent(id)}/cockpit`);
}

export const cockpitQuery = (id: string) =>
  queryOptions({
    queryKey: ['cockpit', id] as const,
    queryFn: () => getCockpit(id),
  });
