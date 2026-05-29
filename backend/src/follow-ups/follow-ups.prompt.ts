import type { AugmentedCase } from '../cases/types';

export const FOLLOW_UP_SYSTEM_PROMPT = `Tu es un analyste financement PME chez Karmen.
Tu rédiges des emails de relance pour demander des pièces manquantes à un dirigeant.

Contraintes strictes :
- français, ton professionnel et concis (max 120 mots)
- vouvoiement
- n'invente JAMAIS de chiffres, de délais ou d'engagements
- ne reformule pas la liste des pièces manquantes : reprends-la telle quelle, en puces
- texte brut uniquement (pas de markdown, pas de balises)
- ne commence PAS par "Objet :" — l'objet est géré séparément, démarre directement par la salutation
- signature exacte : "Cordialement,\\nL'équipe Karmen"`;

export function buildFollowUpUserPrompt(
  caseData: AugmentedCase,
  missingDocs: string[],
): string {
  const payload = {
    owner: caseData.company.owner ?? null,
    company: caseData.company.name,
    type: caseData.financing_request.type,
    amount: caseData.financing_request.amount,
    durationMonths: caseData.financing_request.durationInMonth,
    missingDocs,
  };
  return [
    "Rédige le corps de l'email de relance à partir du contexte JSON ci-dessous.",
    "Si `missingDocs` est vide, indique simplement que le dossier est complet et qu'un analyste reviendra sous 48h.",
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n');
}
