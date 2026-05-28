import type { AugmentedCase, DataCoverage } from './types';

// Option 2 hybride : sans liasse N-1, on rend revenuePreviousYear non comparable
// plutôt que d'exposer une valeur non vérifiable côté source documentaire.
export function normalizeFinancialIndicators(
  case_: AugmentedCase,
  coverage: DataCoverage,
): AugmentedCase {
  if (coverage.hasLiassePreviousYear) return case_;
  return {
    ...case_,
    financialIndicators: {
      ...case_.financialIndicators,
      revenuePreviousYear: null,
    },
  };
}
