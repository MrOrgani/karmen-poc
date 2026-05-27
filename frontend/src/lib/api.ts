import type { CockpitResponse, DossierSummary } from './types';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    throw new ApiError(0, `Backend injoignable (${reason})`);
  }
  if (!response.ok) {
    throw new ApiError(response.status, `${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export function getDossiers(): Promise<DossierSummary[]> {
  return request<DossierSummary[]>('/dossiers');
}

export function getCockpit(id: string): Promise<CockpitResponse> {
  return request<CockpitResponse>(`/dossiers/${encodeURIComponent(id)}/cockpit`);
}
