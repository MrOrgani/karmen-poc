import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Info } from 'lucide-react';
import type { MetricStatus, MetricThreshold } from '@/shared/types';
import { cn } from '@/shared/lib/utils';

type Props = {
  label: string;
  value: string;
  hint?: string;
  threshold?: MetricThreshold;
  status?: MetricStatus;
  /** Si défini, indique que la valeur ne peut être calculée (doc manquant). */
  unavailableReason?: string;
};

const STATUS_STYLES: Record<MetricStatus, { wrapper: string; label: string }> = {
  ok: {
    wrapper: 'bg-emerald-50 border-emerald-300',
    label: 'text-emerald-800',
  },
  warn: {
    wrapper: 'bg-amber-50 border-amber-300',
    label: 'text-amber-800',
  },
  alert: {
    wrapper: 'bg-rose-50 border-rose-300',
    label: 'text-rose-800',
  },
  unknown: {
    wrapper: 'bg-karmen-pale-blue/30 border-dashed border-karmen-mute/40',
    label: 'text-karmen-mute',
  },
};

export function MetricTile({
  label,
  value,
  hint,
  threshold,
  status,
  unavailableReason,
}: Props) {
  const effectiveStatus: MetricStatus | undefined = unavailableReason ? 'unknown' : status;
  const style = effectiveStatus
    ? STATUS_STYLES[effectiveStatus]
    : { wrapper: 'bg-karmen-pale-blue/40 border-karmen-border-blue/40', label: 'text-karmen-mute' };

  return (
    <div className={cn('rounded-lg border p-3', style.wrapper)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('text-[10px] uppercase tracking-widest font-semibold', style.label)}>{label}</div>
        {threshold && (
          <Popover>
            <PopoverTrigger
              aria-label={`Méthodologie pour ${label}`}
              className="-mt-0.5 -mr-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-karmen-mute hover:text-karmen-blue hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-offset-1 transition-colors motion-reduce:transition-none"
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
                <p className="font-medium text-karmen-marine tabular-nums mt-0.5">{threshold.rule}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-karmen-mute">Pourquoi</span>
                <p className="text-karmen-ink mt-0.5">{threshold.rationale}</p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {unavailableReason ? (
        <>
          <div className="text-lg font-semibold text-karmen-mute mt-1 leading-tight">—</div>
          <div className="text-xs text-karmen-mute mt-0.5 italic">{unavailableReason}</div>
        </>
      ) : (
        <>
          <div className="text-lg font-semibold text-karmen-ink mt-1 leading-tight tabular-nums">{value}</div>
          {hint && <div className="text-xs text-karmen-mute mt-0.5 tabular-nums">{hint}</div>}
        </>
      )}
    </div>
  );
}
