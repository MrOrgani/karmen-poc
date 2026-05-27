import { ScoreExplainer } from './score.explainer';
import { RedFlagDetector } from '../red-flags/red-flags.detector';
import type { AugmentedDossier } from '../dossiers/types';

function makeDossier(fin: AugmentedDossier['financialIndicators'], bank: AugmentedDossier['bankFlows']): AugmentedDossier {
  return {
    company: { id: 'c', name: '', siren: '', businessType: '', legalCategory: '', codeNaf: '', creationDate: '', address: '', countryCode: 'FR', postalCode: '', owner: '' },
    financing_request: { id: 'fr', type: 'loan', status: 'pending_review', company_id: 'c', fundUsage: '', rejectedReason: null, amount: 10000, durationInMonth: 12, interestRate: 5 },
    documents: [],
    score: { id: 's', financing_request_id: 'fr', risk_bucket: 'low', global_score: 80 },
    financialIndicators: fin,
    bankFlows: bank,
  };
}

describe('ScoreExplainer', () => {
  const explainer = new ScoreExplainer();
  const detector = new RedFlagDetector();

  it('dossier vraiment sain — 3 bullets reflétant marge, endettement, trésorerie', () => {
    const fin = { revenue: 280000, revenuePreviousYear: 245000, ebitda: 40000, netIncome: 23000, totalDebt: 30000, cashPosition: 30000, dso: 10 };
    const bank = { monthlyInflowsAverage: 24000, monthlyOutflowsAverage: 22500, overdraftDaysLast12m: 0, rejectedPaymentsCount: 0 };
    const dossier = makeDossier(fin, bank);
    const flags = detector.detect(fin, bank);
    expect(flags).toEqual([]);
    const { bullets } = explainer.explain(dossier, flags);
    expect(bullets).toHaveLength(3);
    expect(bullets.some((b) => b.toLowerCase().includes('rentab'))).toBe(true);
    expect(bullets.some((b) => b.toLowerCase().includes('endett'))).toBe(true);
    expect(bullets.some((b) => b.toLowerCase().includes('trésor') || b.toLowerCase().includes('bancaire'))).toBe(true);
  });

  it('REVENUE_DECLINING seul — bullet rentabilité évoque l’activité en repli', () => {
    const fin = { revenue: 100000, revenuePreviousYear: 200000, ebitda: 15000, netIncome: 5000, totalDebt: 20000, cashPosition: 20000, dso: 30 };
    const bank = { monthlyInflowsAverage: 9000, monthlyOutflowsAverage: 8000, overdraftDaysLast12m: 0, rejectedPaymentsCount: 0 };
    const dossier = makeDossier(fin, bank);
    const flags = detector.detect(fin, bank);
    expect(flags.some((f) => f.code === 'REVENUE_DECLINING')).toBe(true);
    const { bullets } = explainer.explain(dossier, flags);
    expect(bullets[0]).toMatch(/repli|baisse|N-1/i);
  });

  it('DSO_LONG seul — bullet trésorerie évoque le DSO', () => {
    const fin = { revenue: 200000, revenuePreviousYear: 195000, ebitda: 25000, netIncome: 10000, totalDebt: 20000, cashPosition: 30000, dso: 90 };
    const bank = { monthlyInflowsAverage: 17000, monthlyOutflowsAverage: 16000, overdraftDaysLast12m: 0, rejectedPaymentsCount: 0 };
    const dossier = makeDossier(fin, bank);
    const flags = detector.detect(fin, bank);
    expect(flags.some((f) => f.code === 'DSO_LONG')).toBe(true);
    const { bullets } = explainer.explain(dossier, flags);
    expect(bullets[2]).toMatch(/DSO|jours/i);
  });

  it('Transport Leclerc-like — au moins un bullet évoque l’endettement ou les découverts', () => {
    const fin = { revenue: 850000, revenuePreviousYear: 920000, ebitda: 25000, netIncome: -8000, totalDebt: 280000, cashPosition: 12000, dso: 75 };
    const bank = { monthlyInflowsAverage: 71000, monthlyOutflowsAverage: 73000, overdraftDaysLast12m: 75, rejectedPaymentsCount: 6 };
    const dossier = makeDossier(fin, bank);
    const flags = detector.detect(fin, bank);
    const { bullets } = explainer.explain(dossier, flags);
    expect(bullets.length).toBeLessThanOrEqual(3);
    expect(bullets.length).toBeGreaterThan(0);
    expect(bullets.some((b) => /endett|découvert|rentab/i.test(b))).toBe(true);
  });

  it('toujours ≤ 3 bullets quelle que soit la quantité de red flags', () => {
    const fin = { revenue: 100000, revenuePreviousYear: 200000, ebitda: 1000, netIncome: -5000, totalDebt: 80000, cashPosition: 100, dso: 90 };
    const bank = { monthlyInflowsAverage: 9000, monthlyOutflowsAverage: 10000, overdraftDaysLast12m: 100, rejectedPaymentsCount: 5 };
    const dossier = makeDossier(fin, bank);
    const flags = detector.detect(fin, bank);
    const { bullets } = explainer.explain(dossier, flags);
    expect(bullets.length).toBeLessThanOrEqual(3);
  });
});
