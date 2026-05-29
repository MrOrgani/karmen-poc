import type { AugmentedCase, DataCoverage } from './types';

// Option 2 hybride : sans liasse N-1, on rend revenuePreviousYear non comparable
// plutôt que d'exposer une valeur non vérifiable côté source documentaire.
export function normalizeFinancialIndicators(
  caseData: AugmentedCase,
  coverage: DataCoverage,
): AugmentedCase {
  if (coverage.hasLiassePreviousYear) return caseData;
  return {
    ...caseData,
    financialIndicators: {
      ...caseData.financialIndicators,
      revenuePreviousYear: null,
    },
  };
}
