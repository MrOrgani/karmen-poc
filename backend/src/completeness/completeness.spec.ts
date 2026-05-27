import { CompletenessEngine } from './completeness.engine';
import type { AugmentedDossier, DossierDocument, FinancingType } from '../dossiers/types';

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

function makeDossier(opts: {
  id?: string;
  type?: FinancingType;
  documents: DossierDocument[];
}): AugmentedDossier {
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

const liasse = (id: string, year: number): DossierDocument => ({
  id, name: `Liasse ${year}`, type: 'liasse_fiscale', company_id: 'c-x', financing_request_id: 'fr-x',
  metadata: { year },
});

const releve = (id: string, bank: string, account: string, months: number): DossierDocument => ({
  id, name: `Relevés ${bank}`, type: 'releve_bancaire', company_id: 'c-x', financing_request_id: 'fr-x',
  metadata: { bank, account, months_covered: months },
});

const releveNoAccount = (id: string, bank: string, months: number): DossierDocument => ({
  id, name: `Relevés ${bank}`, type: 'releve_bancaire', company_id: 'c-x', financing_request_id: 'fr-x',
  metadata: { bank, months_covered: months },
});

describe('CompletenessEngine', () => {
  const engine = new CompletenessEngine();

  it('Brasserie-like — 2 liasses + 12 mois → 100% complet', () => {
    const dossier = makeDossier({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'Crédit Agricole', 'FR76A', 12)],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it('Studio Pixel-like — 1 liasse seulement → missing liasse_fiscale 1/2', () => {
    const dossier = makeDossier({
      documents: [liasse('d1', 2024), releve('d2', 'BNP Paribas', 'FR76B', 6)],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(false);
    const liasseMissing = result.missing.find((m) => m.type === 'liasse_fiscale');
    expect(liasseMissing).toBeDefined();
    expect(liasseMissing?.reason).toContain('1/2');
  });

  it('Fleurs-like — LCL avec 10 mois → missing releve_bancaire mentionne 10 et LCL', () => {
    const dossier = makeDossier({
      type: 'factoring',
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'LCL', 'FR76L', 10)],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(false);
    const releveMissing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(releveMissing).toBeDefined();
    expect(releveMissing?.reason).toContain('10');
    expect(releveMissing?.reason).toContain('LCL');
  });

  it('aucun relevé bancaire fourni → missing item explicite, isComplete false', () => {
    const dossier = makeDossier({ documents: [liasse('d1', 2023), liasse('d2', 2024)] });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(false);
    const missing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(missing).toBeDefined();
    expect(missing?.reason.toLowerCase()).toContain('aucun');
  });

  it('même compte avec 2 docs (6 + 6 mois) → 12 mois total, isComplete true', () => {
    const dossier = makeDossier({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releve('d3', 'BNP Paribas', 'FR76SAME', 6),
        releve('d4', 'BNP Paribas', 'FR76SAME', 6),
      ],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(true);
  });

  it('Transport Leclerc-like — 2 comptes (SG + BNP) × 12 mois → checks indépendants, complet', () => {
    const dossier = makeDossier({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releve('d3', 'Société Générale', 'FR76SG', 12),
        releve('d4', 'BNP Paribas', 'FR76BNP', 12),
      ],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(100);
  });

  // ─── Edge cases ──────────────────────────────────────────

  it('0 relevé + 2 liasses → score plafonné à 25% (signal de criticité)', () => {
    const dossier = makeDossier({ documents: [liasse('d1', 2023), liasse('d2', 2024)] });
    const result = engine.check(dossier);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.isComplete).toBe(false);
  });

  it('0 document du tout → score plafonné, missing items pour liasse ET relevé', () => {
    const dossier = makeDossier({ documents: [] });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.missing.find((m) => m.type === 'liasse_fiscale')).toBeDefined();
    expect(result.missing.find((m) => m.type === 'releve_bancaire')).toBeDefined();
  });

  it('relevés sans account, même banque → 1 seul bucket (somme des mois)', () => {
    const dossier = makeDossier({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releveNoAccount('d3', 'BNP Paribas', 6),
        releveNoAccount('d4', 'BNP Paribas', 6),
      ],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(100);
  });

  it('relevés sans account, banques différentes → buckets distincts', () => {
    const dossier = makeDossier({
      documents: [
        liasse('d1', 2023), liasse('d2', 2024),
        releveNoAccount('d3', 'BNP Paribas', 12),
        releveNoAccount('d4', 'LCL', 8),
      ],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(false);
    const missing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(missing).toBeDefined();
    expect(missing?.reason).toContain('LCL');
    expect(missing?.reason).toContain('8');
  });

  it('months_covered exactement = 12 (boundary) → considéré complet', () => {
    const dossier = makeDossier({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'BNP', 'FR76X', 12)],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(true);
  });

  it('months_covered = 11 (juste sous le seuil) → missing', () => {
    const dossier = makeDossier({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'BNP', 'FR76X', 11)],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(false);
    const missing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(missing?.reason).toContain('11');
  });

  it('factoring applique les mêmes seuils que loan (POC scope)', () => {
    const loanDossier = makeDossier({
      type: 'loan',
      documents: [liasse('d1', 2024), releve('d2', 'BNP', 'FR76X', 6)],
    });
    const factoringDossier = makeDossier({
      type: 'factoring',
      documents: [liasse('d3', 2024), releve('d4', 'BNP', 'FR76Y', 6)],
    });
    const loanResult = engine.check(loanDossier);
    const factoringResult = engine.check(factoringDossier);
    expect(loanResult.score).toBe(factoringResult.score);
    expect(loanResult.missing).toHaveLength(factoringResult.missing.length);
  });

  it('multiples comptes tous incomplets → score clampé à >= 0, missing items multiples', () => {
    const dossier = makeDossier({
      documents: [
        releve('d1', 'BNP', 'FR76A', 3),
        releve('d2', 'LCL', 'FR76B', 5),
        releve('d3', 'SG', 'FR76C', 7),
      ],
    });
    const result = engine.check(dossier);
    expect(result.isComplete).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.missing.length).toBeGreaterThanOrEqual(3); // liasse + 3 comptes incomplets
  });

  it('score arrondi correctement (1 manquant sur 3 items = 67%)', () => {
    const dossier = makeDossier({
      documents: [
        liasse('d1', 2024), // 1 sur 2 → missing 1 liasse
        releve('d2', 'BNP', 'FR76X', 12),
        releve('d3', 'LCL', 'FR76Y', 12),
      ],
    });
    const result = engine.check(dossier);
    // totalItems = 1 + 2 accounts = 3, missing = 1 (liasse) → completed = 2 → 66.67 → 67
    expect(result.score).toBe(67);
  });

  it('reason de missing liasse inclut le détail dans details', () => {
    const dossier = makeDossier({ documents: [liasse('d1', 2024)] });
    const result = engine.check(dossier);
    const liasseMissing = result.missing.find((m) => m.type === 'liasse_fiscale');
    expect(liasseMissing?.details).toMatchObject({ provided: 1, required: 2 });
  });

  it('reason de missing releve inclut bank + monthsProvided dans details', () => {
    const dossier = makeDossier({
      documents: [liasse('d1', 2023), liasse('d2', 2024), releve('d3', 'LCL', 'FR76L', 10)],
    });
    const result = engine.check(dossier);
    const releveMissing = result.missing.find((m) => m.type === 'releve_bancaire');
    expect(releveMissing?.details).toMatchObject({
      bank: 'LCL',
      monthsProvided: 10,
      monthsRequired: 12,
    });
  });
});
