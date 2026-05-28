import { useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ApiError } from '@/shared/lib/http';
import { track } from '@/shared/lib/track';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { BankFlowsCard } from './components/BankFlowsCard';
import { CockpitHeader } from './components/CockpitHeader';
import { CompletenessSection } from './components/CompletenessSection';
import { FinancialIndicators } from './components/FinancialIndicators';
import { RulesDiagnostic } from './components/RulesDiagnostic';
import { CockpitProvider } from './hooks/useDossierId';
import { RuleHighlightProvider } from './hooks/useRuleHighlight';
import { DecisionPanel } from '@/features/decision/components/DecisionPanel';
import { cockpitQuery } from './api';

export function CockpitPage() {
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
