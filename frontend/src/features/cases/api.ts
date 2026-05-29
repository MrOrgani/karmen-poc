import type { CaseCockpit, CaseSummary } from "@/shared/types";
import { get } from "@/shared/lib/http";

export function fetchCases(): Promise<CaseSummary[]> {
  return get<CaseSummary[]>("/cases");
}

export function fetchCase(id: string): Promise<CaseCockpit> {
  return get<CaseCockpit>(`/cases/${encodeURIComponent(id)}/cockpit`);
}
