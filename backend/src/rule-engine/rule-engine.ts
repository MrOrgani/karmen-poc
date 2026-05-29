import { Injectable } from '@nestjs/common';
import type {
  BankFlows,
  FactoringIndicators,
  FinancialIndicators,
  FinancialThresholds,
  FinancingType,
  MetricStatus,
  MetricStatuses,
  RedFlag,
  RedFlagCategory,
  RuleDiagnosticItem,
  Severity,
  Theme,
} from '../cases/types';

export type RuleInput = {
  fin: FinancialIndicators;
  bank: BankFlows;
  financingType: FinancingType;
  factoring?: FactoringIndicators;
};

type RuleEvaluation = {
  status: MetricStatus;
  value: string;
  unavailableReason?: string;
};

type RuleEmission = {
  redFlagCode: string;
  severity: Severity;
  value: string;
  threshold: string;
  rationale: string;
  /** Sentence affichée dans le bullet thème si ce flag est le plus sévère. */
  explanation: string;
};

export type RuleCode =
  | 'ebitda_positive'
  | 'debt_to_ebitda'
  | 'ebitda_margin'
  | 'net_income'
  | 'revenue_evolution'
  | 'cash_position'
  | 'dso'
  | 'overdraft_days'
  | 'rejected_payments'
  | 'flows_balance'
  | 'top_client_concentration'
  | 'aged_receivables'
  | 'dilution_rate';

type RuleDefinition = {
  code: RuleCode;
  category: RedFlagCategory;
  /** Vue analytique — détermine sous quel bullet ce flag sera agrégé. */
  theme?: Theme;
  label: string;
  metricKey: keyof MetricStatuses;
  threshold: string;
  rationale: string;
  evaluate: (input: RuleInput) => RuleEvaluation;
  toRedFlags: (evaluation: RuleEvaluation, input: RuleInput) => RuleEmission[];
};

const fmtEUR = (n: number) => `${n.toLocaleString('fr-FR')} €`;
const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)} %`;

const RULES: RuleDefinition[] = [
  {
    code: 'ebitda_positive',
    category: 'financial',
    theme: 'debt',
    label: 'EBITDA positif',
    metricKey: 'ebitda',
    threshold: 'EBITDA > 0',
    rationale:
      "Un EBITDA positif est la condition de base d'une capacité de remboursement intrinsèque. Sous zéro, la dette doit être servie par d'autres sources (cession, recapitalisation).",
    evaluate: ({ fin }) => ({
      status: fin.ebitda > 0 ? 'ok' : 'alert',
      value: fmtEUR(fin.ebitda),
    }),
    toRedFlags: (e, { fin }) =>
      e.status === 'alert'
        ? [
            {
              redFlagCode: 'EBITDA_NEGATIVE_OR_ZERO',
              severity: 'high',
              value: `${fin.ebitda.toLocaleString('fr-FR')} € (capacité de remboursement nulle)`,
              threshold: 'EBITDA ≤ 0',
              rationale:
                "Un EBITDA nul ou négatif signifie que l'activité opérationnelle ne dégage aucun cash. Aucune capacité de remboursement intrinsèque — la dette devra être servie par d'autres sources (cession d'actifs, recapitalisation).",
              explanation: `Capacité de remboursement nulle : EBITDA ${fin.ebitda.toLocaleString('fr-FR')} €`,
            },
          ]
        : [],
  },
  {
    code: 'debt_to_ebitda',
    category: 'financial',
    theme: 'debt',
    label: 'Dette / EBITDA',
    metricKey: 'totalDebt',
    threshold: 'Sain < 3× · vigilance 3-5× · critique > 5×',
    rationale:
      "Le nombre d'années d'EBITDA nécessaires pour rembourser la dette. Au-delà de 5×, la capacité de remboursement est préoccupante.",
    evaluate: ({ fin }) => {
      if (fin.ebitda <= 0) {
        return { status: 'alert', value: 'EBITDA ≤ 0' };
      }
      const ratio = fin.totalDebt / fin.ebitda;
      const status: MetricStatus =
        ratio < 3 ? 'ok' : ratio <= 5 ? 'warn' : 'alert';
      return { status, value: `${ratio.toFixed(1)}× EBITDA` };
    },
    toRedFlags: (e, { fin }) => {
      if (fin.ebitda <= 0) return [];
      const ratio = fin.totalDebt / fin.ebitda;
      if (e.status === 'alert') {
        return [
          {
            redFlagCode: 'DEBT_TO_EBITDA_HIGH',
            severity: 'high',
            value: `${ratio.toFixed(1)}× (seuil critique > 5×)`,
            threshold: 'Dette > 5× EBITDA',
            rationale:
              "Au-delà de 5× l'EBITDA, il faudrait plus de 5 ans de profitabilité opérationnelle pour rembourser la dette. Karmen considère ce niveau comme un signal d'alerte de surendettement structurel.",
            explanation: `Endettement préoccupant : ${ratio.toFixed(1)}× l'EBITDA`,
          },
        ];
      }
      if (e.status === 'warn') {
        return [
          {
            redFlagCode: 'DEBT_TO_EBITDA_MEDIUM',
            severity: 'medium',
            value: `${ratio.toFixed(1)}× (zone 3×–5×)`,
            threshold: '3× ≤ Dette / EBITDA ≤ 5×',
            rationale:
              "Entre 3× et 5×, l'endettement reste absorbable mais consomme une part significative de l'EBITDA pour le service de la dette. À surveiller selon la trajectoire de profitabilité.",
            explanation: `Endettement préoccupant : ${ratio.toFixed(1)}× l'EBITDA`,
          },
        ];
      }
      return [];
    },
  },
  {
    code: 'ebitda_margin',
    category: 'financial',
    theme: 'profitability',
    label: 'Marge EBITDA',
    metricKey: 'ebitda',
    threshold: 'Sain > 10% · vigilance 5-10% · alerte < 5%',
    rationale:
      'Mesure la rentabilité opérationnelle. Sous 5%, la tolérance aux chocs (matières, salaires, fiscalité) est très limitée.',
    evaluate: ({ fin }) => {
      if (fin.revenue <= 0 || fin.ebitda <= 0) {
        return { status: 'alert', value: fmtPct(0) };
      }
      const margin = (fin.ebitda / fin.revenue) * 100;
      const status: MetricStatus =
        margin > 10 ? 'ok' : margin >= 5 ? 'warn' : 'alert';
      return { status, value: fmtPct(margin) };
    },
    toRedFlags: (e, { fin }) => {
      if (e.status !== 'alert' || fin.revenue <= 0) return [];
      const margin = (fin.ebitda / fin.revenue) * 100;
      return [
        {
          redFlagCode: 'EBITDA_MARGIN_LOW',
          severity: 'high',
          value: `${margin.toFixed(1)}% (seuil < 5%)`,
          threshold: 'Marge EBITDA < 5%',
          rationale:
            'Une marge EBITDA inférieure à 5% indique un modèle économique peu rentable ou sous pression. La tolérance aux chocs (matières, salaires, fiscalité) est très limitée.',
          explanation: `Rentabilité dégradée : marge EBITDA ${margin.toFixed(1)}%${fin.netIncome < 0 ? ', résultat net négatif' : ''}`,
        },
      ];
    },
  },
  {
    code: 'net_income',
    category: 'financial',
    theme: 'profitability',
    label: 'Résultat net',
    metricKey: 'netIncome',
    threshold: 'Sain ≥ 0',
    rationale:
      'Une perte nette traduit que les charges totales dépassent les revenus. Vérifier le caractère exceptionnel ou récurrent.',
    evaluate: ({ fin }) => ({
      status: fin.netIncome >= 0 ? 'ok' : 'alert',
      value: fmtEUR(fin.netIncome),
    }),
    toRedFlags: (e, { fin }) => {
      if (e.status !== 'alert') return [];
      const margin = fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
      return [
        {
          redFlagCode: 'NEGATIVE_NET_INCOME',
          severity: 'medium',
          value: fmtEUR(fin.netIncome),
          threshold: 'Résultat net < 0',
          rationale:
            "Une perte nette traduit que l'ensemble des charges (opérationnelles + financières + impôts) dépasse les revenus. À analyser : nature de la perte (exceptionnelle ou récurrente) et trajectoire pluriannuelle.",
          explanation: `Rentabilité dégradée : marge EBITDA ${margin.toFixed(1)}%, résultat net négatif`,
        },
      ];
    },
  },
  {
    code: 'revenue_evolution',
    category: 'financial',
    theme: 'profitability',
    label: 'Évolution du CA',
    metricKey: 'revenue',
    threshold: 'Sain ≥ N-1 · alerte < 90% × N-1',
    rationale:
      'Une contraction du CA > 10% peut signaler une perte de parts de marché ou un effet conjoncturel. À croiser avec les marges.',
    evaluate: ({ fin }) => {
      if (fin.revenuePreviousYear === null || fin.revenuePreviousYear <= 0) {
        return {
          status: 'unknown',
          value: '—',
          unavailableReason:
            'Liasse N-1 manquante — comparaison non calculable',
        };
      }
      const delta =
        ((fin.revenue - fin.revenuePreviousYear) / fin.revenuePreviousYear) *
        100;
      const status: MetricStatus =
        delta >= 0 ? 'ok' : delta >= -10 ? 'warn' : 'alert';
      const sign = delta >= 0 ? '+' : '';
      return { status, value: `${sign}${delta.toFixed(1)}% vs N-1` };
    },
    toRedFlags: (e, { fin }) => {
      if (e.status !== 'alert' || fin.revenuePreviousYear === null) return [];
      const delta =
        ((fin.revenue - fin.revenuePreviousYear) / fin.revenuePreviousYear) *
        100;
      const margin = fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
      return [
        {
          redFlagCode: 'REVENUE_DECLINING',
          severity: 'medium',
          value: `${delta.toFixed(1)}% vs N-1`,
          threshold: 'CA N < 90% × CA N-1',
          rationale:
            "Une contraction du chiffre d'affaires de plus de 10% sur un exercice peut signaler une perte de parts de marché, un effet conjoncturel, ou un changement de business model. Croisement nécessaire avec les marges.",
          explanation: `Activité en repli : CA ${delta.toFixed(1)}% vs N-1 (marge EBITDA ${margin.toFixed(1)}%)`,
        },
      ];
    },
  },
  {
    code: 'cash_position',
    category: 'financial',
    theme: 'cash',
    label: 'Trésorerie',
    metricKey: 'cashPosition',
    threshold: 'Sain ≥ 1 mois · alerte < 0,5 mois',
    rationale:
      "La trésorerie doit couvrir au minimum un mois de sorties. En dessous, l'entreprise est exposée au moindre retard d'encaissement.",
    evaluate: ({ fin, bank }) => {
      if (bank.monthlyOutflowsAverage <= 0) {
        return { status: 'ok', value: fmtEUR(fin.cashPosition) };
      }
      const months = fin.cashPosition / bank.monthlyOutflowsAverage;
      const status: MetricStatus =
        months >= 1 ? 'ok' : months >= 0.5 ? 'warn' : 'alert';
      return { status, value: `${months.toFixed(1)} mois de sorties` };
    },
    toRedFlags: (e, { fin, bank }) => {
      if (e.status === 'ok') return [];
      // Seuil historique LOW_CASH_POSITION : cash strictement < sorties.
      if (fin.cashPosition >= bank.monthlyOutflowsAverage) return [];
      return [
        {
          redFlagCode: 'LOW_CASH_POSITION',
          severity: 'medium',
          value: `${fin.cashPosition.toLocaleString('fr-FR')} € < sorties mensuelles moy. ${bank.monthlyOutflowsAverage.toLocaleString('fr-FR')} €`,
          threshold: 'Trésorerie < 1 mois de sorties',
          rationale:
            "Une trésorerie inférieure aux sorties mensuelles moyennes laisse moins d'un mois de runway en cas d'arrêt brutal des encaissements. Risque opérationnel élevé en cas d'imprévu.",
          explanation: `Trésorerie tendue : ${fin.cashPosition.toLocaleString('fr-FR')} € < sorties mensuelles moyennes`,
        },
      ];
    },
  },
  {
    code: 'dso',
    category: 'financial',
    theme: 'cash',
    label: 'DSO',
    metricKey: 'dso',
    threshold: 'Sain ≤ 45 j · vigilance 45-60 j · alerte > 60 j',
    rationale:
      'Délai moyen de paiement client. Au-delà de 60 j, le cash est immobilisé chez les clients et génère un BFR difficile à financer.',
    evaluate: ({ fin }) => {
      const status: MetricStatus =
        fin.dso < 45 ? 'ok' : fin.dso < 60 ? 'warn' : 'alert';
      return { status, value: `${fin.dso} j` };
    },
    toRedFlags: (e, { fin, financingType }) =>
      e.status === 'alert'
        ? [
            {
              redFlagCode: 'DSO_LONG',
              // En factoring, un DSO long pèse directement sur la rentabilité Karmen
              // (les créances financées vont être lentes à payer) → severity high.
              severity: financingType === 'factoring' ? 'high' : 'medium',
              value: `${fin.dso} jours (seuil > 60j)`,
              threshold: 'DSO > 60 jours',
              rationale:
                financingType === 'factoring'
                  ? "En affacturage, un DSO supérieur à 60 jours pèse directement sur la rentabilité de l'opération : les créances cédées seront lentes à recouvrer et augmentent la durée d'immobilisation des fonds Karmen."
                  : 'Un délai moyen de paiement client supérieur à 60 jours immobilise du cash chez les clients. Critique pour les modèles B2B et particulièrement scruté en analyse affacturage.',
              explanation: `DSO long : ${fin.dso} jours (cash bloqué chez les clients)`,
            },
          ]
        : [],
  },
  {
    code: 'overdraft_days',
    category: 'bank',
    theme: 'cash',
    label: 'Jours de découvert',
    metricKey: 'overdraftDaysLast12m',
    threshold: 'Sain 0 j · vigilance 1-30 j · alerte > 30 j',
    rationale:
      'Plus de 30 jours cumulés en découvert sur 12 mois révèle une tension structurelle, pas ponctuelle.',
    evaluate: ({ bank }) => {
      const d = bank.overdraftDaysLast12m;
      const status: MetricStatus = d === 0 ? 'ok' : d <= 30 ? 'warn' : 'alert';
      return { status, value: `${d} j / 12 mois` };
    },
    toRedFlags: (e, { bank }) =>
      e.status === 'alert'
        ? [
            {
              redFlagCode: 'OVERDRAFT_DAYS_HIGH',
              severity: 'high',
              value: `${bank.overdraftDaysLast12m} jours sur 12 mois (seuil > 30j)`,
              threshold: '> 30 jours de découvert / 12 mois',
              rationale:
                "Plus de 30 jours cumulés en découvert sur 12 mois révèle une tension de trésorerie structurelle plutôt que ponctuelle. Indicateur fort d'un BFR sous-financé ou d'une saisonnalité mal gérée.",
              explanation: `Tensions bancaires : ${bank.overdraftDaysLast12m} j de découvert sur 12 mois`,
            },
          ]
        : [],
  },
  {
    code: 'rejected_payments',
    category: 'bank',
    theme: 'cash',
    label: 'Rejets de paiement',
    metricKey: 'rejectedPaymentsCount',
    threshold: 'Sain 0 · alerte ≥ 1',
    rationale:
      'Tout rejet signale une insuffisance de provision ou un litige fournisseur. Premier signal faible avant un défaut.',
    evaluate: ({ bank }) => ({
      status: bank.rejectedPaymentsCount === 0 ? 'ok' : 'alert',
      value: `${bank.rejectedPaymentsCount} rejet(s)`,
    }),
    toRedFlags: (e, { bank }) =>
      e.status === 'alert'
        ? [
            {
              redFlagCode: 'REJECTED_PAYMENTS',
              severity: 'medium',
              value: `${bank.rejectedPaymentsCount} rejet(s) sur 12 mois`,
              threshold: '≥ 1 rejet / 12 mois',
              rationale:
                'Un rejet de prélèvement ou de chèque signale soit une insuffisance de provision, soit un litige fournisseur. Premier signal faible avant un défaut.',
              explanation: `Tensions bancaires : ${bank.rejectedPaymentsCount} rejet(s) sur 12 mois`,
            },
          ]
        : [],
  },
  {
    code: 'flows_balance',
    category: 'bank',
    theme: 'cash',
    label: 'Entrées vs sorties',
    metricKey: 'monthlyInflowsAverage',
    threshold: 'Sain ≥ 100% · alerte < 90%',
    rationale:
      'Sur 12 mois, les encaissements doivent couvrir les décaissements. Sous 90%, le solde se dégrade structurellement.',
    evaluate: ({ bank }) => {
      if (bank.monthlyOutflowsAverage <= 0) {
        return { status: 'ok', value: '—' };
      }
      const ratio = bank.monthlyInflowsAverage / bank.monthlyOutflowsAverage;
      const status: MetricStatus =
        ratio >= 1 ? 'ok' : ratio >= 0.9 ? 'warn' : 'alert';
      return { status, value: `${(ratio * 100).toFixed(0)}% des sorties` };
    },
    toRedFlags: () => [], // pas de red flag dédié dans la version historique
  },
  {
    code: 'top_client_concentration',
    category: 'factoring',
    label: 'Concentration top 1 client',
    metricKey: 'topClientConcentrationPct',
    threshold: 'Sain < 20 % · vigilance 20-30 % · critique > 30 %',
    rationale:
      "En affacturage, la dépendance à un client unique concentre le risque : si ce client défaille, la majorité des créances financées s'effondre.",
    evaluate: ({ factoring, financingType }) => {
      if (financingType !== 'factoring' || !factoring) {
        return {
          status: 'unknown',
          value: '—',
          unavailableReason: 'Indicateur affacturage — non applicable au prêt',
        };
      }
      const pct = factoring.topClientConcentrationPct;
      const status: MetricStatus =
        pct < 20 ? 'ok' : pct <= 30 ? 'warn' : 'alert';
      return { status, value: fmtPct(pct, 0) };
    },
    toRedFlags: (e, { factoring }) => {
      if (e.status !== 'alert' || !factoring) return [];
      return [
        {
          redFlagCode: 'CONCENTRATION_TOP_CLIENT',
          severity: 'high',
          value: `${fmtPct(factoring.topClientConcentrationPct, 0)} du CA (seuil > 30 %)`,
          threshold: 'Top 1 client > 30 % du CA',
          rationale:
            "Plus de 30 % du CA concentré sur un seul client expose Karmen à un risque de défaut majeur sur les créances financées : si ce débiteur défaille, l'essentiel du portefeuille cédé s'effondre.",
          explanation: `Concentration critique : ${fmtPct(factoring.topClientConcentrationPct, 0)} du CA sur un seul client`,
        },
      ];
    },
  },
  {
    code: 'aged_receivables',
    category: 'factoring',
    label: 'Créances > 60 jours',
    metricKey: 'agedReceivablesPct',
    threshold: 'Sain < 10 % · vigilance 10-20 % · critique > 20 %',
    rationale:
      "Part des créances clients dont l'ancienneté dépasse 60 jours. Indicateur direct de la qualité de la balance âgée et de la vitesse de recouvrement attendue.",
    evaluate: ({ factoring, financingType }) => {
      if (financingType !== 'factoring' || !factoring) {
        return {
          status: 'unknown',
          value: '—',
          unavailableReason: 'Indicateur affacturage — non applicable au prêt',
        };
      }
      const pct = factoring.agedReceivablesPct;
      const status: MetricStatus =
        pct < 10 ? 'ok' : pct <= 20 ? 'warn' : 'alert';
      return { status, value: fmtPct(pct, 0) };
    },
    toRedFlags: (e, { factoring }) => {
      if (e.status !== 'alert' || !factoring) return [];
      return [
        {
          redFlagCode: 'AGED_RECEIVABLES_HIGH',
          severity: 'high',
          value: `${fmtPct(factoring.agedReceivablesPct, 0)} des créances > 60 j (seuil > 20 %)`,
          threshold: 'Balance âgée > 60 j > 20 %',
          rationale:
            "Plus de 20 % des créances clients sont en retard de paiement de plus de 60 jours. Risque élevé de créances lentes ou douteuses → la rentabilité de l'opération d'affacturage est compromise.",
          explanation: `Balance âgée dégradée : ${fmtPct(factoring.agedReceivablesPct, 0)} des créances > 60 j`,
        },
      ];
    },
  },
  {
    code: 'dilution_rate',
    category: 'factoring',
    label: 'Taux de dilution',
    metricKey: 'dilutionRatePct',
    threshold: 'Sain < 3 % · vigilance 3-5 % · critique > 5 %',
    rationale:
      'Avoirs émis / CA. Un taux élevé révèle des contestations fréquentes (litiges, retours, ristournes) qui érodent la valeur réelle des créances cédées.',
    evaluate: ({ factoring, financingType }) => {
      if (financingType !== 'factoring' || !factoring) {
        return {
          status: 'unknown',
          value: '—',
          unavailableReason: 'Indicateur affacturage — non applicable au prêt',
        };
      }
      const pct = factoring.dilutionRatePct;
      const status: MetricStatus = pct < 3 ? 'ok' : pct <= 5 ? 'warn' : 'alert';
      return { status, value: fmtPct(pct, 1) };
    },
    toRedFlags: (e, { factoring }) => {
      if (e.status !== 'alert' || !factoring) return [];
      return [
        {
          redFlagCode: 'DILUTION_RATE_HIGH',
          severity: 'medium',
          value: `${fmtPct(factoring.dilutionRatePct, 1)} (seuil > 5 %)`,
          threshold: 'Avoirs émis / CA > 5 %',
          rationale:
            "Un taux de dilution supérieur à 5 % indique des contestations clients fréquentes qui réduisent la valeur recouvrable des créances cédées : risque opérationnel direct sur le rendement de l'opération.",
          explanation: `Taux de dilution élevé : ${fmtPct(factoring.dilutionRatePct, 1)} d'avoirs émis`,
        },
      ];
    },
  },
];

/**
 * Phrase positive par thème — utilisée quand aucun flag de ce thème n'est levé.
 * Couplée au tag `theme` porté par chaque rule.
 */
export const THEMES: Record<
  Theme,
  { whenAllGreen: (input: RuleInput) => string }
> = {
  profitability: {
    whenAllGreen: ({ fin }) => {
      const margin = fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
      return `Rentabilité opérationnelle correcte (marge EBITDA ${margin.toFixed(1)}%)`;
    },
  },
  debt: {
    whenAllGreen: ({ fin }) => {
      const ratio = fin.ebitda > 0 ? fin.totalDebt / fin.ebitda : Infinity;
      return `Endettement absorbable (${ratio.toFixed(2)}× d'EBITDA)`;
    },
  },
  cash: {
    whenAllGreen: () => `Trésorerie saine et flux bancaires sans anomalie`,
  },
};

const STATUS_RANK: Record<MetricStatus, number> = {
  ok: 0,
  unknown: 1,
  warn: 2,
  alert: 3,
};

function worstStatus(a: MetricStatus, b: MetricStatus): MetricStatus {
  return STATUS_RANK[b] > STATUS_RANK[a] ? b : a;
}

@Injectable()
export class RuleEngine {
  evaluateAll(input: RuleInput): Map<RuleCode, RuleEvaluation> {
    const map = new Map<RuleCode, RuleEvaluation>();
    for (const rule of RULES) {
      map.set(rule.code, rule.evaluate(input));
    }
    return map;
  }

  evaluation(code: RuleCode, input: RuleInput): RuleEvaluation {
    return this.findRule(code).evaluate(input);
  }

  redFlags(input: RuleInput): RedFlag[] {
    const evaluations = this.evaluateAll(input);
    const out: RedFlag[] = [];
    for (const rule of RULES) {
      const e = evaluations.get(rule.code)!;
      for (const emission of rule.toRedFlags(e, input)) {
        out.push({
          code: emission.redFlagCode,
          severity: emission.severity,
          category: rule.category,
          theme: rule.theme,
          label: rule.label,
          value: emission.value,
          threshold: emission.threshold,
          rationale: emission.rationale,
          explanation: emission.explanation,
        });
      }
    }
    return out;
  }

  metricStatuses(input: RuleInput): MetricStatuses {
    const evaluations = this.evaluateAll(input);
    const acc: MetricStatuses = {
      revenue: 'ok',
      ebitda: 'ok',
      netIncome: 'ok',
      totalDebt: 'ok',
      cashPosition: 'ok',
      dso: 'ok',
      monthlyInflowsAverage: 'ok',
      monthlyOutflowsAverage: 'ok',
      overdraftDaysLast12m: 'ok',
      rejectedPaymentsCount: 'ok',
      topClientConcentrationPct: 'ok',
      agedReceivablesPct: 'ok',
      dilutionRatePct: 'ok',
    };
    const seen = new Set<keyof MetricStatuses>();
    for (const rule of RULES) {
      const evaluation = evaluations.get(rule.code)!;
      const key = rule.metricKey;
      if (!seen.has(key)) {
        acc[key] = evaluation.status;
        seen.add(key);
      } else {
        acc[key] = worstStatus(acc[key], evaluation.status);
      }
    }
    return acc;
  }

  diagnostic(input: RuleInput): RuleDiagnosticItem[] {
    const evaluations = this.evaluateAll(input);
    // En prêt, on n'expose pas les tuiles factoring (sinon ce serait 3 tuiles "non applicable" sur tous les dossiers prêt).
    const applicable = RULES.filter(
      (rule) =>
        rule.category !== 'factoring' || input.financingType === 'factoring',
    );
    return applicable.map((rule) => {
      const e = evaluations.get(rule.code)!;
      return {
        code: rule.code,
        category: rule.category,
        label: rule.label,
        status: e.status,
        value: e.value,
        unavailableReason: e.unavailableReason,
        threshold: rule.threshold,
        rationale: rule.rationale,
      };
    });
  }

  tileThresholds(): FinancialThresholds {
    const out: FinancialThresholds = {
      monthlyOutflowsAverage: {
        rule: 'Comparer à la trésorerie disponible',
        rationale:
          "Décaissements moyens sur 12 mois. Une trésorerie inférieure à ce niveau signale moins d'un mois de runway.",
      },
    };
    // Tile partagée par plusieurs règles : la 1re rencontrée gagne le popover (ordre de RULES = priorité).
    for (const rule of RULES) {
      if (rule.metricKey in out) continue;
      out[rule.metricKey] = { rule: rule.threshold, rationale: rule.rationale };
    }
    return out;
  }

  rulesForTheme(theme: Theme): RuleCode[] {
    return RULES.filter((r) => r.theme === theme).map((r) => r.code);
  }

  private findRule(code: RuleCode): RuleDefinition {
    const r = RULES.find((x) => x.code === code);
    if (!r) throw new Error(`Unknown rule code: ${code}`);
    return r;
  }
}
