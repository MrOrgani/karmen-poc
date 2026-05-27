import { Injectable } from '@nestjs/common';
import type {
  AugmentedDossier,
  CompletenessResult,
  FinancingType,
  MissingItem,
} from '../dossiers/types';

type CompletenessRules = {
  liasseFiscaleMinCount: number;
  minMonthsPerBankAccount: number;
};

const RULES: Record<FinancingType, CompletenessRules> = {
  loan: { liasseFiscaleMinCount: 2, minMonthsPerBankAccount: 12 },
  factoring: { liasseFiscaleMinCount: 2, minMonthsPerBankAccount: 12 },
};

@Injectable()
export class CompletenessEngine {
  check(dossier: AugmentedDossier): CompletenessResult {
    const requirements = RULES[dossier.financing_request.type];
    const missing: MissingItem[] = [];

    const liasses = dossier.documents.filter(
      (d) => d.type === 'liasse_fiscale',
    );
    if (liasses.length < requirements.liasseFiscaleMinCount) {
      missing.push({
        type: 'liasse_fiscale',
        reason: `${liasses.length}/${requirements.liasseFiscaleMinCount} liasses fournies`,
        details: {
          provided: liasses.length,
          required: requirements.liasseFiscaleMinCount,
        },
      });
    }

    const releves = dossier.documents.filter(
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
