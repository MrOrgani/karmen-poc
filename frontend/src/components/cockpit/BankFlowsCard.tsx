import type { AugmentedDossier } from '@/lib/types';
import { CollapsibleSection } from './CollapsibleSection';
import { MetricTile } from './MetricTile';
import { Landmark } from 'lucide-react';
import { formatCurrency, NBSP } from '@/lib/format';

type Props = { bank: AugmentedDossier['bankFlows'] };

export function BankFlowsCard({ bank }: Props) {
  return (
    <CollapsibleSection
      title="Flux bancaires (12 mois)"
      icon={<Landmark aria-hidden className="h-4 w-4 text-karmen-blue" />}
      sectionId="bank-flows"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MetricTile label="Entrées moyennes" value={`${formatCurrency(bank.monthlyInflowsAverage)}${NBSP}/${NBSP}mois`} />
        <MetricTile label="Sorties moyennes" value={`${formatCurrency(bank.monthlyOutflowsAverage)}${NBSP}/${NBSP}mois`} />
        <MetricTile label="Jours de découvert" value={`${bank.overdraftDaysLast12m}${NBSP}j${NBSP}/${NBSP}12${NBSP}mois`} />
        <MetricTile label="Rejets de paiement" value={`${bank.rejectedPaymentsCount}`} />
      </div>
    </CollapsibleSection>
  );
}
