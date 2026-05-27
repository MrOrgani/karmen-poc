import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { RedFlag, Severity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';

const SEVERITY_RANK: Record<Severity, number> = { high: 2, medium: 1, low: 0 };
const SEVERITY_LABEL: Record<Severity, string> = { high: 'Sévérité élevée', medium: 'Sévérité modérée', low: 'Sévérité faible' };

type StyleSet = { wrapper: string; icon: string; dot: string };
const STYLES: Record<Severity, StyleSet> = {
  high: {
    wrapper: 'bg-destructive/5 border-destructive/30 text-destructive',
    icon: 'text-destructive',
    dot: 'bg-destructive',
  },
  medium: {
    wrapper: 'bg-karmen-violet/30 border-karmen-violet text-karmen-marine',
    icon: 'text-karmen-marine',
    dot: 'bg-karmen-marine',
  },
  low: {
    wrapper: 'bg-karmen-lime/20 border-karmen-lime text-karmen-marine',
    icon: 'text-karmen-marine',
    dot: 'bg-karmen-marine',
  },
};

type Props = { redFlags: RedFlag[] };

export function RedFlagsBanner({ redFlags }: Props) {
  if (redFlags.length === 0) {
    return (
      <div role="status" className="rounded-xl border border-karmen-lime bg-karmen-lime/20 px-4 py-3 flex items-start gap-3">
        <CheckCircle2 aria-hidden className="h-5 w-5 text-karmen-marine shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-karmen-marine">Aucune anomalie détectée</p>
          <p className="text-sm text-karmen-marine/70">Tous les indicateurs sont dans les seuils attendus.</p>
        </div>
      </div>
    );
  }

  const worst = redFlags.reduce<Severity>(
    (acc, f) => (f.severity in SEVERITY_RANK && SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc] ? f.severity : acc),
    'low',
  );
  const style = STYLES[worst] ?? STYLES.medium;

  return (
    <Collapsible defaultOpen className="group">
      <div className={cn('rounded-xl border', style.wrapper)}>
        <CollapsibleTrigger className="w-full text-left px-4 py-3 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-inset rounded-xl">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle aria-hidden className={cn('h-5 w-5 shrink-0 mt-0.5', style.icon)} />
            <div>
              <p className="font-semibold leading-tight">
                {redFlags.length} anomalie{redFlags.length > 1 ? 's' : ''} détectée{redFlags.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm opacity-70 mt-0.5">{SEVERITY_LABEL[worst]}</p>
            </div>
          </div>
          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <ul className="space-y-2.5 text-sm pt-2 border-t border-current/10">
            {redFlags.map((flag, idx) => {
              const dotStyle = STYLES[flag.severity] ?? STYLES.medium;
              return (
                <li key={`${flag.code}-${idx}`} className="flex items-start gap-2 pt-2">
                  <span aria-hidden className={cn('mt-1.5 inline-block h-2 w-2 rounded-full shrink-0', dotStyle.dot)} />
                  <div className={cn("min-w-0", dotStyle.icon)}>
                    <span className="font-medium">{flag.label}</span>
                    <span className="opacity-70"> — {flag.value}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
