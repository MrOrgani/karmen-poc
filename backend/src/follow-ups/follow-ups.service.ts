import { Injectable } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
import type { AugmentedCase } from '../cases/types';

export type FollowUpDraft = {
  subject: string;
  body: string;
  missingDocs: string[];
};

@Injectable()
export class FollowUpsService {
  constructor(private readonly completeness: CompletenessEngine) {}

  /**
   * Mock LLM. Génère un brouillon d'email à partir du case.
   * La liste des pièces manquantes est dérivée en interne via CompletenessEngine
   * pour que l'invariant "un follow-up reflète l'état documentaire actuel" reste local.
   * Branchement LLM réel (Claude/OpenAI) à activer en prod via env var.
   */
  draftForCase(caseData: AugmentedCase): FollowUpDraft {
    const missing = this.completeness.check(caseData).missing;
    const { company, financing_request: req } = caseData;
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
