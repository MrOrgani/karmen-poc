import { useState } from 'react';
import type { AugmentedDossier, CompletenessResult } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from './CollapsibleSection';
import { RelanceModal } from './RelanceModal';
import { FileCheck2, MailPlus, AlertCircle, CheckCircle2, ExternalLink, FileText, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useDossierId } from './CockpitContext';

type Props = {
  completeness: CompletenessResult;
  documents: AugmentedDossier['documents'];
};

const TYPE_LABEL: Record<AugmentedDossier['documents'][number]['type'], string> = {
  liasse_fiscale: 'Liasse fiscale',
  releve_bancaire: 'Relevé bancaire',
};

function metaLine(doc: AugmentedDossier['documents'][number]): string {
  const parts: string[] = [TYPE_LABEL[doc.type]];
  if (doc.metadata.year) parts.push(String(doc.metadata.year));
  if (doc.metadata.bank) parts.push(doc.metadata.bank);
  if (doc.metadata.months_covered !== undefined) parts.push(`${doc.metadata.months_covered} mois`);
  return parts.join(' · ');
}

function DocIcon({ type }: { type: AugmentedDossier['documents'][number]['type'] }) {
  const Icon = type === 'liasse_fiscale' ? FileText : Landmark;
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-karmen-pale-blue text-karmen-blue">
      <Icon aria-hidden className="h-4 w-4" />
    </span>
  );
}

export function CompletenessSection({ completeness, documents }: Props) {
  const dossierId = useDossierId();
  const { score, isComplete, missing } = completeness;
  const clamped = Math.max(0, Math.min(100, score));
  const [relanceOpen, setRelanceOpen] = useState(false);

  const openDoc = (docId: string, docName: string) => {
    if (import.meta.env.DEV) console.log('📄 [CompletenessSection.openDoc]', { docId, docName });
    // Visualiseur de pièces wiring en prod (Holofin/Dataleon).
  };

  return (
    <CollapsibleSection
      title="Complétude documentaire"
      icon={<FileCheck2 aria-hidden className="h-4 w-4 text-karmen-blue" />}
      defaultOpen
      sectionId="completeness"
      badge={
        <span className={cn(
          'ml-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
          isComplete
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
            : 'bg-destructive/10 text-destructive border-destructive/40',
        )}>
          {isComplete && <CheckCircle2 aria-hidden className="h-3 w-3" />}
          {isComplete ? 'Documents complets' : 'Documents manquants'}
        </span>
      }
    >
      <div className="space-y-5">
        <Progress
          value={clamped}
          className="h-2 [&>div]:bg-karmen-blue"
          aria-label={isComplete ? 'Documents complets' : 'Documents manquants'}
        />

        <section aria-labelledby="docs-provided">
          <h3 id="docs-provided" className="text-xs uppercase tracking-widest text-karmen-mute font-semibold mb-2">
            Documents fournis ({documents.length})
          </h3>
          {documents.length > 0 ? (
            <ul className="divide-y divide-karmen-border-blue/40 rounded-lg border border-karmen-border-blue/40 bg-white">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <DocIcon type={doc.type} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-karmen-ink truncate min-w-0">{doc.name}</div>
                      <div className="text-xs text-karmen-mute truncate min-w-0">{metaLine(doc)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDoc(doc.id, doc.name)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-karmen-blue hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-offset-2 rounded-sm"
                    aria-label={`Consulter ${doc.name}`}
                  >
                    Consulter
                    <ExternalLink aria-hidden className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-karmen-mute italic">Aucun document fourni pour ce dossier.</p>
          )}
        </section>

        {missing.length > 0 && (
          <section aria-labelledby="docs-missing">
            <h3 id="docs-missing" className="text-xs uppercase tracking-widest text-destructive font-semibold mb-2">
              Pièces manquantes ({missing.length})
            </h3>
            <ul className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              {missing.map((item, idx) => (
                <li key={`${item.type}-${idx}`} className="flex items-start gap-2 text-sm text-karmen-ink">
                  <AlertCircle aria-hidden className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium">{TYPE_LABEL[item.type]} — </span>
                    {item.reason}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div>
          <Button
            variant={isComplete ? 'outline' : 'default'}
            className={isComplete ? 'border-karmen-border-blue' : 'bg-karmen-blue hover:bg-karmen-blue-dark'}
            onClick={() => setRelanceOpen(true)}
          >
            <MailPlus aria-hidden className="h-4 w-4 mr-2" />
            Demander des pièces
          </Button>
        </div>
      </div>
      {relanceOpen && (
        <RelanceModal dossierId={dossierId} open={relanceOpen} onOpenChange={setRelanceOpen} />
      )}
    </CollapsibleSection>
  );
}
