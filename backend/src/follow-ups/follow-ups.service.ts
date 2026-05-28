import { Injectable } from '@nestjs/common';
import type { AugmentedCase, MissingItem } from '../cases/types';

export type FollowUpDraft = {
  subject: string;
  body: string;
  missingDocs: string[];
};

@Injectable()
export class FollowUpsService {
  /**
   * Mock LLM. Genère un brouillon d'email à partir du case + missing items.
   * Branchement LLM réel (Claude/OpenAI) à activer en prod via env var.
   */
  draft(case_: AugmentedCase, missing: MissingItem[]): FollowUpDraft {
    const { company, financing_request: req } = case_;
    const missingDocs = missing.map((m) => m.reason);

    const subject = `Karmen — Pièces complémentaires pour votre dossier de financement`;

    const ownerName = company.owner?.trim();
    const intro = ownerName ? `Bonjour ${ownerName},` : 'Bonjour,';
    const amount =
      Number.isFinite(req.amount) && req.amount > 0
        ? formatAmount(req.amount)
        : 'le montant demandé';
    const duration =
      Number.isFinite(req.durationInMonth) && req.durationInMonth > 0
        ? `${req.durationInMonth} mois`
        : 'la durée demandée';
    const context = `Nous avons bien reçu votre demande de financement de ${amount} sur ${duration} pour ${company.name}.`;
    const ask =
      missing.length === 0
        ? `Votre dossier est complet, notre analyste reviendra vers vous sous 48h.`
        : `Pour finaliser l'analyse, il nous manque les éléments suivants :\n\n${missingDocs.map((d) => `  • ${d}`).join('\n')}\n\nMerci de nous transmettre ces pièces dès que possible via votre espace client.`;
    const outro = `Cordialement,\nL'équipe Karmen`;

    const body = `${intro}\n\n${context}\n\n${ask}\n\n${outro}`;

    return { subject, body, missingDocs };
  }
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}
