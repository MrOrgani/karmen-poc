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
  low: 'bg-karmen-lime text-karmen-marine',
  medium: 'bg-karmen-violet text-karmen-marine',
  high: 'bg-destructive/10 text-destructive border border-destructive/30',
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
      badge={
        <span className={cn('ml-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', BUCKET_BADGE[score.risk_bucket])}>
          <span>{score.global_score}/100</span>
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
