import { CompletenessEngine } from './completeness.engine';
import type { AugmentedCase, CaseDocument, FinancingType } from '../cases/types';

const baseFinancials = {
  revenue: 100000,
  revenuePreviousYear: 100000,
  ebitda: 10000,
  netIncome: 5000,
  totalDebt: 10000,
  cashPosition: 5000,
  dso: 30,
};
const baseFlows = {
  monthlyInflowsAverage: 8000,
  monthlyOutflowsAverage: 7500,
  overdraftDaysLast12m: 0,
  rejectedPaymentsCount: 0,
};

function makeCase(opts: {
  id?: string;
  type?: FinancingType;
  documents: CaseDocument[];
}): AugmentedCase {
  return {
    company: { id: 'c-x', name: 'X', siren: '0', businessType: '', legalCategory: '', codeNaf: '', creationDate: '', address: '', countryCode: 'FR', postalCode: '', owner: '' },
    financing_request: {
      id: opts.id ?? 'fr-x', type: opts.type ?? 'loan', status: 'pending_review', company_id: 'c-x',
      fundUsage: '', rejectedReason: null, amount: 10000, durationInMonth: 12, interestRate: 5,
    },
    documents: opts.documents,
    score: { id: 's-x', financing_request_id: opts.id ?? 'fr-x', risk_bucket: 'low', global_score: 80 },
    financialIndicators: baseFinancials,
    bankFlows: baseFlows,
  };
}

const liasse = (id: string, year: number): CaseDocument => ({
  id, name: `Liasse ${year}`, type: 'liasse_fiscale', company_id: 'c-x', financing_request_id: 'fr-x',
  metadata: { year },
});

const releve = (id: string, bank: string, account: string, months: number): CaseDocument => ({
  id, name: `Relevés ${bank}`, type: 'releve_bancaire', company_id: 'c-x', financing_request_id: 'fr-x',
  metadata: { bank, account, months_covered: months },
});

const releveNoAccount = (id: string, bank: string, months: number): CaseDocument => ({
  id, name: `Relevés ${bank}`, type: 'releve_bancaire', company_id: 'c-x', financing_request_id: 'fr-x',
  metadata: { bank, months_covered: months },
});

describe('CompletenessEngine', () => {
  const engine = new CompletenessEngine();

  it('Brasserie-like — 2 liasses + 12 mois → 100% complet', () => {
    const case_ = makeCase({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'Crédit Agricole', 'FR76A', 12)],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('Studio Pixel-like — 1 liasse seulement → missing liasse_fiscale 1/2', () => {
    const case_ = makeCase({
      documents: [liasse('d1', 2024), releve('d2', 'BNP Paribas', 'FR76B', 6)],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    const liasseMissing = result.missing.find((m) => m.type === 'liasse_fiscale');
    expect(liasseMissing).toBeDefined();
    expect(liasseMissing?.reason).toContain('1/2');
  });

  it('Fleurs-like — LCL avec 10 mois → missing releve_bancaire mentionne 10 et LCL', () => {
    const case_ = makeCase({
      type: 'factoring',
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'LCL', 'FR76L', 10)],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    const releveMissing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(releveMissing).toBeDefined();
    expect(releveMissing?.reason).toContain('10');
    expect(releveMissing?.reason).toContain('LCL');
  });

  it('aucun relevé bancaire fourni → missing item explicite, isComplete false', () => {
    const case_ = makeCase({ documents: [liasse('d1', 2023), liasse('d2', 2024)] });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    const missing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(missing).toBeDefined();
    expect(missing?.reason.toLowerCase()).toContain('aucun');
  });

  it('même compte avec 2 docs (6 + 6 mois) → 12 mois total, isComplete true', () => {
    const case_ = makeCase({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releve('d3', 'BNP Paribas', 'FR76SAME', 6),
        releve('d4', 'BNP Paribas', 'FR76SAME', 6),
      ],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(true);
  });

  it('Transport Leclerc-like — 2 comptes (SG + BNP) × 12 mois → checks indépendants, complet', () => {
    const case_ = makeCase({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releve('d3', 'Société Générale', 'FR76SG', 12),
        releve('d4', 'BNP Paribas', 'FR76BNP', 12),
      ],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(true);
  });

  // ─── Edge cases ──────────────────────────────────────────

  it('0 relevé + 2 liasses → missing relevé bancaire, isComplete false', () => {
    const case_ = makeCase({ documents: [liasse('d1', 2023), liasse('d2', 2024)] });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    expect(result.missing.find((m) => m.type === 'releve_bancaire')).toBeDefined();
  });

  it('0 document du tout → missing items pour liasse ET relevé', () => {
    const case_ = makeCase({ documents: [] });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    expect(result.missing.find((m) => m.type === 'liasse_fiscale')).toBeDefined();
    expect(result.missing.find((m) => m.type === 'releve_bancaire')).toBeDefined();
  });

  it('relevés sans account, même banque → 1 seul bucket (somme des mois)', () => {
    const case_ = makeCase({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releveNoAccount('d3', 'BNP Paribas', 6),
        releveNoAccount('d4', 'BNP Paribas', 6),
      ],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(true);
  });

  it('relevés sans account, banques différentes → buckets distincts', () => {
    const case_ = makeCase({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releveNoAccount('d3', 'BNP Paribas', 12),
        releveNoAccount('d4', 'LCL', 8),
      ],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    const missing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(missing).toBeDefined();
    expect(missing?.reason).toContain('LCL');
    expect(missing?.reason).toContain('8');
  });

  it('months_covered exactement = 12 (boundary) → considéré complet', () => {
    const case_ = makeCase({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'BNP', 'FR76X', 12)],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(true);
  });

  it('months_covered = 11 (juste sous le seuil) → missing', () => {
    const case_ = makeCase({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'BNP', 'FR76X', 11)],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    const missing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(missing?.reason).toContain('11');
  });

  it('factoring applique les mêmes seuils que loan (POC scope)', () => {
    const loanCase = makeCase({
      type: 'loan',
      documents: [liasse('d1', 2024), releve('d2', 'BNP', 'FR76X', 6)],
    });
    const factoringCase = makeCase({
      type: 'factoring',
      documents: [liasse('d3', 2024), releve('d4', 'BNP', 'FR76Y', 6)],
    });
    const loanResult = engine.check(loanCase);
    const factoringResult = engine.check(factoringCase);
    expect(loanResult.isComplete).toBe(factoringResult.isComplete);
    expect(loanResult.missing).toHaveLength(factoringResult.missing.length);
  });

  it('multiples comptes tous incomplets → missing items multiples', () => {
    const case_ = makeCase({
      documents: [
        releve('d1', 'BNP', 'FR76A', 3),
        releve('d2', 'LCL', 'FR76B', 5),
        releve('d3', 'SG', 'FR76C', 7),
      ],
    });
    const result = engine.check(case_);
    expect(result.isComplete).toBe(false);
    expect(result.missing.length).toBeGreaterThanOrEqual(4); // liasse + 3 comptes incomplets
  });

  it('reason de missing liasse inclut le détail dans details', () => {
    const case_ = makeCase({ documents: [liasse('d1', 2024)] });
    const result = engine.check(case_);
    const liasseMissing = result.missing.find((m) => m.type === 'liasse_fiscale');
    expect(liasseMissing?.details).toMatchObject({ provided: 1, required: 2 });
  });

  it('reason de missing releve inclut bank + monthsProvided dans details', () => {
    const case_ = makeCase({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'LCL', 'FR76L', 10)],
    });
    const result = engine.check(case_);
    const releveMissing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(releveMissing?.details).toMatchObject({
      bank: 'LCL',
      monthsProvided: 10,
      monthsRequired: 12,
    });
  });
});
