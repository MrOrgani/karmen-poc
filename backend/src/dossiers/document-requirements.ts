import type { FinancingType } from './types';

export type DocumentRequirements = {
  minLiasses: number;
  requirePreviousYearLiasse: boolean;
  minMonthsPerBankAccount: number;
};

const BASE: DocumentRequirements = {
  minLiasses: 2,
  requirePreviousYearLiasse: true,
  minMonthsPerBankAccount: 12,
};

const REQUIREMENTS_BY_TYPE: Record<FinancingType, DocumentRequirements> = {
  loan: BASE,
  factoring: BASE,
};

export function documentRequirementsFor(
  type: FinancingType,
): DocumentRequirements {
  return REQUIREMENTS_BY_TYPE[type];
}
