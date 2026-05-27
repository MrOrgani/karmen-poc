export type FinancingType = 'loan' | 'factoring';
export type RiskBucket = 'low' | 'medium' | 'high';
export type Severity = 'low' | 'medium' | 'high';
export type DocumentType = 'liasse_fiscale' | 'releve_bancaire';

export type DossierSummary = {
  id: string;
  companyName: string;
  type: FinancingType;
  amount: number;
  riskBucket: RiskBucket;
  completenessScore: number;
};

export type MissingItem = {
  type: DocumentType;
  reason: string;
  details?: Record<string, unknown>;
};

export type RedFlag = {
  severity: Severity;
  code: string;
  label: string;
  value: string;
};

export type CompletenessResult = {
  score: number;
  isComplete: boolean;
  missing: MissingItem[];
};

export type ScoreExplanation = {
  bullets: string[];
};

export type AugmentedDossier = {
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
    status: 'pending_review' | 'approved' | 'rejected' | 'awaiting_documents';
    company_id: string;
    fundUsage: string;
    rejectedReason: string | null;
    amount: number;
    durationInMonth: number;
    interestRate: number;
  };
  documents: Array<{
    id: string;
    name: string;
    type: DocumentType;
    company_id: string;
    financing_request_id: string;
    metadata: { year?: number; bank?: string; account?: string; months_covered?: number };
  }>;
  score: {
    id: string;
    financing_request_id: string;
    risk_bucket: RiskBucket;
    global_score: number;
  };
  financialIndicators: {
    revenue: number;
    revenuePreviousYear: number;
    ebitda: number;
    netIncome: number;
    totalDebt: number;
    cashPosition: number;
    dso: number;
  };
  bankFlows: {
    monthlyInflowsAverage: number;
    monthlyOutflowsAverage: number;
    overdraftDaysLast12m: number;
    rejectedPaymentsCount: number;
  };
};

export type CockpitResponse = {
  dossier: AugmentedDossier;
  completeness: CompletenessResult;
  redFlags: RedFlag[];
  scoreExplanation: ScoreExplanation;
};
