import { useEffect, useRef } from 'react';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  FileWarning,
  Landmark,
  RefreshCcw,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { formatCurrency } from '@/shared/lib/format';
import { track } from '@/shared/lib/track';
import { cn } from '@/shared/lib/utils';
import type { FinancingType, RiskBucket } from '@/shared/types';
import { getDossiers } from './api';

const RISK_LABEL: Record<RiskBucket, string> = { low: 'Risque faible', medium: 'Risque modéré', high: 'Risque élevé' };

const RISK_DOT: Record<RiskBucket, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-destructive',
};

const SCORE_TONE: Record<RiskBucket, string> = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-destructive',
};

const TYPE_LABEL: Record<FinancingType, string> = { loan: 'Prêt', factoring: 'Affacturage' };

const TYPE_ICON: Record<FinancingType, typeof Banknote> = {
  loan: Landmark,
  factoring: Banknote,
};

export const dossiersQuery = queryOptions({
  queryKey: ['dossiers'] as const,
  queryFn: getDossiers,
});

export function DossiersListPage() {
  const { data, isPending, error, refetch } = useQuery(dossiersQuery);

  const viewedRef = useRef(false);
  useEffect(() => {
    if (data && !viewedRef.current) {
      viewedRef.current = true;
      track('dossier.list.viewed', undefined, { count: data.length });
    }
  }, [data]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-karmen-blue font-semibold">Pipeline analyste</p>
        <h1 className="text-3xl md:text-4xl font-bold text-karmen-marine mt-2 tracking-tight">Dossiers à traiter</h1>
        <p className="text-sm text-karmen-mute mt-3 max-w-prose">
          Sélectionne un dossier pour ouvrir son cockpit unifié : complétude, score, indicateurs financiers et red flags en une seule vue.
        </p>
      </header>

      {isPending && (
        <div className="grid gap-3 md:grid-cols-2" aria-busy="true" aria-live="polite" aria-label="Chargement des dossiers…">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      )}

      {error && (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle aria-hidden className="h-4 w-4" />
          <AlertTitle>Backend injoignable</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error instanceof Error ? error.message : String(error)}</p>
            <p className="text-xs">Vérifie que <code>npm run dev:back</code> tourne sur le port 3000.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCcw aria-hidden className="h-3.5 w-3.5 mr-2" /> Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((row) => {
            const TypeIcon = TYPE_ICON[row.type] ?? Banknote;
            const isComplete = row.completenessScore === 100;
            return (
              <Link
                key={row.id}
                to="/dossiers/$id"
                params={{ id: row.id }}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
              >
                <Card
                  className={cn(
                    'group relative h-full overflow-hidden bg-white border-karmen-border-blue/60',
                    'hover:border-karmen-blue hover:shadow-[0_8px_28px_-12px_rgba(27,95,255,0.25)] hover:-translate-y-0.5',
                    'transition-[border-color,box-shadow,transform] duration-200 ease-out',
                    'motion-reduce:transform-none motion-reduce:transition-none',
                  )}
                >
                  <CardContent className="p-5 flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 min-w-0 text-[11px] uppercase tracking-[0.14em] text-karmen-mute font-medium">
                        <TypeIcon aria-hidden className="h-3.5 w-3.5 text-karmen-blue shrink-0" />
                        <span className="truncate">{TYPE_LABEL[row.type] ?? row.type}</span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'inline-flex items-center justify-center h-7 w-7 rounded-full shrink-0',
                          'bg-karmen-pale-blue text-karmen-blue',
                          'group-hover:bg-karmen-blue group-hover:text-white',
                          'transition-[background-color,color,transform] duration-200',
                          'group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0',
                        )}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-3xl md:text-[2rem] leading-none font-semibold text-karmen-marine tracking-tight tabular-nums">
                        {formatCurrency(row.amount)}
                      </div>
                      <h2
                        className="mt-2 text-sm font-medium text-karmen-ink truncate"
                        title={row.companyName}
                      >
                        {row.companyName}
                      </h2>
                    </div>

                    <div aria-hidden className="h-px bg-karmen-border-blue/60" />

                    <div className="flex items-center justify-between gap-3 mt-auto">
                      <div className="flex items-center gap-4 min-w-0 text-xs">
                        <span className="inline-flex items-center gap-1.5 min-w-0 text-karmen-ink">
                          <span
                            aria-hidden
                            className={cn('h-1.5 w-1.5 rounded-full shrink-0', RISK_DOT[row.riskBucket])}
                          />
                          <span className="truncate">{RISK_LABEL[row.riskBucket]}</span>
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 min-w-0',
                            isComplete ? 'text-karmen-mute' : 'text-destructive',
                          )}
                        >
                          {isComplete ? (
                            <CheckCircle2 aria-hidden className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <FileWarning aria-hidden className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">
                            {isComplete ? 'Documents complets' : 'Documents manquants'}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 shrink-0">
                        <span
                          className={cn(
                            'text-lg font-semibold tabular-nums leading-none',
                            SCORE_TONE[row.riskBucket],
                          )}
                        >
                          {row.globalScore}
                        </span>
                        <span className="text-[11px] text-karmen-mute leading-none">/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
