import type { AugmentedDossier, DataCoverage } from './types';

/**
 * Application de l'Option 2 hybride (gating doc → KPI) sur les indicateurs
 * financiers d'un dossier.
 *
 * Aujourd'hui : si la liasse N-1 est absente, on nullifie `revenuePreviousYear`
 * de sorte que l'UI bascule en "non comparable" et que la règle
 * `revenue_evolution` reporte un statut `unknown` (au lieu d'utiliser une
 * valeur qui n'a aucune source documentaire vérifiable).
 *
 * Ce module isole *la politique métier* du wiring de l'aggregator. Si demain
 * on durcit ou assouplit la règle (ex. accepter une liasse N-1 même partielle),
 * c'est ici que le changement vit — et il est testable en isolation.
 */
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
