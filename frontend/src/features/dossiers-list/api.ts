import type { DossierSummary } from '@/shared/types';
import { request } from '@/shared/lib/http';

export function getDossiers(): Promise<DossierSummary[]> {
  return request<DossierSummary[]>('/dossiers');
}
