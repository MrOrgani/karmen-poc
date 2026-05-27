import { Link } from '@tanstack/react-router';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { AugmentedDossier, RiskBucket } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatMonths, formatPercent } from '@/lib/format';

type Props = { dossier: AugmentedDossier };

const TYPE_LABEL: Record<AugmentedDossier['financing_request']['type'], string> = {
  loan: 'Prêt',
  factoring: 'Affacturage',
};

const BUCKET_LABEL: Record<RiskBucket, string> = {
  low: 'Risque faible',
  medium: 'Risque modéré',
  high: 'Risque élevé',
};

const SCORE_CHIP_TONE: Record<RiskBucket, string> = {
  low: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
  medium: 'bg-amber-50 text-amber-800 border border-amber-300',
  high: 'bg-destructive/10 text-destructive border border-destructive/40',
};

const SCORE_DOT: Record<RiskBucket, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-destructive',
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
              {company.legalCategory} · {company.businessType} · SIREN <span className="tabular-nums" translate="no">{company.siren}</span>
            </p>
          </div>
          <div
            className={cn(
              'shrink-0 hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
              SCORE_CHIP_TONE[dossier.score.risk_bucket],
            )}
            aria-label={`Score ${dossier.score.global_score} sur 100, ${BUCKET_LABEL[dossier.score.risk_bucket]}`}
          >
            <span aria-hidden className={cn('h-2 w-2 rounded-full', SCORE_DOT[dossier.score.risk_bucket])} />
            <span className="tabular-nums font-semibold">{dossier.score.global_score}</span>
            <span className="text-xs opacity-70">/100</span>
            <span className="hidden md:inline text-xs opacity-70">· {BUCKET_LABEL[dossier.score.risk_bucket]}</span>
          </div>
        </div>

        {/* Mobile score chip — full width below name */}
        <div
          className={cn(
            'sm:hidden mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
            SCORE_CHIP_TONE[dossier.score.risk_bucket],
          )}
        >
          <span aria-hidden className={cn('h-2 w-2 rounded-full', SCORE_DOT[dossier.score.risk_bucket])} />
          <span className="tabular-nums font-semibold">{dossier.score.global_score}</span>
          <span className="text-xs opacity-70">/100 · {BUCKET_LABEL[dossier.score.risk_bucket]}</span>
        </div>

        <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-6 border-t border-karmen-border-blue/60">
          <Stat label="Type" value={TYPE_LABEL[req.type]} />
          <Stat label="Montant" value={formatCurrency(req.amount)} tone="primary" numeric />
          <Stat label="Durée" value={formatMonths(req.durationInMonth)} numeric />
          <Stat label="Taux" value={formatPercent(req.interestRate)} numeric />
        </dl>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
  numeric = false,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'primary';
  numeric?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-karmen-mute font-medium">{label}</dt>
      <dd
        className={[
          'mt-1',
          tone === 'primary' ? 'text-karmen-blue font-semibold text-lg' : 'text-karmen-marine font-medium',
          numeric ? 'tabular-nums' : '',
        ].filter(Boolean).join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}
