import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
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
} from "@/shared/ui/alert-dialog";
import {
  CheckCircle2,
  HelpCircle,
  XCircle,
  FileSignature,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  type DecisionType,
  type JustificationAlignment,
  type JustificationDirection,
} from "@/features/decisions/api";
import { useRecordDecision } from "@/features/decisions/hooks/use-record-decision";
import { useDraftJustification } from "@/features/decisions/hooks/use-draft-justification";
import { useParams } from "@tanstack/react-router";
import { useHighlight } from "@/features/cases/hooks/use-rule-highlight";
import { FollowUpModal } from "@/features/follow-ups/components/follow-up-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { track } from "@/shared/lib/track";
import type {
  AugmentedCase,
  RiskBucket,
  ScoreExplanation,
} from "@/shared/types";
import { cn } from "@/shared/lib/utils";

const LABEL: Record<DecisionType, string> = {
  approve: "approved",
  request_docs: "awaiting documents",
  reject: "rejected",
};

const BUCKET_LABEL: Record<RiskBucket, string> = {
  low: "Risque faible",
  medium: "Risque modéré",
  high: "Risque élevé",
};

const BUCKET_BADGE: Record<RiskBucket, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-300",
  medium: "bg-amber-50 text-amber-800 border-amber-300",
  high: "bg-rose-50 text-rose-800 border-rose-300",
};

type Props = {
  score: AugmentedCase["score"];
  explanation: ScoreExplanation;
};

export function DecisionPanel({ score, explanation }: Props) {
  const { id: caseId } = useParams({ from: "/cases/$id" });
  const highlight = useHighlight();
  const [justification, setJustification] = useState("");
  const [pendingDecision, setPendingDecision] = useState<DecisionType | null>(
    null,
  );
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const mutation = useRecordDecision(caseId);

  const draftMutation = useDraftJustification(caseId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftMeta, setDraftMeta] = useState<{
    source: "llm" | "template";
    alignment: JustificationAlignment;
  } | null>(null);

  // The analyst picks the direction → the AI verbalises the diagnostic for THAT choice.
  // The decision itself is still recorded separately via the buttons below.
  const generate = (direction: JustificationDirection) => {
    draftMutation.mutate(direction, {
      onSuccess: (draft) => {
        setJustification(draft.body);
        setDraftMeta({ source: draft.source, alignment: draft.alignment });
        setMenuOpen(false);
        track("decision.justification.drafted", caseId, {
          direction: draft.direction,
          alignment: draft.alignment,
          source: draft.source,
          latencyMs: draft.latencyMs,
          // Logged so the acceptance signal (edit-distance draft → recorded justification
          // in the eventual decision.made) becomes computable post-hoc.
          body: draft.body,
          bodyLength: draft.body.length,
        });
      },
    });
  };

  const handle = (decision: DecisionType) => {
    setPendingDecision(decision);
    mutation.mutate(
      { decision, justification },
      decision === "request_docs"
        ? { onSuccess: () => setFollowUpOpen(true) }
        : undefined,
    );
  };

  const submitting = mutation.isPending;
  const done = mutation.isSuccess;
  const errored = mutation.isError;
  const disabledAll = submitting || done;
  const errorMessage = errored
    ? (mutation.error?.message ?? "Erreur inconnue")
    : null;
  const submittedDecision = pendingDecision;

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
            <span className="text-[10px] uppercase tracking-widest font-semibold text-karmen-mute">
              Score Karmen estimé
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                BUCKET_BADGE[score.risk_bucket],
              )}
            >
              <span className="tabular-nums">{score.global_score}/100</span>
              <span className="opacity-80">
                · {BUCKET_LABEL[score.risk_bucket]}
              </span>
            </span>
          </div>
          <p className="text-[11px] text-karmen-mute italic">
            Clique sur une ligne pour situer les règles concernées dans le
            diagnostic.
          </p>
          <ul className="space-y-1.5 text-sm">
            {explanation.bullets.map((bullet, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => highlight(bullet.ruleCodes)}
                  className="group w-full text-left flex items-center gap-2 rounded-md border border-karmen-border-blue/60 bg-white px-3 py-2 hover:bg-karmen-pale-blue/60 hover:border-karmen-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-offset-1 transition-colors motion-reduce:transition-none cursor-pointer"
                >
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-karmen-blue shrink-0"
                  />
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

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="justification"
              className="text-xs uppercase tracking-widest text-karmen-mute font-semibold"
            >
              Justification (1 phrase suffit)
            </label>
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabledAll || draftMutation.isPending}
                  className="h-7 gap-1.5 border-karmen-border-blue text-karmen-blue hover:bg-karmen-pale-blue"
                >
                  {draftMutation.isPending ? (
                    <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles aria-hidden className="h-3.5 w-3.5" />
                  )}
                  Pré-rédiger
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 p-1.5">
                <p className="px-2 py-1.5 text-[11px] leading-snug text-karmen-mute">
                  L'IA habille le diagnostic. Vous décidez — elle ne tranche
                  pas.
                </p>
                <button
                  type="button"
                  onClick={() => generate("approve")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-karmen-ink hover:bg-karmen-pale-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue cursor-pointer"
                >
                  <CheckCircle2
                    aria-hidden
                    className="h-4 w-4 text-emerald-600"
                  />
                  Justifier un accord
                </button>
                <button
                  type="button"
                  onClick={() => generate("reject")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-karmen-ink hover:bg-karmen-pale-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue cursor-pointer"
                >
                  <XCircle aria-hidden className="h-4 w-4 text-destructive" />
                  Justifier un refus
                </button>
              </PopoverContent>
            </Popover>
          </div>
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
          {draftMutation.isError && (
            <p className="mt-1.5 text-[11px] text-destructive">
              Génération échouée&nbsp;: {draftMutation.error.message}
            </p>
          )}
          {draftMeta && !draftMutation.isError && (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1.5 text-[11px]",
                draftMeta.alignment === "divergent"
                  ? "text-amber-700"
                  : "text-karmen-mute",
              )}
            >
              <Sparkles aria-hidden className="h-3 w-3 shrink-0" />
              {draftMeta.alignment === "divergent"
                ? "Décision non étayée par le diagnostic — précisez le motif hors-modèle."
                : draftMeta.source === "llm"
                  ? "Brouillon généré par Claude — à relire et éditer."
                  : "Brouillon déterministe (modèle hors-ligne) — à relire et éditer."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            onClick={() => handle("request_docs")}
            disabled={disabledAll}
            variant="outline"
            className="border-karmen-border-blue text-karmen-marine hover:bg-karmen-pale-blue"
          >
            {submitting && submittedDecision === "request_docs" ? (
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
                {submitting && submittedDecision === "reject" ? (
                  <Loader2 aria-hidden className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle aria-hidden className="h-4 w-4 mr-2" />
                )}
                Refuser
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm case rejection?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will record a negative decision. Make sure you have
                  entered a clear justification before confirming.
                  {justification ? "" : " No justification provided yet."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handle("reject")}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Reject case
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={() => handle("approve")}
            disabled={disabledAll}
            className="bg-karmen-blue hover:bg-karmen-blue-dark text-white font-medium"
          >
            {submitting && submittedDecision === "approve" ? (
              <Loader2 aria-hidden className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden className="h-4 w-4 mr-2" />
            )}
            Approuver
          </Button>
        </div>

        {done && mutation.data && submittedDecision && (
          <Alert
            className="border-karmen-lime bg-karmen-lime/20 text-karmen-marine"
            aria-live="polite"
          >
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            <AlertDescription>
              Case <strong>{LABEL[submittedDecision]}</strong> · recorded at{" "}
              <span className="tabular-nums">
                {new Date(mutation.data.ts).toLocaleTimeString("fr-FR")}
              </span>
              .
            </AlertDescription>
          </Alert>
        )}

        {errored && submittedDecision && (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>Erreur lors de l’enregistrement&nbsp;: {errorMessage}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handle(submittedDecision)}
              >
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      {followUpOpen && (
        <FollowUpModal
          caseId={caseId}
          open={followUpOpen}
          onOpenChange={setFollowUpOpen}
        />
      )}
    </Card>
  );
}
