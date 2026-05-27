import { formatCurrency, NBSP } from '@/lib/format';
import type { AugmentedDossier, DataCoverage, FinancialThresholds, MetricStatuses } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Landmark } from 'lucide-react';
import { MetricTile } from './MetricTile';
import { SectionCard } from './SectionCard';

type Props = {
  bank: AugmentedDossier['bankFlows'];
  thresholds: FinancialThresholds;
  statuses: MetricStatuses;
  coverage: DataCoverage;
};

export function BankFlowsCard({ bank, thresholds, statuses, coverage }: Props) {
  const partial = !coverage.bankCoverageFull;

  return (
    <SectionCard
      title={`Flux bancaires (${coverage.bankMonthsCovered}${NBSP}mois)`}
      icon={<Landmark aria-hidden className="h-4 w-4 text-karmen-blue" />}
    >
      {partial && (
        <div
          role="note"
          className="mb-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          <AlertTriangle aria-hidden className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Couverture {coverage.bankMonthsCovered}/12 mois</span> — chiffres extrapolés,
            fiabilité réduite. Demander les relevés complémentaires pour fiabiliser.
          </span>
        </div>
      )}
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', partial && 'opacity-60')}>
        <MetricTile label="Entrées moyennes" value={`${formatCurrency(bank.monthlyInflowsAverage)}${NBSP}/${NBSP}mois`} threshold={thresholds.monthlyInflowsAverage} status={statuses.monthlyInflowsAverage} />
        <MetricTile label="Sorties moyennes" value={`${formatCurrency(bank.monthlyOutflowsAverage)}${NBSP}/${NBSP}mois`} threshold={thresholds.monthlyOutflowsAverage} status={statuses.monthlyOutflowsAverage} />
        <MetricTile label="Jours de découvert" value={`${bank.overdraftDaysLast12m}${NBSP}j${NBSP}/${NBSP}12${NBSP}mois`} threshold={thresholds.overdraftDaysLast12m} status={statuses.overdraftDaysLast12m} />
        <MetricTile label="Rejets de paiement" value={`${bank.rejectedPaymentsCount}`} threshold={thresholds.rejectedPaymentsCount} status={statuses.rejectedPaymentsCount} />
      </div>
    </SectionCard>
  );
}
