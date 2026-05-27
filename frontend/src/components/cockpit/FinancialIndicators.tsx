import type { AugmentedDossier, FinancialThresholds, MetricStatuses } from '@/lib/types';
import { SectionCard } from './SectionCard';
import { MetricTile } from './MetricTile';
import { TrendingUp } from 'lucide-react';
import { formatCurrency, formatDays, formatDelta, NBSP } from '@/lib/format';

type Props = {
  fin: AugmentedDossier['financialIndicators'];
  thresholds: FinancialThresholds;
  statuses: MetricStatuses;
};

export function FinancialIndicators({ fin, thresholds, statuses }: Props) {
  const margin = fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
  const debtRatio = fin.ebitda > 0 ? fin.totalDebt / fin.ebitda : null;
  const hasPrev = fin.revenuePreviousYear !== null;

  return (
    <SectionCard
      title="Santé financière"
      icon={<TrendingUp aria-hidden className="h-4 w-4 text-karmen-blue" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricTile
          label="CA N"
          value={formatCurrency(fin.revenue)}
          hint={hasPrev ? `${formatDelta(fin.revenue, fin.revenuePreviousYear)} vs N-1` : 'vs N-1 : liasse 2023 manquante'}
          threshold={thresholds.revenue}
          status={statuses.revenue}
        />
        <MetricTile label="EBITDA" value={formatCurrency(fin.ebitda)} hint={`${margin.toFixed(1)}${NBSP}% de marge`} threshold={thresholds.ebitda} status={statuses.ebitda} />
        <MetricTile label="Résultat net" value={formatCurrency(fin.netIncome)} threshold={thresholds.netIncome} status={statuses.netIncome} />
        <MetricTile label="Dette totale" value={formatCurrency(fin.totalDebt)} hint={debtRatio !== null ? `${debtRatio.toFixed(2)}${NBSP}× EBITDA` : 'EBITDA ≤ 0'} threshold={thresholds.totalDebt} status={statuses.totalDebt} />
        <MetricTile label="Trésorerie" value={formatCurrency(fin.cashPosition)} threshold={thresholds.cashPosition} status={statuses.cashPosition} />
        <MetricTile label="DSO" value={formatDays(fin.dso)} threshold={thresholds.dso} status={statuses.dso} />
      </div>
    </SectionCard>
  );
}
