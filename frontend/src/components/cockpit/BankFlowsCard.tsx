import type { AugmentedDossier } from '@/lib/types';
import { CollapsibleSection } from './CollapsibleSection';
import { Landmark } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

type Props = { bank: AugmentedDossier['bankFlows'] };

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-karmen-pale-blue/40 border border-karmen-border-blue/40 p-3">
      <div className="text-[10px] text-karmen-mute uppercase tracking-widest font-semibold">{label}</div>
      <div className="text-lg font-semibold text-karmen-ink mt-1 leading-tight">{value}</div>
    </div>
  );
}

export function BankFlowsCard({ bank }: Props) {
  return (
    <CollapsibleSection
      title="Flux bancaires (12 mois)"
      icon={<Landmark aria-hidden className="h-4 w-4 text-karmen-blue" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <KV label="Entrées moyennes" value={`${formatCurrency(bank.monthlyInflowsAverage)} / mois`} />
        <KV label="Sorties moyennes" value={`${formatCurrency(bank.monthlyOutflowsAverage)} / mois`} />
        <KV label="Jours de découvert" value={`${bank.overdraftDaysLast12m} j / 12 mois`} />
        <KV label="Rejets de paiement" value={`${bank.rejectedPaymentsCount}`} />
      </div>
    </CollapsibleSection>
  );
}
