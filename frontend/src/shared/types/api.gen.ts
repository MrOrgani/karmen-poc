// AUTO-GENERATED depuis backend/src/cases/types.ts — ne pas éditer.
export type FinancingType = "loan" | "factoring";
export type RiskBucket = "low" | "medium" | "high";
export type DocumentType = "liasse_fiscale" | "releve_bancaire";
export type Severity = "low" | "medium" | "high";
export type MetricStatus = "ok" | "warn" | "alert" | "unknown";
export type RedFlagCategory = "financial" | "bank" | "factoring";
/**
 * Vue analytique transverse sur les règles (orthogonale à `RedFlagCategory`).
 * Sert à regrouper les flags pour la synthèse en 3 bullets du DecisionPanel.
 */
export type Theme = "profitability" | "debt" | "cash";

export type CaseDocument = {
  id: string;
  name: string;
  type: DocumentType;
  company_id: string;
  financing_request_id: string;
  metadata: {
    year?: number;
    bank?: string;
    account?: string;
    months_covered?: number;
  };
};

export type FinancialIndicators = {
  revenue: number;
  /** null si la liasse N-1 est manquante côté case — comparaison non calculable. */
  revenuePreviousYear: number | null;
  ebitda: number;
  netIncome: number;
  totalDebt: number;
  cashPosition: number;
  dso: number;
};

export type BankFlows = {
  monthlyInflowsAverage: number;
  monthlyOutflowsAverage: number;
  overdraftDaysLast12m: number;
  rejectedPaymentsCount: number;
};

/**
 * Indicateurs spécifiques affacturage — surfacés uniquement pour les cases
 * `financing_request.type === 'factoring'`. Absents en prêt.
 * Ratios exprimés en pourcentage du CA (0–100).
 */
export type FactoringIndicators = {
  /** % du CA réalisé avec le top 1 client. Au-delà de 30 % = concentration critique. */
  topClientConcentrationPct: number;
  /** % des créances clients dont l'ancienneté dépasse 60 jours. Au-delà de 20 % = balance âgée dégradée. */
  agedReceivablesPct: number;
  /** Avoirs émis / CA. Au-delà de 5 % = contestations clients fréquentes. */
  dilutionRatePct: number;
};

export type AugmentedCase = {
  company: {
    id: string;
    name: string;
    siren: string;
    businessType: string;
    legalCategory: string;
    codeNaf: string;
    creationDate: string;
    address: string;
    countryCode: string;
    postalCode: string;
    owner: string;
  };
  financing_request: {
    id: string;
    type: FinancingType;
    status: "pending_review" | "approved" | "rejected" | "awaiting_documents";
    company_id: string;
    fundUsage: string;
    rejectedReason: string | null;
    amount: number;
    durationInMonth: number;
    interestRate: number;
  };
  documents: CaseDocument[];
  score: {
    id: string;
    financing_request_id: string;
    risk_bucket: RiskBucket;
    global_score: number;
  };
  financialIndicators: FinancialIndicators;
  bankFlows: BankFlows;
  /** Présent uniquement si financing_request.type === 'factoring'. */
  factoringIndicators?: FactoringIndicators;
};

export type MissingItem = {
  type: DocumentType;
  /** Statut côté analyste, affiché dans la tuile complétude. Ex: "1/2 liasses fournies". */
  reason: string;
  /** Demande actionnable adressée au dirigeant, utilisée dans l'email de relance. Ex: "Liasse fiscale — 1 année supplémentaire à fournir". */
  clientAsk: string;
  details?: Record<string, unknown>;
};

export type CompletenessResult = {
  isComplete: boolean;
  missing: MissingItem[];
};

export type RedFlag = {
  severity: Severity;
  code: string;
  label: string;
  value: string;
  /** Human-readable threshold (e.g. "Dette > 5× EBITDA"). */
  threshold: string;
  /** One-sentence rationale of why this rule matters for credit analysis. */
  rationale: string;
  category: RedFlagCategory;
  /** Theme of the rule that emitted this flag — drives the 3-bullet synthesis. */
  theme?: Theme;
  /** Sentence à afficher si ce flag est le plus sévère de son thème. */
  explanation: string;
};

/** Per-KPI evaluation against reference thresholds — drives color coding in the UI. */
export type MetricStatuses = {
  revenue: MetricStatus;
  ebitda: MetricStatus;
  netIncome: MetricStatus;
  totalDebt: MetricStatus;
  cashPosition: MetricStatus;
  dso: MetricStatus;
  monthlyInflowsAverage: MetricStatus;
  monthlyOutflowsAverage: MetricStatus;
  overdraftDaysLast12m: MetricStatus;
  rejectedPaymentsCount: MetricStatus;
  /** Factoring uniquement — 'ok' par défaut pour les cases prêt. */
  topClientConcentrationPct: MetricStatus;
  agedReceivablesPct: MetricStatus;
  dilutionRatePct: MetricStatus;
};

/**
 * Couverture documentaire dérivée des `documents` du case — utilisée par
 * l'UI pour signaler les KPIs non calculables ou extrapolés (Option 2 hybride).
 */
export type DataCoverage = {
  hasLiassePreviousYear: boolean;
  /** Minimum mois couverts par compte bancaire (12 attendus). */
  bankMonthsCovered: number;
  bankCoverageFull: boolean;
};

/** Reference threshold for a single financial metric, exposed to the front for tooltips. */
export type MetricThreshold = {
  rule: string;
  rationale: string;
};

/** Map of metric key → reference threshold. Keys are stable identifiers used by the front. */
export type FinancialThresholds = Record<string, MetricThreshold>;

export type ScoreBullet = {
  text: string;
  /** Codes des indicateurs (RuleDiagnosticItem.code) que ce bullet couvre — sert au scroll/highlight depuis le DecisionPanel. */
  ruleCodes: string[];
};

export type ScoreExplanation = {
  bullets: ScoreBullet[];
};

export type RuleDiagnosticItem = {
  code: string;
  category: RedFlagCategory;
  label: string;
  status: MetricStatus;
  /** Valeur formatée pour affichage (toujours renseignée si status != 'unknown'). */
  value: string;
  /** Raison lisible si le KPI n'est pas calculable (status === 'unknown'). */
  unavailableReason?: string;
  threshold: string;
  rationale: string;
};

export type CaseCockpit = {
  caseData: AugmentedCase;
  completeness: CompletenessResult;
  redFlags: RedFlag[];
  scoreExplanation: ScoreExplanation;
  financialThresholds: FinancialThresholds;
  metricStatuses: MetricStatuses;
  dataCoverage: DataCoverage;
  rulesDiagnostic: RuleDiagnosticItem[];
};

export type CaseSummary = {
  id: string;
  companyName: string;
  type: FinancingType;
  amount: number;
  riskBucket: RiskBucket;
  globalScore: number;
  isComplete: boolean;
};
