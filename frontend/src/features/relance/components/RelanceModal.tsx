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
import { draftRelance, type RelanceDraft } from '@/features/relance/api';
import { track } from '@/shared/lib/track';

type Props = {
  dossierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RelanceModal({ dossierId, open, onOpenChange }: Props) {
  const [draft, setDraft] = useState<RelanceDraft | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset transient state on open; abort in-flight fetch on close/unmount.
  useEffect(() => {
    if (!open) {
      setDraft(null);
      setSubject('');
      setBody('');
      setError(null);
      setSent(false);
      return;
    }

    const controller = new AbortController();
    track('relance.modal.opened', dossierId);
    setLoading(true);
    setError(null);

    draftRelance(dossierId, { signal: controller.signal })
      .then((d) => {
        if (controller.signal.aborted) return;
        setDraft(d);
        setSubject(d.subject);
        setBody(d.body);
        track('relance.draft.generated', dossierId, { missingCount: d.missingDocs.length });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        if (import.meta.env.DEV) console.error('🚨 [RelanceModal] draft failed', err);
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, dossierId]);

  // Clear pending close timer on unmount / re-open.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleSend = () => {
    if (sent || loading || error) return;
    setSent(true);
    track('relance.sent', dossierId, { subject, bodyLength: body.length });
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
            Brouillon de relance
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && draft && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="relance-subject" className="text-xs uppercase tracking-widest text-karmen-mute font-semibold">
                Objet
              </Label>
              <input
                id="relance-subject"
                name="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sent}
                autoComplete="off"
                spellCheck
                className="mt-1.5 w-full rounded-md border border-karmen-border-blue/60 bg-white px-3 py-2 text-sm text-karmen-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:border-karmen-blue disabled:bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="relance-body" className="text-xs uppercase tracking-widest text-karmen-mute font-semibold">
                Corps du message
              </Label>
              <textarea
                id="relance-body"
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
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
            {sent ? 'Envoyé ✓' : "Envoyer la relance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
