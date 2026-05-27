import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, HelpCircle, XCircle, FileSignature } from 'lucide-react';

type Decision = 'approve' | 'request_docs' | 'reject';

type Props = { dossierId: string };

export function DecisionPanel({ dossierId }: Props) {
  const [justification, setJustification] = useState('');

  const handle = (decision: Decision) => {
    console.log('📝 [DecisionPanel.handle]', { dossierId, decision, justification });
    alert(`Décision "${decision}" enregistrée (wiring réel en Bloc 3)`);
  };

  return (
    <Card className="border-karmen-border-blue/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-karmen-ink flex items-center gap-2">
          <FileSignature aria-hidden className="h-4 w-4 text-karmen-blue" />
          Décision finale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handle('approve')} className="bg-karmen-blue hover:bg-karmen-blue-dark text-white font-medium">
            <CheckCircle2 aria-hidden className="h-4 w-4 mr-2" /> Approuver
          </Button>
          <Button onClick={() => handle('request_docs')} variant="outline" className="border-karmen-border-blue text-karmen-marine hover:bg-karmen-pale-blue">
            <HelpCircle aria-hidden className="h-4 w-4 mr-2" /> Demander docs
          </Button>
          <Button onClick={() => handle('reject')} variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5">
            <XCircle aria-hidden className="h-4 w-4 mr-2" /> Refuser
          </Button>
        </div>
        <div>
          <label htmlFor="justification" className="block text-xs uppercase tracking-widest text-karmen-mute font-semibold mb-1.5">
            Justification (1 phrase suffit)
          </label>
          <textarea
            id="justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-karmen-border-blue/60 bg-white px-3 py-2 text-sm text-karmen-ink placeholder:text-karmen-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-offset-2 focus-visible:border-karmen-blue"
            placeholder="Ex : bonne rentabilité, trésorerie tendue mais flux stables."
          />
        </div>
      </CardContent>
    </Card>
  );
}
