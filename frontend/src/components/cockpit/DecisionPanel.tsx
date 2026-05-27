import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, HelpCircle, XCircle, FileSignature, Loader2, ArrowRight } from 'lucide-react';
import { recordDecision, type DecisionType } from '@/lib/api';
import { useDossierId } from './CockpitContext';
import { useHighlight } from './RuleHighlightContext';
import type { AugmentedDossier, RiskBucket, ScoreExplanation } from '@/lib/types';
import { cn } from '@/lib/utils';

type Status =
  | { phase: 'idle' }
  | { phase: 'submitting'; decision: DecisionType }
  | { phase: 'done'; decision: DecisionType; ts: number }
  | { phase: 'error'; decision: DecisionType; message: string };

const LABEL: Record<DecisionType, string> = {
  approve: 'approuvé',
  request_docs: 'mis en attente de docs',
  reject: 'refusé',
};

const BUCKET_LABEL: Record<RiskBucket, string> = {
  low: 'Risque faible',
  medium: 'Risque modéré',
  high: 'Risque élevé',
};

const BUCKET_BADGE: Record<RiskBucket, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  medium: 'bg-amber-50 text-amber-800 border-amber-300',
  high: 'bg-rose-50 text-rose-800 border-rose-300',
};

type Props = {
  score: AugmentedDossier['score'];
  explanation: ScoreExplanation;
};

export function DecisionPanel({ score, explanation }: Props) {
  const dossierId = useDossierId();
  const highlight = useHighlight();
  const [justification, setJustification] = useState('');
  const [status, setStatus] = useState<Status>({ phase: 'idle' });

  const handle = async (decision: DecisionType) => {
    setStatus({ phase: 'submitting', decision });
    try {
      const res = await recordDecision(dossierId, decision, justification);
      setStatus({ phase: 'done', decision, ts: res.ts });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (import.meta.env.DEV) console.error('🚨 [DecisionPanel.handle]', err);
      setStatus({ phase: 'error', decision, message });
    }
  };

  const submitting = status.phase === 'submitting';
  const done = status.phase === 'done';
  const disabledAll = submitting || done;

  return (
    <Card className="border-karmen-border-blue/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-karmen-ink flex items-center gap-2">
          <FileSignature aria-hidden className="h-4 w-4 text-karmen-blue" />
          Décision finale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <section
          aria-label="Synthèse pour décision"
          className="rounded-lg border border-karmen-border-blue/60 bg-karmen-pale-blue/30 p-3 space-y-3"
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-karmen-mute">Score Karmen estimé</span>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', BUCKET_BADGE[score.risk_bucket])}>
              <span className="tabular-nums">{score.global_score}/100</span>
              <span className="opacity-80">· {BUCKET_LABEL[score.risk_bucket]}</span>
            </span>
          </div>
          <p className="text-[11px] text-karmen-mute italic">
            Clique sur une ligne pour situer les règles concernées dans le diagnostic.
          </p>
          <ul className="space-y-1.5 text-sm">
            {explanation.bullets.map((bullet, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => highlight(bullet.ruleCodes)}
                  className="group w-full text-left flex items-center gap-2 rounded-md border border-karmen-border-blue/60 bg-white px-3 py-2 hover:bg-karmen-pale-blue/60 hover:border-karmen-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-offset-1 transition-colors motion-reduce:transition-none cursor-pointer"
                >
                  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-karmen-blue shrink-0" />
                  <span className="text-karmen-ink flex-1">{bullet.text}</span>
                  <ArrowRight
                    aria-hidden
                    className="h-3.5 w-3.5 shrink-0 text-karmen-blue transition-transform motion-reduce:transition-none group-hover:translate-x-0.5"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handle('approve')}
            disabled={disabledAll}
            className="bg-karmen-blue hover:bg-karmen-blue-dark text-white font-medium"
          >
            {submitting && status.decision === 'approve' ? (
              <Loader2 aria-hidden className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden className="h-4 w-4 mr-2" />
            )}
            Approuver
          </Button>
          <Button
            onClick={() => handle('request_docs')}
            disabled={disabledAll}
            variant="outline"
            className="border-karmen-border-blue text-karmen-marine hover:bg-karmen-pale-blue"
          >
            {submitting && status.decision === 'request_docs' ? (
              <Loader2 aria-hidden className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <HelpCircle aria-hidden className="h-4 w-4 mr-2" />
            )}
            Demander docs
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={disabledAll}
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/5"
              >
                {submitting && status.decision === 'reject' ? (
                  <Loader2 aria-hidden className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle aria-hidden className="h-4 w-4 mr-2" />
                )}
                Refuser
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer le refus du dossier ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action enregistre une décision négative. Assure-toi d’avoir saisi une justification
                  claire avant de confirmer.
                  {justification ? '' : ' Aucune justification renseignée pour l’instant.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handle('reject')}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Refuser le dossier
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div>
          <label htmlFor="justification" className="block text-xs uppercase tracking-widest text-karmen-mute font-semibold mb-1.5">
            Justification (1 phrase suffit)
          </label>
          <textarea
            id="justification"
            name="justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            disabled={disabledAll}
            rows={2}
            autoComplete="off"
            maxLength={500}
            className="w-full rounded-md border border-karmen-border-blue/60 bg-white px-3 py-2 text-sm text-karmen-ink placeholder:text-karmen-mute disabled:bg-muted disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-offset-2 focus-visible:border-karmen-blue"
            placeholder="Ex&nbsp;: bonne rentabilité, trésorerie tendue mais flux stables…"
          />
        </div>

        {status.phase === 'done' && (
          <Alert className="border-karmen-lime bg-karmen-lime/20 text-karmen-marine" aria-live="polite">
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            <AlertDescription>
              Dossier <strong>{LABEL[status.decision]}</strong> · enregistré à <span className="tabular-nums">{new Date(status.ts).toLocaleTimeString('fr-FR')}</span>.
            </AlertDescription>
          </Alert>
        )}

        {status.phase === 'error' && (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>Erreur lors de l’enregistrement&nbsp;: {status.message}</span>
              <Button size="sm" variant="outline" onClick={() => handle(status.decision)}>
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
