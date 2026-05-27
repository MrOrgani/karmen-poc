import type { AugmentedDossier } from '@/lib/types';
import { CollapsibleSection } from './CollapsibleSection';
import { TrendingUp } from 'lucide-react';
import { formatCurrency, formatDelta } from '@/lib/format';

type Props = { fin: AugmentedDossier['financialIndicators'] };

function KV({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-karmen-pale-blue/40 border border-karmen-border-blue/40 p-3">
      <div className="text-[10px] text-karmen-mute uppercase tracking-widest font-semibold">{label}</div>
      <div className="text-lg font-semibold text-karmen-ink mt-1 leading-tight">{value}</div>
      {hint && <div className="text-xs text-karmen-mute mt-0.5">{hint}</div>}
    </div>
  );
}

export function FinancialIndicators({ fin }: Props) {
  const margin = fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
  const debtRatio = fin.ebitda > 0 ? fin.totalDebt / fin.ebitda : null;

  return (
    <CollapsibleSection
      title="Santé financière"
      icon={<TrendingUp aria-hidden className="h-4 w-4 text-karmen-blue" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <KV label="CA N" value={formatCurrency(fin.revenue)} hint={`${formatDelta(fin.revenue, fin.revenuePreviousYear)} vs N-1`} />
        <KV label="EBITDA" value={formatCurrency(fin.ebitda)} hint={`${margin.toFixed(1)}% de marge`} />
        <KV label="Résultat net" value={formatCurrency(fin.netIncome)} />
        <KV label="Dette totale" value={formatCurrency(fin.totalDebt)} hint={debtRatio !== null ? `${debtRatio.toFixed(2)}× EBITDA` : 'EBITDA ≤ 0'} />
        <KV label="Trésorerie" value={formatCurrency(fin.cashPosition)} />
        <KV label="DSO" value={`${fin.dso} jours`} />
      </div>
    </CollapsibleSection>
  );
}
