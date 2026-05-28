import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { AlertCircle, Send, Sparkles } from 'lucide-react';
import { useDraftFollowUp } from '@/features/follow-ups/hooks/use-draft-follow-up';
import { track } from '@/shared/lib/track';

type Props = {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FollowUpModal({ caseId, open, onOpenChange }: Props) {
  const { data: draft, isPending, error } = useDraftFollowUp(caseId, open);
  const [form, setForm] = useState<{ subject: string; body: string }>({ subject: '', body: '' });
  const [seededDraft, setSeededDraft] = useState<typeof draft>(undefined);
  const [sent, setSent] = useState(false);
  const [lastOpen, setLastOpen] = useState(open);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed/reset pendant le render plutôt qu'en useEffect : voir
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (draft && draft !== seededDraft) {
    setSeededDraft(draft);
    setForm({ subject: draft.subject, body: draft.body });
    track('follow-up.draft.generated', caseId, { missingCount: draft.missingDocs.length });
  }

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      track('follow-up.modal.opened', caseId);
    } else {
      setSent(false);
      setSeededDraft(undefined);
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;
  const loading = isPending && open;

  const handleSend = () => {
    if (sent || loading || error) return;
    setSent(true);
    track('follow-up.sent', caseId, { subject: form.subject, bodyLength: form.body.length });
    closeTimerRef.current = setTimeout(() => {
      onOpenChange(false);
      closeTimerRef.current = null;
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-karmen-marine">
            <Sparkles aria-hidden className="h-4 w-4 text-karmen-blue" />
            Follow-up draft
          </DialogTitle>
          <DialogDescription>
            Email pré-rédigé à partir des pièces manquantes. Éditable avant envoi. (LLM mocké — POC.)
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden className="h-4 w-4" />
            <AlertTitle>Génération échouée</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && draft && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="follow-up-subject" className="text-xs uppercase tracking-widest text-karmen-mute font-semibold">
                Objet
              </Label>
              <input
                id="follow-up-subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                disabled={sent}
                autoComplete="off"
                spellCheck
                className="mt-1.5 w-full rounded-md border border-karmen-border-blue/60 bg-white px-3 py-2 text-sm text-karmen-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:border-karmen-blue disabled:bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="follow-up-body" className="text-xs uppercase tracking-widest text-karmen-mute font-semibold">
                Corps du message
              </Label>
              <textarea
                id="follow-up-body"
                name="body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                disabled={sent}
                rows={10}
                autoComplete="off"
                spellCheck
                className="mt-1.5 w-full rounded-md border border-karmen-border-blue/60 bg-white px-3 py-2 text-sm text-karmen-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:border-karmen-blue disabled:bg-muted"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !!error || sent}
            className="bg-karmen-blue hover:bg-karmen-blue-dark text-white"
          >
            <Send aria-hidden className="h-4 w-4 mr-2" />
            {sent ? 'Sent ✓' : 'Send follow-up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
