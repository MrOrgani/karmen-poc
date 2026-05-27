import { useEffect } from 'react';
import { BankFlowsCard } from '@/components/cockpit/BankFlowsCard';
import { CockpitProvider } from '@/components/cockpit/CockpitContext';
import { CompletenessSection } from '@/components/cockpit/CompletenessSection';
import { DecisionPanel } from '@/components/cockpit/DecisionPanel';
import { FinancialIndicators } from '@/components/cockpit/FinancialIndicators';
import { CockpitHeader } from '@/components/cockpit/Header';
import { RuleHighlightProvider } from '@/components/cockpit/RuleHighlightContext';
import { RulesDiagnostic } from '@/components/cockpit/RulesDiagnostic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, getCockpit } from '@/lib/api';
import { track } from '@/lib/track';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Link, createRoute, useParams } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { rootRoute } from './__root';

const cockpitQuery = (id: string) =>
  queryOptions({
    queryKey: ['cockpit', id] as const,
    queryFn: () => getCockpit(id),
  });

function CockpitPage() {
  const { id } = useParams({ from: '/dossiers/$id' });
  const { data: cockpit, isPending, error } = useQuery(cockpitQuery(id));

  useEffect(() => {
    track('dossier.opened', id);
  }, [id]);

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite" aria-label="Chargement du cockpit…">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <Alert variant="destructive" aria-live="polite">
        <AlertCircle aria-hidden className="h-4 w-4" />
        <AlertTitle>Dossier introuvable</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Aucun dossier ne correspond à l’identifiant « {id} ».</p>
          <Button asChild size="sm" variant="outline">
            <Link to="/"><ArrowLeft aria-hidden className="h-3.5 w-3.5 mr-2" />Retour à la liste</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <Alert variant="destructive" aria-live="polite">
        <AlertCircle aria-hidden className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <CockpitProvider dossierId={id}>
      <RuleHighlightProvider>
        <div className="space-y-4">
          <CockpitHeader dossier={cockpit.dossier} />
          <CompletenessSection completeness={cockpit.completeness} documents={cockpit.dossier.documents} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FinancialIndicators
              fin={cockpit.dossier.financialIndicators}
              thresholds={cockpit.financialThresholds}
              statuses={cockpit.metricStatuses}
            />
            <BankFlowsCard
              bank={cockpit.dossier.bankFlows}
              thresholds={cockpit.financialThresholds}
              statuses={cockpit.metricStatuses}
              coverage={cockpit.dataCoverage}
            />
          </div>
          <RulesDiagnostic items={cockpit.rulesDiagnostic} />
          <DecisionPanel score={cockpit.dossier.score} explanation={cockpit.scoreExplanation} />
        </div>
      </RuleHighlightProvider>
    </CockpitProvider>
  );
}

export const dossierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dossiers/$id',
  component: CockpitPage,
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(cockpitQuery(params.id)),
});
