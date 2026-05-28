import { documentRequirementsFor } from './document-requirements';
import type { AugmentedCase, DataCoverage } from './types';

export function computeDataCoverage(case_: AugmentedCase): DataCoverage {
  const requirements = documentRequirementsFor(case_.financing_request.type);

  const liasseYears = case_.documents
    .filter((d) => d.type === 'liasse_fiscale')
    .map((d) => d.metadata.year)
    .filter((y): y is number => typeof y === 'number');

  const maxYear = liasseYears.length > 0 ? Math.max(...liasseYears) : null;
  const hasLiassePreviousYear =
    !requirements.requirePreviousYearLiasse ||
    (maxYear !== null && liasseYears.includes(maxYear - 1));

  const releves = case_.documents.filter((d) => d.type === 'releve_bancaire');
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
    bankCoverageFull: bankMonthsCovered >= requirements.minMonthsPerBankAccount,
  };
}
