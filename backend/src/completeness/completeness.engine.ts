import { Injectable } from '@nestjs/common';
import { documentRequirementsFor } from '../cases/document-requirements';
import type {
  AugmentedCase,
  CompletenessResult,
  MissingItem,
} from '../cases/types';

@Injectable()
export class CompletenessEngine {
  check(caseData: AugmentedCase): CompletenessResult {
    const requirements = documentRequirementsFor(
      caseData.financing_request.type,
    );
    const missing: MissingItem[] = [];

    const liasses = caseData.documents.filter(
      (d) => d.type === 'liasse_fiscale',
    );
    if (liasses.length < requirements.minLiasses) {
      const missingCount = requirements.minLiasses - liasses.length;
      const clientAsk =
        liasses.length === 0
          ? `Liasse fiscale des ${requirements.minLiasses} dernières années (bilan + compte de résultat)`
          : `Liasse fiscale — ${missingCount} année${missingCount > 1 ? 's' : ''} supplémentaire${missingCount > 1 ? 's' : ''} à fournir`;
      missing.push({
        type: 'liasse_fiscale',
        reason: `${liasses.length}/${requirements.minLiasses} liasses fournies`,
        clientAsk,
        details: {
          provided: liasses.length,
          required: requirements.minLiasses,
        },
      });
    }

    const releves = caseData.documents.filter(
      (d) => d.type === 'releve_bancaire',
    );
    const byAccount = new Map<string, typeof releves>();
    for (const doc of releves) {
      const account =
        doc.metadata.account ?? `__noaccount_${doc.metadata.bank ?? 'unknown'}`;
      const list = byAccount.get(account) ?? [];
      list.push(doc);
      byAccount.set(account, list);
    }

    if (byAccount.size === 0) {
      missing.push({
        type: 'releve_bancaire',
        reason: `Aucun relevé bancaire fourni (${requirements.minMonthsPerBankAccount} mois requis)`,
        clientAsk: `Relevés bancaires des ${requirements.minMonthsPerBankAccount} derniers mois (pour chaque compte professionnel)`,
      });
    }

    for (const [account, docs] of byAccount) {
      const months = docs.reduce(
        (sum, d) => sum + (d.metadata.months_covered ?? 0),
        0,
      );
      const bank = docs[0].metadata.bank ?? 'banque inconnue';
      if (months < requirements.minMonthsPerBankAccount) {
        const missingMonths = requirements.minMonthsPerBankAccount - months;
        missing.push({
          type: 'releve_bancaire',
          reason: `Seulement ${months} mois sur ${requirements.minMonthsPerBankAccount} pour ${bank}`,
          clientAsk: `Relevés bancaires ${bank} — ${missingMonths} mois supplémentaire${missingMonths > 1 ? 's' : ''} à fournir (pour atteindre ${requirements.minMonthsPerBankAccount} mois)`,
          details: {
            account,
            bank,
            monthsProvided: months,
            monthsRequired: requirements.minMonthsPerBankAccount,
          },
        });
      }
    }

    return { isComplete: missing.length === 0, missing };
  }
}
