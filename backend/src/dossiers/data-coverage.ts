import type { AugmentedDossier, DataCoverage } from './types';

const EXPECTED_BANK_MONTHS = 12;

/**
 * Dérive la couverture documentaire d'un dossier — quels KPIs sont calculables
 * et lesquels reposent sur une extrapolation. Pivot de l'Option 2 hybride :
 * hard-gating (revenuePreviousYear nullifiée) + soft-gating (UI signale les
 * KPIs bancaires extrapolés sous EXPECTED_BANK_MONTHS).
 */
export function computeDataCoverage(dossier: AugmentedDossier): DataCoverage {
  const liasseYears = dossier.documents
    .filter((d) => d.type === 'liasse_fiscale')
    .map((d) => d.metadata.year)
    .filter((y): y is number => typeof y === 'number');

  const maxYear = liasseYears.length > 0 ? Math.max(...liasseYears) : null;
  const hasLiassePreviousYear =
    maxYear !== null && liasseYears.includes(maxYear - 1);

  const releves = dossier.documents.filter(
    (d) => d.type === 'releve_bancaire',
  );
  const monthsByAccount = new Map<string, number>();
  for (const doc of releves) {
    const key = doc.metadata.account ?? doc.metadata.bank ?? doc.id;
    monthsByAccount.set(
      key,
      (monthsByAccount.get(key) ?? 0) + (doc.metadata.months_covered ?? 0),
    );
  }
  const bankMonthsCovered =
    monthsByAccount.size === 0
      ? 0
      : Math.min(...Array.from(monthsByAccount.values()));

  return {
    hasLiassePreviousYear,
    bankMonthsCovered,
    bankCoverageFull: bankMonthsCovered >= EXPECTED_BANK_MONTHS,
  };
}
