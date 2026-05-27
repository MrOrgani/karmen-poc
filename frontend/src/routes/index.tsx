import { Link, createRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, RefreshCcw, AlertCircle } from 'lucide-react';
import { getDossiers } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { FinancingType, RiskBucket } from '@/lib/types';
import { rootRoute } from './__root';

const RISK_LABEL: Record<RiskBucket, string> = { low: 'Risque faible', medium: 'Risque modéré', high: 'Risque élevé' };

const RISK_PILL: Record<RiskBucket, string> = {
  low: 'bg-karmen-lime text-karmen-marine border-karmen-lime/40',
  medium: 'bg-karmen-violet text-karmen-marine border-karmen-violet/40',
  high: 'bg-destructive/10 text-destructive border-destructive/40',
};

const TYPE_LABEL: Record<FinancingType, string> = { loan: 'Prêt', factoring: 'Affacturage' };

function CompletenessBadge({ score }: { score: number }) {
  if (score === 100) {
    return <Badge className="bg-karmen-lime text-karmen-marine hover:bg-karmen-lime border-0">{score}% complet</Badge>;
  }
  if (score >= 50) {
    return <Badge variant="secondary" className="border-karmen-border-blue">{score}% complet</Badge>;
  }
  return <Badge variant="destructive">{score}% complet</Badge>;
}

function DossiersListPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['dossiers'],
    queryFn: getDossiers,
  });

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
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
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
          {data.map((row) => (
            <Link
              key={row.id}
              to="/dossiers/$id"
              params={{ id: row.id }}
              className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
            >
              <Card className="hover:border-karmen-blue hover:shadow-md hover:-translate-y-0.5 transition-all h-full border-karmen-border-blue/60">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-karmen-ink">{row.companyName}</CardTitle>
                    <CompletenessBadge score={row.completenessScore} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK_PILL[row.riskBucket]}`}>
                      {RISK_LABEL[row.riskBucket]}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="text-muted-foreground">{TYPE_LABEL[row.type] ?? row.type}</span>
                    <span className="text-2xl font-semibold text-karmen-ink leading-none">{formatCurrency(row.amount)}</span>
                  </div>
                  <div className="flex items-center justify-end text-sm text-karmen-blue font-medium">
                    Ouvrir le cockpit <ArrowRight aria-hidden className="h-3.5 w-3.5 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DossiersListPage,
});

