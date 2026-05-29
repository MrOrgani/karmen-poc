import { Inject, Injectable, Logger } from '@nestjs/common';
import { CockpitAggregator } from '../cases/cockpit.aggregator';
import { LLM_CLIENT, type LlmClient } from '../llm/llm.client';
import {
  decisionAlignment,
  type Alignment,
  type DecisionDirection,
} from '../score/decision-alignment';
import {
  DECISION_JUSTIFICATION_SYSTEM_PROMPT,
  buildJustificationUserPrompt,
} from './decisions.prompt';

export type JustificationDraft = {
  direction: DecisionDirection;
  alignment: Alignment;
  body: string;
  source: 'llm' | 'template';
  latencyMs: number;
};

@Injectable()
export class DecisionsService {
  private readonly logger = new Logger(DecisionsService.name);

  constructor(
    private readonly cockpit: CockpitAggregator,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
  ) {}

  /**
   * Drafts the internal justification for a decision the analyst has chosen.
   * Strategy: deterministic alignment first, then LLM (when configured) with a template fallback.
   * The LLM only ever verbalises the RuleEngine bullets — it introduces no new signal.
   */
  async draftJustification(
    caseId: string,
    direction: DecisionDirection,
    signal?: AbortSignal,
  ): Promise<JustificationDraft> {
    const { caseData, scoreExplanation } =
      await this.cockpit.getCockpit(caseId);
    const alignment = decisionAlignment(direction, caseData.score.risk_bucket);
    const bullets = scoreExplanation.bullets.map((b) => b.text);

    // Guardrail: a decision that contradicts the diagnostic is NEVER dressed up by the LLM.
    // The divergence warning is fully deterministic — the model does not get to plead it.
    if (alignment === 'divergent') {
      this.logger.log(
        `🛑 [DecisionsService.draftJustification] case=${caseId} decision=${direction} alignment=divergent → deterministic warning`,
      );
      return {
        direction,
        alignment,
        body: this.divergentWarning(direction),
        source: 'template',
        latencyMs: 0,
      };
    }

    const startedAt = Date.now();
    const llmBody = await this.llm.generate({
      system: DECISION_JUSTIFICATION_SYSTEM_PROMPT,
      user: buildJustificationUserPrompt(
        caseData,
        direction,
        alignment,
        bullets,
      ),
      signal,
    });
    const latencyMs = Date.now() - startedAt;

    if (llmBody) {
      return { direction, alignment, body: llmBody, source: 'llm', latencyMs };
    }

    return {
      direction,
      alignment,
      body: this.fallbackBody(direction, alignment, bullets),
      source: 'template',
      latencyMs,
    };
  }

  /** Deterministic warning shown when the chosen direction contradicts the diagnostic. */
  private divergentWarning(direction: DecisionDirection): string {
    const verdict = direction === 'approve' ? "L'accord" : 'Le refus';
    return `⚠ ${verdict} de ce dossier n'est pas étayé par le diagnostic automatique. Merci de préciser le motif hors-modèle qui le justifie avant de confirmer.`;
  }

  /** Deterministic justification — fallback when the LLM is offline/disabled. */
  private fallbackBody(
    direction: DecisionDirection,
    alignment: Alignment,
    bullets: string[],
  ): string {
    const verdict =
      direction === 'approve' ? 'Avis favorable' : 'Avis défavorable';
    const joined = bullets.join(' ');
    if (alignment === 'judgment-zone') {
      return `${verdict} en zone de risque modéré — arbitrage analyste. Éléments au dossier : ${joined}`;
    }
    return `${verdict}. Éléments retenus : ${joined}`;
  }
}
