import type {
  BankFlows,
  FinancialIndicators,
  MetricStatus,
  MetricStatuses,
} from './types';

const status = (
  value: number,
  okBelow: number,
  warnBelow: number,
): MetricStatus => {
  if (value < okBelow) return 'ok';
  if (value < warnBelow) return 'warn';
  return 'alert';
};

export function computeMetricStatuses(
  fin: FinancialIndicators,
  bank: BankFlows,
): MetricStatuses {
  // Revenue vs N-1 : unknown si N-1 non fournie (liasse manquante).
  let revenue: MetricStatus = 'unknown';
  if (fin.revenuePreviousYear !== null && fin.revenuePreviousYear > 0) {
    const ratio = fin.revenue / fin.revenuePreviousYear;
    revenue = ratio >= 1 ? 'ok' : ratio >= 0.9 ? 'warn' : 'alert';
  }

  // Marge EBITDA : sain >10% / warn 5-10% / alert <5% ou EBITDA ≤ 0.
  let ebitda: MetricStatus;
  if (fin.ebitda <= 0 || fin.revenue <= 0) {
    ebitda = 'alert';
  } else {
    const margin = fin.ebitda / fin.revenue;
    ebitda = margin > 0.1 ? 'ok' : margin >= 0.05 ? 'warn' : 'alert';
  }

  const netIncome: MetricStatus = fin.netIncome >= 0 ? 'ok' : 'alert';

  // Dette / EBITDA : sain <3× / warn 3-5× / alert >5× ou EBITDA ≤ 0.
  let totalDebt: MetricStatus;
  if (fin.ebitda <= 0) {
    totalDebt = 'alert';
  } else {
    const ratio = fin.totalDebt / fin.ebitda;
    totalDebt = ratio < 3 ? 'ok' : ratio <= 5 ? 'warn' : 'alert';
  }

  // Trésorerie vs sorties moyennes : sain ≥1 mois / warn 0.5-1 / alert <0.5.
  let cashPosition: MetricStatus;
  if (bank.monthlyOutflowsAverage <= 0) {
    cashPosition = 'ok';
  } else {
    const months = fin.cashPosition / bank.monthlyOutflowsAverage;
    cashPosition = months >= 1 ? 'ok' : months >= 0.5 ? 'warn' : 'alert';
  }

  // DSO : sain ≤45j / warn 45-60 / alert >60.
  const dso: MetricStatus = status(fin.dso, 45, 60);

  // Inflows vs outflows : sain ≥ / warn 90-100% / alert <90%.
  let monthlyInflowsAverage: MetricStatus;
  if (bank.monthlyOutflowsAverage <= 0) {
    monthlyInflowsAverage = 'ok';
  } else {
    const ratio = bank.monthlyInflowsAverage / bank.monthlyOutflowsAverage;
    monthlyInflowsAverage =
      ratio >= 1 ? 'ok' : ratio >= 0.9 ? 'warn' : 'alert';
  }

  // Outflows : informationnel, pas de seuil propre (mirroir inflows).
  const monthlyOutflowsAverage: MetricStatus = 'ok';

  // Découverts : sain 0j / warn 1-30 / alert >30.
  let overdraftDaysLast12m: MetricStatus;
  if (bank.overdraftDaysLast12m === 0) overdraftDaysLast12m = 'ok';
  else if (bank.overdraftDaysLast12m <= 30) overdraftDaysLast12m = 'warn';
  else overdraftDaysLast12m = 'alert';

  // Rejets : sain 0 / alert ≥1.
  const rejectedPaymentsCount: MetricStatus =
    bank.rejectedPaymentsCount === 0 ? 'ok' : 'alert';

  return {
    revenue,
    ebitda,
    netIncome,
    totalDebt,
    cashPosition,
    dso,
    monthlyInflowsAverage,
    monthlyOutflowsAverage,
    overdraftDaysLast12m,
    rejectedPaymentsCount,
  };
}
