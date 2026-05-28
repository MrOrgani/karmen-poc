import type { AugmentedDossier, DataCoverage } from './types';

// Option 2 hybride : sans liasse N-1, on rend revenuePreviousYear non comparable
// plutôt que d'exposer une valeur non vérifiable côté source documentaire.
export function normalizeFinancialIndicators(
  dossier: AugmentedDossier,
  coverage: DataCoverage,
): AugmentedDossier {
  if (coverage.hasLiassePreviousYear) return dossier;
  return {
    ...dossier,
    financialIndicators: {
      ...dossier.financialIndicators,
      revenuePreviousYear: null,
    },
  };
}
