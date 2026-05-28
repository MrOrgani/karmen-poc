import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import type { MetricStatus, RedFlagCategory, RuleDiagnosticItem } from '@/shared/types';
import { cn } from '@/shared/lib/utils';
import { Briefcase, Info, Landmark, ListChecks, TrendingUp } from 'lucide-react';
import { SectionCard } from './section-card';
import { useHighlightedCodes } from '@/features/cases/hooks/use-rule-highlight';

type Props = {
  items: RuleDiagnosticItem[];
};

const DOT_CLASS: Record<MetricStatus, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  alert: 'bg-rose-500',
  unknown: 'bg-karmen-mute/50 ring-1 ring-karmen-mute/40 ring-offset-1',
};

const LABEL_CLASS: Record<MetricStatus, string> = {
  ok: 'text-emerald-900',
  warn: 'text-amber-900',
  alert: 'text-rose-900',
  unknown: 'text-karmen-mute',
};

const VALUE_CLASS: Record<MetricStatus, string> = {
  ok: 'text-emerald-700',
  warn: 'text-amber-700',
  alert: 'text-rose-700',
  unknown: 'text-karmen-mute',
};

const CATEGORY_META: Record<RedFlagCategory, { title: string; icon: typeof TrendingUp }> = {
  financial: { title: 'Santé financière', icon: TrendingUp },
  bank: { title: 'Flux bancaires', icon: Landmark },
  factoring: { title: 'Qualité créances (affacturage)', icon: Briefcase },
};

const CATEGORY_ORDER: RedFlagCategory[] = ['financial', 'bank', 'factoring'];

export function RulesDiagnostic({ items }: Props) {
  const highlightedCodes = useHighlightedCodes();
  const grouped: Record<RedFlagCategory, RuleDiagnosticItem[]> = { financial: [], bank: [], factoring: [] };
  for (const item of items) grouped[item.category].push(item);

  return (
    <SectionCard
      title="Diagnostic règles"
      icon={<ListChecks aria-hidden className="h-4 w-4 text-karmen-blue" />}
    >
      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const list = grouped[cat];
          if (list.length === 0) return null;
          const { title, icon: Icon } = CATEGORY_META[cat];
          return (
            <section key={cat} aria-label={title}>
              <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-karmen-mute mb-2">
                <Icon aria-hidden className="h-3.5 w-3.5" />
                {title}
                <span className="opacity-60 normal-case tracking-normal">· {list.length}</span>
              </h3>
              <ul className="space-y-1.5">
                {list.map((item) => {
                  const status = item.unavailableReason ? 'unknown' : item.status;
                  const highlighted = highlightedCodes.has(item.code);
                  return (
                    <li
                      key={item.code}
                      id={`rule-${item.code}`}
                      className={cn(
                        'rounded-md px-3 py-2 flex items-center gap-3 transition-shadow motion-reduce:transition-none',
                        highlighted && 'ring-2 ring-karmen-blue ring-offset-1',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn('inline-block h-2.5 w-2.5 rounded-full shrink-0', DOT_CLASS[status])}
                      />
                      <span className={cn('text-sm font-medium flex-1 min-w-0', LABEL_CLASS[status])}>
                        {item.label}
                      </span>
                      <span className={cn('text-sm font-semibold tabular-nums shrink-0', VALUE_CLASS[status])}>
                        {item.unavailableReason ? '—' : item.value}
                      </span>
                      <Popover>
                        <PopoverTrigger
                          aria-label={`Méthodologie pour ${item.label}`}
                          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-karmen-mute hover:text-karmen-blue hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-offset-1 transition-colors motion-reduce:transition-none"
                        >
                          <Info aria-hidden className="h-3.5 w-3.5" />
                        </PopoverTrigger>
                        <PopoverContent
                          side="top"
                          align="end"
                          className="w-72 text-xs leading-snug p-3 space-y-2"
                        >
                          <div>
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-karmen-mute">Règle</span>
                            <p className="font-medium text-karmen-marine tabular-nums mt-0.5">{item.threshold}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-karmen-mute">Pourquoi</span>
                            <p className="text-karmen-ink mt-0.5">{item.rationale}</p>
                          </div>
                          {item.unavailableReason && (
                            <div className="pt-1 border-t border-karmen-border-blue/40">
                              <span className="text-[10px] uppercase tracking-widest font-semibold text-karmen-mute">État</span>
                              <p className="text-karmen-mute mt-0.5 italic">{item.unavailableReason}</p>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </SectionCard>
  );
}
