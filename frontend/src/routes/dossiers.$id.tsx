import { Link, createRoute, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ApiError, getCockpit } from '@/lib/api';
import { rootRoute } from './__root';
import { CockpitHeader } from '@/components/cockpit/Header';
import { RedFlagsBanner } from '@/components/cockpit/RedFlagsBanner';
import { CompletenessSection } from '@/components/cockpit/CompletenessSection';
import { ScoreCard } from '@/components/cockpit/ScoreCard';
import { FinancialIndicators } from '@/components/cockpit/FinancialIndicators';
import { BankFlowsCard } from '@/components/cockpit/BankFlowsCard';
import { DecisionPanel } from '@/components/cockpit/DecisionPanel';

function CockpitPage() {
  const { id } = useParams({ from: '/dossiers/$id' });
  const { data: cockpit, isPending, error } = useQuery({
    queryKey: ['cockpit', id],
    queryFn: () => getCockpit(id),
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden className="h-4 w-4" />
        <AlertTitle>Dossier introuvable</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Aucun dossier ne correspond à l'identifiant « {id} ».</p>
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
      <Alert variant="destructive">
        <AlertCircle aria-hidden className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <CockpitHeader dossier={cockpit.dossier} />
      <CompletenessSection completeness={cockpit.completeness} documents={cockpit.dossier.documents} />
      <RedFlagsBanner redFlags={cockpit.redFlags} />
      <ScoreCard score={cockpit.dossier.score} explanation={cockpit.scoreExplanation} />
      <FinancialIndicators fin={cockpit.dossier.financialIndicators} />
      <BankFlowsCard bank={cockpit.dossier.bankFlows} />
      <DecisionPanel dossierId={cockpit.dossier.financing_request.id} />
    </div>
  );
}

export const dossierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dossiers/$id',
  component: CockpitPage,
});
