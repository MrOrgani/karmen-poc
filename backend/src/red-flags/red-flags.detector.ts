import { Injectable } from '@nestjs/common';
import type {
  BankFlows,
  FinancialIndicators,
  RedFlag,
  RedFlagCategory,
  Severity,
} from '../dossiers/types';

type RuleContext = { fin: FinancialIndicators; bank: BankFlows };

type Rule = {
  code: string;
  severity: Severity;
  category: RedFlagCategory;
  label: string;
  threshold: string;
  rationale: string;
  when: (ctx: RuleContext) => boolean;
  format: (ctx: RuleContext) => string;
};

const RULES: Rule[] = [
  {
    code: 'EBITDA_NEGATIVE_OR_ZERO',
    severity: 'high',
    category: 'financial',
    label: 'EBITDA nul ou négatif',
    threshold: 'EBITDA ≤ 0',
    rationale:
      "Un EBITDA nul ou négatif signifie que l'activité opérationnelle ne dégage aucun cash. Aucune capacité de remboursement intrinsèque — la dette devra être servie par d'autres sources (cession d'actifs, recapitalisation).",
    when: ({ fin }) => fin.ebitda <= 0,
    format: ({ fin }) =>
      `${fin.ebitda.toLocaleString('fr-FR')} € (capacité de remboursement nulle)`,
  },
  {
    code: 'DEBT_TO_EBITDA_HIGH',
    severity: 'high',
    category: 'financial',
    label: 'Dette / EBITDA critique',
    threshold: 'Dette > 5× EBITDA',
    rationale:
      "Au-delà de 5× l'EBITDA, il faudrait plus de 5 ans de profitabilité opérationnelle pour rembourser la dette. Karmen considère ce niveau comme un signal d'alerte de surendettement structurel.",
    when: ({ fin }) => fin.ebitda > 0 && fin.totalDebt / fin.ebitda > 5,
    format: ({ fin }) =>
      `${(fin.totalDebt / fin.ebitda).toFixed(1)}× (seuil critique > 5×)`,
  },
  {
    code: 'DEBT_TO_EBITDA_MEDIUM',
    severity: 'medium',
    category: 'financial',
    label: 'Dette / EBITDA élevé',
    threshold: '3× ≤ Dette / EBITDA ≤ 5×',
    rationale:
      "Entre 3× et 5×, l'endettement reste absorbable mais consomme une part significative de l'EBITDA pour le service de la dette. À surveiller selon la trajectoire de profitabilité.",
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
    category: 'financial',
    label: 'Marge EBITDA faible',
    threshold: 'Marge EBITDA < 5%',
    rationale:
      "Une marge EBITDA inférieure à 5% indique un modèle économique peu rentable ou sous pression. La tolérance aux chocs (matières, salaires, fiscalité) est très limitée.",
    when: ({ fin }) => fin.revenue > 0 && fin.ebitda / fin.revenue < 0.05,
    format: ({ fin }) =>
      `${((fin.ebitda / fin.revenue) * 100).toFixed(1)}% (seuil < 5%)`,
  },
  {
    code: 'NEGATIVE_NET_INCOME',
    severity: 'medium',
    category: 'financial',
    label: 'Résultat net négatif',
    threshold: 'Résultat net < 0',
    rationale:
      "Une perte nette traduit que l'ensemble des charges (opérationnelles + financières + impôts) dépasse les revenus. À analyser : nature de la perte (exceptionnelle ou récurrente) et trajectoire pluriannuelle.",
    when: ({ fin }) => fin.netIncome < 0,
    format: ({ fin }) => `${fin.netIncome.toLocaleString('fr-FR')} €`,
  },
  {
    code: 'REVENUE_DECLINING',
    severity: 'medium',
    category: 'financial',
    label: 'CA en baisse',
    threshold: 'CA N < 90% × CA N-1',
    rationale:
      "Une contraction du chiffre d'affaires de plus de 10% sur un exercice peut signaler une perte de parts de marché, un effet conjoncturel, ou un changement de business model. Croisement nécessaire avec les marges.",
    when: ({ fin }) =>
      fin.revenuePreviousYear !== null &&
      fin.revenuePreviousYear > 0 &&
      fin.revenue < fin.revenuePreviousYear * 0.9,
    format: ({ fin }) => {
      const prev = fin.revenuePreviousYear ?? 0;
      if (prev <= 0) return '—';
      const delta = ((fin.revenue - prev) / prev) * 100;
      return `${delta.toFixed(1)}% vs N-1`;
    },
  },
  {
    code: 'OVERDRAFT_DAYS_HIGH',
    severity: 'high',
    category: 'bank',
    label: 'Découverts prolongés',
    threshold: '> 30 jours de découvert / 12 mois',
    rationale:
      "Plus de 30 jours cumulés en découvert sur 12 mois révèle une tension de trésorerie structurelle plutôt que ponctuelle. Indicateur fort d'un BFR sous-financé ou d'une saisonnalité mal gérée.",
    when: ({ bank }) => bank.overdraftDaysLast12m > 30,
    format: ({ bank }) =>
      `${bank.overdraftDaysLast12m} jours sur 12 mois (seuil > 30j)`,
  },
  {
    code: 'REJECTED_PAYMENTS',
    severity: 'medium',
    category: 'bank',
    label: 'Rejets de paiement',
    threshold: '≥ 1 rejet / 12 mois',
    rationale:
      "Un rejet de prélèvement ou de chèque signale soit une insuffisance de provision, soit un litige fournisseur. Premier signal faible avant un défaut.",
    when: ({ bank }) => bank.rejectedPaymentsCount > 0,
    format: ({ bank }) => `${bank.rejectedPaymentsCount} rejet(s) sur 12 mois`,
  },
  {
    code: 'LOW_CASH_POSITION',
    severity: 'medium',
    category: 'financial',
    label: 'Trésorerie tendue',
    threshold: 'Trésorerie < 1 mois de sorties',
    rationale:
      "Une trésorerie inférieure aux sorties mensuelles moyennes laisse moins d'un mois de runway en cas d'arrêt brutal des encaissements. Risque opérationnel élevé en cas d'imprévu.",
    when: ({ fin, bank }) => fin.cashPosition < bank.monthlyOutflowsAverage,
    format: ({ fin, bank }) =>
      `${fin.cashPosition.toLocaleString('fr-FR')} € < sorties mensuelles moy. ${bank.monthlyOutflowsAverage.toLocaleString('fr-FR')} €`,
  },
  {
    code: 'DSO_LONG',
    severity: 'medium',
    category: 'financial',
    label: 'DSO long',
    threshold: 'DSO > 60 jours',
    rationale:
      "Un délai moyen de paiement client supérieur à 60 jours immobilise du cash chez les clients. Critique pour les modèles B2B et particulièrement scruté en analyse affacturage.",
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
      threshold: r.threshold,
      rationale: r.rationale,
      category: r.category,
    }));
  }
}
