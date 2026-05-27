import type { FinancingType } from './types';

/**
 * Source de vérité unique pour les exigences documentaires d'un dossier crédit.
 *
 * Consommée à la fois par :
 * - `CompletenessEngine` (verdict complet/manquant + détail des items à demander),
 * - `computeDataCoverage` (gating doc → KPI, ex. liasse N-1 manquante).
 *
 * Avant ce module, les seuils "2 liasses, 12 mois" étaient codés en dur dans
 * 2 modules indépendants. Si demain la différenciation prêt/factoring se
 * concrétise (arbitrage produit déjà acté), c'est ici qu'elle s'exprime.
 */
export type DocumentRequirements = {
  /** Nombre minimum de liasses fiscales attendues (généralement 2 = N et N-1). */
  minLiasses: number;
  /** Si vrai, la comparaison vs N-1 est attendue → la liasse N-1 est requise. */
  requirePreviousYearLiasse: boolean;
  /** Mois minimum de relevés bancaires attendus par compte. */
  minMonthsPerBankAccount: number;
};

const BASE: DocumentRequirements = {
  minLiasses: 2,
  requirePreviousYearLiasse: true,
  minMonthsPerBankAccount: 12,
};

/**
 * Aujourd'hui : prêt et affacturage partagent les mêmes exigences. Différencier
 * ici si l'arbitrage produit factoring (balance âgée, concentration client)
 * change la politique documentaire.
 */
const REQUIREMENTS_BY_TYPE: Record<FinancingType, DocumentRequirements> = {
  loan: BASE,
  factoring: BASE,
};

export function documentRequirementsFor(
  type: FinancingType,
): DocumentRequirements {
  return REQUIREMENTS_BY_TYPE[type];
}
