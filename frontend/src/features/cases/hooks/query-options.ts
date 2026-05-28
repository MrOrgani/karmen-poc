import { queryOptions } from '@tanstack/react-query';
import { fetchCase, fetchCases } from '@/features/cases/api';

export const getCasesQueryOptions = () =>
  queryOptions({
    queryKey: ['cases'] as const,
    queryFn: fetchCases,
  });

export const getCaseQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['cases', id] as const,
    queryFn: () => fetchCase(id),
  });
