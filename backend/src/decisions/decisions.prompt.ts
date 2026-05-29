import type { AugmentedCase } from '../cases/types';
import type { Alignment, DecisionDirection } from '../score/decision-alignment';

// Note: prompts are written in French — the output is read by French-speaking analysts.
// The LLM only ever sees `aligned` or `judgment-zone` cases: `divergent` is short-circuited
// to a deterministic warning in DecisionsService and never reaches the model.
export const DECISION_JUSTIFICATION_SYSTEM_PROMPT = `Tu es un analyste financement PME chez Karmen.
Tu rédiges la justification interne d'une décision de crédit, à partir d'un diagnostic déjà calculé.

Contraintes strictes :
- français, ton professionnel, 1 à 2 phrases (max 60 mots)
- tu ne fais que VERBALISER les éléments de diagnostic fournis : n'introduis JAMAIS un facteur, un chiffre ou un risque absent de la liste
- n'invente JAMAIS de chiffres, de seuils ou d'engagements
- la décision est prise par l'analyste : tu ne la remets pas en cause et tu ne proposes pas une autre issue
- texte brut uniquement (pas de markdown, pas de puces, pas de balises)`;

export function buildJustificationUserPrompt(
  caseData: AugmentedCase,
  direction: DecisionDirection,
  alignment: Alignment,
  bullets: string[],
): string {
  const verdict =
    direction === 'approve' ? 'favorable (accord)' : 'défavorable (refus)';
  const instruction =
    alignment === 'aligned'
      ? `Rédige une justification ${verdict} qui s'appuie sur les éléments de diagnostic ci-dessous, dans le sens de la décision.`
      : `Dossier en zone de risque modéré : la décision ${verdict} est défendable mais discutable. Expose en une phrase l'élément en faveur et l'élément de vigilance, sans survendre la décision.`;
  const payload = {
    company: caseData.company.name,
    type: caseData.financing_request.type,
    amount: caseData.financing_request.amount,
    decision: direction,
    diagnostic: bullets,
  };
  return [instruction, '', JSON.stringify(payload, null, 2)].join('\n');
}
