import { Inject, Injectable, Logger } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
import type { AugmentedCase } from '../cases/types';
import { LLM_CLIENT, type LlmClient } from '../llm/llm.client';
import {
  FOLLOW_UP_SYSTEM_PROMPT,
  buildFollowUpUserPrompt,
} from './follow-ups.prompt';

export type FollowUpDraft = {
  subject: string;
  body: string;
  missingDocs: string[];
  source: 'llm' | 'template';
  latencyMs: number;
};

@Injectable()
export class FollowUpsService {
  private readonly logger = new Logger(FollowUpsService.name);

  constructor(
    private readonly completeness: CompletenessEngine,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
  ) {}

  /**
   * Génère un brouillon d'email à partir du case.
   * Stratégie : tente le LLM (si configuré) puis retombe sur un template déterministe.
   * Le template reste le filet de sécurité (offline, tests, quota, timeout).
   */
  async draftForCase(
    caseData: AugmentedCase,
    signal?: AbortSignal,
  ): Promise<FollowUpDraft> {
    const missing = this.completeness.check(caseData).missing;
    const missingDocs = missing.map((m) => m.clientAsk);
    const subject = `Karmen — Pièces complémentaires pour votre dossier de financement`;

    const startedAt = Date.now();
    const llmBody = await this.llm.generate({
      system: FOLLOW_UP_SYSTEM_PROMPT,
      user: buildFollowUpUserPrompt(caseData, missingDocs),
      signal,
    });
    const latencyMs = Date.now() - startedAt;

    if (llmBody) {
      return { subject, body: llmBody, missingDocs, source: 'llm', latencyMs };
    }

    return {
      subject,
      body: this.fallbackBody(caseData, missingDocs),
      missingDocs,
      source: 'template',
      latencyMs,
    };
  }

  /** Template déterministe — ex-implémentation, conservée comme fallback. */
  private fallbackBody(caseData: AugmentedCase, missingDocs: string[]): string {
    const { company, financing_request: req } = caseData;
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
      missingDocs.length === 0
        ? `Votre dossier est complet, notre analyste reviendra vers vous sous 48h.`
        : `Pour finaliser l'analyse, il nous manque les éléments suivants :\n\n${missingDocs.map((d) => `  • ${d}`).join('\n')}\n\nMerci de nous transmettre ces pièces dès que possible via votre espace client.`;
    const outro = `Cordialement,\nL'équipe Karmen`;

    return `${intro}\n\n${context}\n\n${ask}\n\n${outro}`;
  }
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}
