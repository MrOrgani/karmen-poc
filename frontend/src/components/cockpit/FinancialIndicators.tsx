import type { AugmentedDossier } from '@/lib/types';
import { CollapsibleSection } from './CollapsibleSection';
import { MetricTile } from './MetricTile';
import { TrendingUp } from 'lucide-react';
import { formatCurrency, formatDays, formatDelta, NBSP } from '@/lib/format';

type Props = { fin: AugmentedDossier['financialIndicators'] };

export function FinancialIndicators({ fin }: Props) {
  const margin = fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
  const debtRatio = fin.ebitda > 0 ? fin.totalDebt / fin.ebitda : null;

  return (
    <CollapsibleSection
      title="Santé financière"
      icon={<TrendingUp aria-hidden className="h-4 w-4 text-karmen-blue" />}
      sectionId="financial-indicators"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MetricTile label="CA N" value={formatCurrency(fin.revenue)} hint={`${formatDelta(fin.revenue, fin.revenuePreviousYear)} vs N-1`} />
        <MetricTile label="EBITDA" value={formatCurrency(fin.ebitda)} hint={`${margin.toFixed(1)}${NBSP}% de marge`} />
        <MetricTile label="Résultat net" value={formatCurrency(fin.netIncome)} />
        <MetricTile label="Dette totale" value={formatCurrency(fin.totalDebt)} hint={debtRatio !== null ? `${debtRatio.toFixed(2)}${NBSP}× EBITDA` : 'EBITDA ≤ 0'} />
        <MetricTile label="Trésorerie" value={formatCurrency(fin.cashPosition)} />
        <MetricTile label="DSO" value={formatDays(fin.dso)} />
      </div>
    </CollapsibleSection>
  );
}
