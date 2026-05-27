import type { AugmentedDossier, RiskBucket, ScoreExplanation } from '@/lib/types';
import { CollapsibleSection } from './CollapsibleSection';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUCKET_LABEL: Record<RiskBucket, string> = {
  low: 'Risque faible',
  medium: 'Risque modéré',
  high: 'Risque élevé',
};

const BUCKET_BADGE: Record<RiskBucket, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  medium: 'bg-amber-50 text-amber-800 border-amber-300',
  high: 'bg-destructive/10 text-destructive border-destructive/40',
};

type Props = {
  score: AugmentedDossier['score'];
  explanation: ScoreExplanation;
};

export function ScoreCard({ score, explanation }: Props) {
  return (
    <CollapsibleSection
      title="Score de risque"
      icon={<Target aria-hidden className="h-4 w-4 text-karmen-blue" />}
      sectionId="score"
      badge={
        <span className={cn('ml-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', BUCKET_BADGE[score.risk_bucket])}>
          <span className="tabular-nums">{score.global_score}/100</span>
          <span className="hidden sm:inline opacity-80">· {BUCKET_LABEL[score.risk_bucket]}</span>
        </span>
      }
    >
      <ul className="space-y-2.5 text-sm">
        {explanation.bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-karmen-blue shrink-0" />
            <span className="text-karmen-ink">{bullet}</span>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
