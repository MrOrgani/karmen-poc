import { RuleEngine } from './rule-engine';
import type { BankFlows, FactoringIndicators, FinancialIndicators, FinancingType } from '../cases/types';

const healthyFin: FinancialIndicators = {
  revenue: 300000,
  revenuePreviousYear: 280000,
  ebitda: 45000,
  netIncome: 25000,
  totalDebt: 30000,
  cashPosition: 30000,
  dso: 25,
};
const healthyBank: BankFlows = {
  monthlyInflowsAverage: 25000,
  monthlyOutflowsAverage: 22000,
  overdraftDaysLast12m: 0,
  rejectedPaymentsCount: 0,
};

describe('RuleEngine.redFlags — règles prêt', () => {
  const engine = new RuleEngine();
  const flags = (fin: FinancialIndicators, bank: BankFlows, financingType: FinancingType = 'loan') =>
    engine.redFlags({ fin, bank, financingType });

  it('dossier sain → aucun red flag', () => {
    expect(flags(healthyFin, healthyBank)).toEqual([]);
  });

  it('DEBT_TO_EBITDA_HIGH se déclenche pour dette > 5× EBITDA', () => {
    const fin = { ...healthyFin, ebitda: 10000, totalDebt: 60000 };
    const flag = flags(fin, healthyBank).find((f) => f.code === 'DEBT_TO_EBITDA_HIGH');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('high');
    expect(flag?.value).toContain('6.0×');
  });

  it('DEBT_TO_EBITDA_MEDIUM se déclenche dans la zone 3×–5×', () => {
    const fin = { ...healthyFin, ebitda: 10000, totalDebt: 40000 };
    const out = flags(fin, healthyBank);
    const flag = out.find((f) => f.code === 'DEBT_TO_EBITDA_MEDIUM');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('medium');
    expect(out.find((f) => f.code === 'DEBT_TO_EBITDA_HIGH')).toBeUndefined();
  });

  it('EBITDA_MARGIN_LOW se déclenche pour marge < 5%', () => {
    const fin = { ...healthyFin, revenue: 1000000, ebitda: 30000 };
    expect(flags(fin, healthyBank).find((f) => f.code === 'EBITDA_MARGIN_LOW')).toBeDefined();
  });

  it('NEGATIVE_NET_INCOME se déclenche pour résultat net négatif', () => {
    const fin = { ...healthyFin, netIncome: -1000 };
    expect(flags(fin, healthyBank).find((f) => f.code === 'NEGATIVE_NET_INCOME')).toBeDefined();
  });

  it('REVENUE_DECLINING se déclenche pour CA < 90% N-1', () => {
    const fin = { ...healthyFin, revenue: 200000, revenuePreviousYear: 300000 };
    expect(flags(fin, healthyBank).find((f) => f.code === 'REVENUE_DECLINING')).toBeDefined();
  });

  it('OVERDRAFT_DAYS_HIGH se déclenche au-delà de 30 jours', () => {
    const flag = flags(healthyFin, { ...healthyBank, overdraftDaysLast12m: 45 }).find(
      (f) => f.code === 'OVERDRAFT_DAYS_HIGH',
    );
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('high');
  });

  it('REJECTED_PAYMENTS se déclenche pour ≥1 rejet', () => {
    expect(
      flags(healthyFin, { ...healthyBank, rejectedPaymentsCount: 2 }).find((f) => f.code === 'REJECTED_PAYMENTS'),
    ).toBeDefined();
  });

  it('LOW_CASH_POSITION se déclenche quand cash < sorties moy', () => {
    const fin = { ...healthyFin, cashPosition: 1000 };
    const bank = { ...healthyBank, monthlyOutflowsAverage: 20000 };
    expect(flags(fin, bank).find((f) => f.code === 'LOW_CASH_POSITION')).toBeDefined();
  });

  it('DSO_LONG se déclenche au-delà de 60j (severity medium par défaut = loan)', () => {
    const flag = flags({ ...healthyFin, dso: 75 }, healthyBank).find((f) => f.code === 'DSO_LONG');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('medium');
  });

  it('DSO_LONG passe en severity high pour un dossier factoring', () => {
    const flag = flags({ ...healthyFin, dso: 75 }, healthyBank, 'factoring').find((f) => f.code === 'DSO_LONG');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('high');
  });

  it('EBITDA_NEGATIVE_OR_ZERO se déclenche pour EBITDA ≤ 0 (et supprime les ratios dette/EBITDA)', () => {
    const out = flags({ ...healthyFin, ebitda: 0, totalDebt: 50000 }, healthyBank);
    expect(out.find((f) => f.code === 'EBITDA_NEGATIVE_OR_ZERO')).toBeDefined();
    expect(out.find((f) => f.code === 'DEBT_TO_EBITDA_HIGH')).toBeUndefined();
  });
});

describe('RuleEngine — règles factoring', () => {
  const engine = new RuleEngine();
  const healthyFactoring: FactoringIndicators = {
    topClientConcentrationPct: 15,
    agedReceivablesPct: 8,
    dilutionRatePct: 2,
  };

  it("aucune règle factoring n'est émise pour un dossier prêt, même si factoring fourni", () => {
    const flags = engine.redFlags({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'loan',
      factoring: { topClientConcentrationPct: 90, agedReceivablesPct: 90, dilutionRatePct: 90 },
    });
    expect(flags.find((f) => f.code === 'CONCENTRATION_TOP_CLIENT')).toBeUndefined();
    expect(flags.find((f) => f.code === 'AGED_RECEIVABLES_HIGH')).toBeUndefined();
    expect(flags.find((f) => f.code === 'DILUTION_RATE_HIGH')).toBeUndefined();
  });

  it('aucune tuile factoring dans le diagnostic pour un dossier prêt', () => {
    const diag = engine.diagnostic({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'loan',
    });
    expect(diag.find((d) => d.category === 'factoring')).toBeUndefined();
  });

  it('3 tuiles factoring (ok) dans le diagnostic pour un dossier factoring sain', () => {
    const diag = engine.diagnostic({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'factoring',
      factoring: healthyFactoring,
    });
    const tiles = diag.filter((d) => d.category === 'factoring');
    expect(tiles).toHaveLength(3);
    expect(tiles.every((t) => t.status === 'ok')).toBe(true);
  });

  it('CONCENTRATION_TOP_CLIENT high si top 1 > 30 %', () => {
    const flags = engine.redFlags({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'factoring',
      factoring: { ...healthyFactoring, topClientConcentrationPct: 38 },
    });
    const f = flags.find((x) => x.code === 'CONCENTRATION_TOP_CLIENT');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('high');
  });

  it('AGED_RECEIVABLES_HIGH high si > 20 % des créances > 60 j', () => {
    const flags = engine.redFlags({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'factoring',
      factoring: { ...healthyFactoring, agedReceivablesPct: 25 },
    });
    const f = flags.find((x) => x.code === 'AGED_RECEIVABLES_HIGH');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('high');
  });

  it('DILUTION_RATE_HIGH medium si avoirs/CA > 5 %', () => {
    const flags = engine.redFlags({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'factoring',
      factoring: { ...healthyFactoring, dilutionRatePct: 6 },
    });
    const f = flags.find((x) => x.code === 'DILUTION_RATE_HIGH');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('medium');
  });

  it('dossier factoring sans factoringIndicators → tuiles unknown, aucun red flag factoring', () => {
    const diag = engine.diagnostic({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'factoring',
    });
    const tiles = diag.filter((d) => d.category === 'factoring');
    expect(tiles).toHaveLength(3);
    expect(tiles.every((t) => t.status === 'unknown')).toBe(true);
    const flags = engine.redFlags({
      fin: healthyFin,
      bank: healthyBank,
      financingType: 'factoring',
    });
    expect(flags.find((f) => f.code === 'CONCENTRATION_TOP_CLIENT')).toBeUndefined();
  });
});
