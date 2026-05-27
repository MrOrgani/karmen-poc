import type { FinancialThresholds } from './types';

/**
 * Reference thresholds per financial indicator — used by the frontend to render
 * tooltips/hints next to each KPI. Mirrors (some of) the rules in
 * `red-flags/red-flags.detector.ts` so the source of truth stays in one repo.
 * Keys are stable identifiers; the front maps them to the displayed labels.
 */
export const FINANCIAL_THRESHOLDS: FinancialThresholds = {
  revenue: {
    rule: 'CA N < 90% × CA N-1 = alerte',
    rationale:
      "Une contraction du chiffre d'affaires supérieure à 10% sur un exercice est un signal de risque. À croiser avec la marge EBITDA pour distinguer un effet conjoncturel d'une perte structurelle de compétitivité.",
  },
  ebitda: {
    rule: 'Marge EBITDA < 5% = alerte ; > 10% = sain',
    rationale:
      "L'EBITDA mesure la rentabilité opérationnelle hors décisions financières et fiscales. Une marge sous 5% laisse peu de marge de manœuvre pour absorber un choc.",
  },
  netIncome: {
    rule: 'Résultat net < 0 = alerte',
    rationale:
      "Une perte nette traduit que les charges totales (opérationnelles + financières + impôts) dépassent les revenus. Vérifier le caractère exceptionnel ou récurrent.",
  },
  totalDebt: {
    rule: 'Dette / EBITDA : sain < 3× · alerte > 5×',
    rationale:
      "Le ratio dette nette sur EBITDA mesure le nombre d'années nécessaires pour rembourser la dette à partir de la profitabilité opérationnelle. Au-delà de 5×, la capacité de remboursement est préoccupante.",
  },
  cashPosition: {
    rule: 'Trésorerie ≥ 1 mois de sorties moyennes = sain',
    rationale:
      "La trésorerie doit couvrir au minimum un mois de sorties mensuelles moyennes. En dessous, l'entreprise est exposée au moindre retard d'encaissement.",
  },
  dso: {
    rule: 'DSO > 60 jours = alerte',
    rationale:
      "Days Sales Outstanding : délai moyen de paiement client. Au-delà de 60 jours, le cash est immobilisé chez les clients et peut générer un besoin en fonds de roulement difficile à financer.",
  },
  monthlyInflowsAverage: {
    rule: 'À comparer aux sorties mensuelles moyennes',
    rationale:
      "Encaissements moyens sur 12 mois. Doit excéder les sorties pour générer un flux de trésorerie net positif.",
  },
  monthlyOutflowsAverage: {
    rule: 'Comparer à la trésorerie disponible',
    rationale:
      "Décaissements moyens sur 12 mois. Une trésorerie inférieure à ce niveau signale moins d'un mois de runway.",
  },
  overdraftDaysLast12m: {
    rule: '> 30 jours sur 12 mois = alerte',
    rationale:
      "Plus de 30 jours cumulés en découvert sur 12 mois révèle une tension structurelle, pas ponctuelle. Indicateur fort d'un BFR sous-financé.",
  },
  rejectedPaymentsCount: {
    rule: '≥ 1 rejet sur 12 mois = alerte',
    rationale:
      "Tout rejet de prélèvement ou de chèque signale une insuffisance de provision ou un litige fournisseur. Premier signal faible avant un défaut.",
  },
};
