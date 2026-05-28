import { Injectable } from '@nestjs/common';
import { documentRequirementsFor } from '../cases/document-requirements';
import type {
  AugmentedCase,
  CompletenessResult,
  MissingItem,
} from '../cases/types';

@Injectable()
export class CompletenessEngine {
  check(case_: AugmentedCase): CompletenessResult {
    const requirements = documentRequirementsFor(case_.financing_request.type);
    const missing: MissingItem[] = [];

    const liasses = case_.documents.filter(
      (d) => d.type === 'liasse_fiscale',
    );
    if (liasses.length < requirements.minLiasses) {
      missing.push({
        type: 'liasse_fiscale',
        reason: `${liasses.length}/${requirements.minLiasses} liasses fournies`,
        details: {
          provided: liasses.length,
          required: requirements.minLiasses,
        },
      });
    }

    const releves = case_.documents.filter(
      (d) => d.type === 'releve_bancaire',
    );
    const byAccount = new Map<string, typeof releves>();
    for (const doc of releves) {
      const account = doc.metadata.account ?? `__noaccount_${doc.metadata.bank ?? 'unknown'}`;
      const list = byAccount.get(account) ?? [];
      list.push(doc);
      byAccount.set(account, list);
    }

    if (byAccount.size === 0) {
      missing.push({
        type: 'releve_bancaire',
        reason: `Aucun relevé bancaire fourni (${requirements.minMonthsPerBankAccount} mois requis)`,
      });
    }

    for (const [account, docs] of byAccount) {
      const months = docs.reduce(
        (sum, d) => sum + (d.metadata.months_covered ?? 0),
        0,
      );
      const bank = docs[0].metadata.bank ?? 'banque inconnue';
      if (months < requirements.minMonthsPerBankAccount) {
        missing.push({
          type: 'releve_bancaire',
          reason: `Seulement ${months} mois sur ${requirements.minMonthsPerBankAccount} pour ${bank}`,
          details: {
            account,
            bank,
            monthsProvided: months,
            monthsRequired: requirements.minMonthsPerBankAccount,
          },
        });
      }
    }

    const totalItems = 1 + Math.max(byAccount.size, 1);
    const completedItems = Math.max(0, totalItems - missing.length);
    let score = Math.round((completedItems / totalItems) * 100);
    if (releves.length === 0) {
      score = Math.min(score, 25);
    }

    return { score, isComplete: missing.length === 0, missing };
  }
}
