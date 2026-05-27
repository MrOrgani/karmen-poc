import { Link } from '@tanstack/react-router';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { AugmentedDossier } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';

type Props = { dossier: AugmentedDossier };

const TYPE_LABEL: Record<AugmentedDossier['financing_request']['type'], string> = {
  loan: 'Prêt',
  factoring: 'Affacturage',
};

export function CockpitHeader({ dossier }: Props) {
  const { company, financing_request: req } = dossier;
  return (
    <header className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-karmen-blue hover:underline font-medium">
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Tous les dossiers
      </Link>

      <div className="rounded-2xl bg-karmen-pale-blue border border-karmen-border-blue/60 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-karmen-blue text-white">
            <Building2 aria-hidden className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-karmen-marine">
              {company.name}
            </h1>
            <p className="text-sm text-karmen-mute mt-1">
              {company.legalCategory} · {company.businessType} · SIREN {company.siren}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-6 border-t border-karmen-border-blue/60">
          <Stat label="Type" value={TYPE_LABEL[req.type]} />
          <Stat label="Montant" value={formatCurrency(req.amount)} highlight />
          <Stat label="Durée" value={`${req.durationInMonth} mois`} />
          <Stat label="Taux" value={formatPercent(req.interestRate)} />
        </dl>
      </div>
    </header>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-karmen-mute font-medium">{label}</dt>
      <dd className={highlight ? 'text-karmen-blue font-semibold mt-1 text-lg' : 'text-karmen-marine font-medium mt-1'}>
        {value}
      </dd>
    </div>
  );
}
