import { Injectable } from '@nestjs/common';
import type {
  AugmentedDossier,
  RedFlag,
  ScoreBullet,
  ScoreExplanation,
  Severity,
} from '../dossiers/types';
import { SCORE_THEMES } from '../rule-engine/rule-engine';

const MAX_BULLETS = 3;

const SEVERITY_RANK: Record<Severity, number> = { high: 2, medium: 1, low: 0 };

const PROFITABILITY_CODES = [
  'EBITDA_MARGIN_LOW',
  'NEGATIVE_NET_INCOME',
  'REVENUE_DECLINING',
];
const DEBT_CODES = [
  'DEBT_TO_EBITDA_HIGH',
  'DEBT_TO_EBITDA_MEDIUM',
  'EBITDA_NEGATIVE_OR_ZERO',
];
const CASH_CODES = [
  'OVERDRAFT_DAYS_HIGH',
  'LOW_CASH_POSITION',
  'REJECTED_PAYMENTS',
  'DSO_LONG',
];

function pickMostSevere(
  flags: RedFlag[],
  codes: string[],
): RedFlag | undefined {
  return flags
    .filter((f) => codes.includes(f.code))
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
}

@Injectable()
export class ScoreExplainer {
  explain(dossier: AugmentedDossier, redFlags: RedFlag[]): ScoreExplanation {
    const { financialIndicators: fin, bankFlows: bank } = dossier;

    const profitabilityFlag = pickMostSevere(redFlags, PROFITABILITY_CODES);
    const debtFlag = pickMostSevere(redFlags, DEBT_CODES);
    const cashFlag = pickMostSevere(redFlags, CASH_CODES);

    const margin = fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
    const debtRatio = fin.ebitda > 0 ? fin.totalDebt / fin.ebitda : Infinity;
    const prevRevenue = fin.revenuePreviousYear ?? 0;
    const revenueDelta =
      prevRevenue > 0 ? ((fin.revenue - prevRevenue) / prevRevenue) * 100 : 0;

    const profitabilityText = profitabilityFlag
      ? profitabilityFlag.code === 'REVENUE_DECLINING'
        ? `Activité en repli : CA ${revenueDelta.toFixed(1)}% vs N-1 (marge EBITDA ${margin.toFixed(1)}%)`
        : `Rentabilité dégradée : marge EBITDA ${margin.toFixed(1)}%${fin.netIncome < 0 ? ', résultat net négatif' : ''}`
      : `Rentabilité opérationnelle correcte (marge EBITDA ${margin.toFixed(1)}%)`;

    const debtText = debtFlag
      ? debtFlag.code === 'EBITDA_NEGATIVE_OR_ZERO'
        ? `Capacité de remboursement nulle : EBITDA ${fin.ebitda.toLocaleString('fr-FR')} €`
        : `Endettement préoccupant : ${debtRatio.toFixed(1)}× l'EBITDA`
      : `Endettement absorbable (${debtRatio.toFixed(2)}× d'EBITDA)`;

    const cashText = cashFlag
      ? this.cashProblemBullet(fin, bank, cashFlag)
      : `Trésorerie saine et flux bancaires sans anomalie`;

    const bullets: ScoreBullet[] = [
      { text: profitabilityText, ruleCodes: [...SCORE_THEMES.profitability] },
      { text: debtText, ruleCodes: [...SCORE_THEMES.debt] },
      { text: cashText, ruleCodes: [...SCORE_THEMES.cash] },
    ];

    return { bullets: bullets.slice(0, MAX_BULLETS) };
  }

  private cashProblemBullet(
    fin: AugmentedDossier['financialIndicators'],
    bank: AugmentedDossier['bankFlows'],
    flag: RedFlag,
  ): string {
    if (flag.code === 'OVERDRAFT_DAYS_HIGH') {
      return `Tensions bancaires : ${bank.overdraftDaysLast12m} j de découvert sur 12 mois`;
    }
    if (flag.code === 'REJECTED_PAYMENTS') {
      return `Tensions bancaires : ${bank.rejectedPaymentsCount} rejet(s) sur 12 mois`;
    }
    if (flag.code === 'DSO_LONG') {
      return `DSO long : ${fin.dso} jours (cash bloqué chez les clients)`;
    }
    return `Trésorerie tendue : ${fin.cashPosition.toLocaleString('fr-FR')} € < sorties mensuelles moyennes`;
  }
}
