import type {
  BankFlows,
  FinancialIndicators,
  MetricStatus,
  MetricStatuses,
  RuleDiagnosticItem,
} from './types';

const fmtEUR = (n: number) => `${n.toLocaleString('fr-FR')}${' '}€`;
const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}${' '}%`;

/**
 * Produit la liste exhaustive des 10 indicateurs de diagnostic, déclenchés ou
 * non. Affichée en frontend comme une checklist (vert/orange/rouge) — pivot
 * du nouveau composant RulesDiagnostic qui remplace l'ancien RedFlagsBanner
 * (ne listait que les anomalies déclenchées).
 */
export function buildRulesDiagnostic(
  fin: FinancialIndicators,
  bank: BankFlows,
  statuses: MetricStatuses,
): RuleDiagnosticItem[] {
  // EBITDA positif : règle binaire indépendante de la marge.
  const ebitdaPositiveStatus: MetricStatus = fin.ebitda > 0 ? 'ok' : 'alert';

  // Flow balance : ratio entrées / sorties, status déjà calculé pour inflows.
  const flowsBalanceValue =
    bank.monthlyOutflowsAverage > 0
      ? `${((bank.monthlyInflowsAverage / bank.monthlyOutflowsAverage) * 100).toFixed(0)}% des sorties`
      : '—';

  const ebitdaMargin =
    fin.revenue > 0 ? (fin.ebitda / fin.revenue) * 100 : 0;
  const debtRatio = fin.ebitda > 0 ? fin.totalDebt / fin.ebitda : null;
  const cashMonths =
    bank.monthlyOutflowsAverage > 0
      ? fin.cashPosition / bank.monthlyOutflowsAverage
      : null;

  const items: RuleDiagnosticItem[] = [
    {
      code: 'ebitda_positive',
      category: 'financial',
      label: 'EBITDA positif',
      status: ebitdaPositiveStatus,
      value: fmtEUR(fin.ebitda),
      threshold: 'EBITDA > 0',
      rationale:
        "Un EBITDA positif est la condition de base d'une capacité de remboursement intrinsèque. Sous zéro, la dette doit être servie par d'autres sources (cession, recapitalisation).",
    },
    {
      code: 'debt_to_ebitda',
      category: 'financial',
      label: 'Dette / EBITDA',
      status: statuses.totalDebt,
      value:
        debtRatio !== null
          ? `${debtRatio.toFixed(1)}× EBITDA`
          : 'EBITDA ≤ 0',
      threshold: 'Sain < 3× · vigilance 3-5× · critique > 5×',
      rationale:
        "Le nombre d'années d'EBITDA nécessaires pour rembourser la dette. Au-delà de 5×, la capacité de remboursement est préoccupante.",
    },
    {
      code: 'ebitda_margin',
      category: 'financial',
      label: 'Marge EBITDA',
      status: statuses.ebitda,
      value: fmtPct(ebitdaMargin),
      threshold: 'Sain > 10% · vigilance 5-10% · alerte < 5%',
      rationale:
        "Mesure la rentabilité opérationnelle. Sous 5%, la tolérance aux chocs (matières, salaires, fiscalité) est très limitée.",
    },
    {
      code: 'net_income',
      category: 'financial',
      label: 'Résultat net',
      status: statuses.netIncome,
      value: fmtEUR(fin.netIncome),
      threshold: 'Sain ≥ 0',
      rationale:
        "Une perte nette traduit que les charges totales dépassent les revenus. Vérifier le caractère exceptionnel ou récurrent.",
    },
    {
      code: 'revenue_evolution',
      category: 'financial',
      label: 'Évolution du CA',
      status: statuses.revenue,
      value: (() => {
        if (fin.revenuePreviousYear === null || fin.revenuePreviousYear <= 0) return '—';
        const delta = ((fin.revenue - fin.revenuePreviousYear) / fin.revenuePreviousYear) * 100;
        const sign = delta >= 0 ? '+' : '';
        return `${sign}${delta.toFixed(1)}% vs N-1`;
      })(),
      unavailableReason:
        fin.revenuePreviousYear === null
          ? 'Liasse N-1 manquante — comparaison non calculable'
          : undefined,
      threshold: 'Sain ≥ N-1 · alerte < 90% × N-1',
      rationale:
        "Une contraction du CA > 10% peut signaler une perte de parts de marché ou un effet conjoncturel. À croiser avec les marges.",
    },
    {
      code: 'cash_position',
      category: 'financial',
      label: 'Trésorerie',
      status: statuses.cashPosition,
      value:
        cashMonths !== null
          ? `${cashMonths.toFixed(1)} mois de sorties`
          : fmtEUR(fin.cashPosition),
      threshold: 'Sain ≥ 1 mois · alerte < 0,5 mois',
      rationale:
        "La trésorerie doit couvrir au minimum un mois de sorties. En dessous, l'entreprise est exposée au moindre retard d'encaissement.",
    },
    {
      code: 'dso',
      category: 'financial',
      label: 'DSO',
      status: statuses.dso,
      value: `${fin.dso} j`,
      threshold: 'Sain ≤ 45 j · vigilance 45-60 j · alerte > 60 j',
      rationale:
        "Délai moyen de paiement client. Au-delà de 60 j, le cash est immobilisé chez les clients et génère un BFR difficile à financer.",
    },
    {
      code: 'overdraft_days',
      category: 'bank',
      label: 'Jours de découvert',
      status: statuses.overdraftDaysLast12m,
      value: `${bank.overdraftDaysLast12m} j / 12 mois`,
      threshold: 'Sain 0 j · vigilance 1-30 j · alerte > 30 j',
      rationale:
        "Plus de 30 jours cumulés en découvert sur 12 mois révèle une tension structurelle, pas ponctuelle.",
    },
    {
      code: 'rejected_payments',
      category: 'bank',
      label: 'Rejets de paiement',
      status: statuses.rejectedPaymentsCount,
      value: `${bank.rejectedPaymentsCount} rejet(s)`,
      threshold: 'Sain 0 · alerte ≥ 1',
      rationale:
        "Tout rejet signale une insuffisance de provision ou un litige fournisseur. Premier signal faible avant un défaut.",
    },
    {
      code: 'flows_balance',
      category: 'bank',
      label: 'Entrées vs sorties',
      status: statuses.monthlyInflowsAverage,
      value: flowsBalanceValue,
      threshold: 'Sain ≥ 100% · alerte < 90%',
      rationale:
        "Sur 12 mois, les encaissements doivent couvrir les décaissements. Sous 90%, le solde se dégrade structurellement.",
    },
  ];

  return items;
}
