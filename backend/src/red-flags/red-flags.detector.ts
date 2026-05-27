import { Injectable } from '@nestjs/common';
import type {
  BankFlows,
  FinancialIndicators,
  RedFlag,
  Severity,
} from '../dossiers/types';

type RuleContext = { fin: FinancialIndicators; bank: BankFlows };

type Rule = {
  code: string;
  severity: Severity;
  label: string;
  when: (ctx: RuleContext) => boolean;
  format: (ctx: RuleContext) => string;
};

const RULES: Rule[] = [
  {
    code: 'EBITDA_NEGATIVE_OR_ZERO',
    severity: 'high',
    label: 'EBITDA nul ou négatif',
    when: ({ fin }) => fin.ebitda <= 0,
    format: ({ fin }) =>
      `${fin.ebitda.toLocaleString('fr-FR')} € (capacité de remboursement nulle)`,
  },
  {
    code: 'DEBT_TO_EBITDA_HIGH',
    severity: 'high',
    label: 'Dette / EBITDA critique',
    when: ({ fin }) => fin.ebitda > 0 && fin.totalDebt / fin.ebitda > 5,
    format: ({ fin }) =>
      `${(fin.totalDebt / fin.ebitda).toFixed(1)}× (seuil critique > 5×)`,
  },
  {
    code: 'DEBT_TO_EBITDA_MEDIUM',
    severity: 'medium',
    label: 'Dette / EBITDA élevé',
    when: ({ fin }) => {
      if (fin.ebitda <= 0) return false;
      const ratio = fin.totalDebt / fin.ebitda;
      return ratio >= 3 && ratio <= 5;
    },
    format: ({ fin }) =>
      `${(fin.totalDebt / fin.ebitda).toFixed(1)}× (zone 3×–5×)`,
  },
  {
    code: 'EBITDA_MARGIN_LOW',
    severity: 'high',
    label: 'Marge EBITDA faible',
    when: ({ fin }) => fin.revenue > 0 && fin.ebitda / fin.revenue < 0.05,
    format: ({ fin }) =>
      `${((fin.ebitda / fin.revenue) * 100).toFixed(1)}% (seuil < 5%)`,
  },
  {
    code: 'NEGATIVE_NET_INCOME',
    severity: 'medium',
    label: 'Résultat net négatif',
    when: ({ fin }) => fin.netIncome < 0,
    format: ({ fin }) => `${fin.netIncome.toLocaleString('fr-FR')} €`,
  },
  {
    code: 'REVENUE_DECLINING',
    severity: 'medium',
    label: 'CA en baisse',
    when: ({ fin }) =>
      fin.revenuePreviousYear > 0 &&
      fin.revenue < fin.revenuePreviousYear * 0.9,
    format: ({ fin }) => {
      const delta =
        ((fin.revenue - fin.revenuePreviousYear) / fin.revenuePreviousYear) *
        100;
      return `${delta.toFixed(1)}% vs N-1`;
    },
  },
  {
    code: 'OVERDRAFT_DAYS_HIGH',
    severity: 'high',
    label: 'Découverts prolongés',
    when: ({ bank }) => bank.overdraftDaysLast12m > 30,
    format: ({ bank }) =>
      `${bank.overdraftDaysLast12m} jours sur 12 mois (seuil > 30j)`,
  },
  {
    code: 'REJECTED_PAYMENTS',
    severity: 'medium',
    label: 'Rejets de paiement',
    when: ({ bank }) => bank.rejectedPaymentsCount > 0,
    format: ({ bank }) => `${bank.rejectedPaymentsCount} rejet(s) sur 12 mois`,
  },
  {
    code: 'LOW_CASH_POSITION',
    severity: 'medium',
    label: 'Trésorerie tendue',
    when: ({ fin, bank }) => fin.cashPosition < bank.monthlyOutflowsAverage,
    format: ({ fin, bank }) =>
      `${fin.cashPosition.toLocaleString('fr-FR')} € < sorties mensuelles moy. ${bank.monthlyOutflowsAverage.toLocaleString('fr-FR')} €`,
  },
  {
    code: 'DSO_LONG',
    severity: 'medium',
    label: 'DSO long',
    when: ({ fin }) => fin.dso > 60,
    format: ({ fin }) => `${fin.dso} jours (seuil > 60j)`,
  },
];

@Injectable()
export class RedFlagDetector {
  detect(fin: FinancialIndicators, bank: BankFlows): RedFlag[] {
    const ctx: RuleContext = { fin, bank };
    return RULES.filter((r) => r.when(ctx)).map((r) => ({
      severity: r.severity,
      code: r.code,
      label: r.label,
      value: r.format(ctx),
    }));
  }
}
