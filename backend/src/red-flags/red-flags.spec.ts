import { RedFlagDetector } from './red-flags.detector';
import type { BankFlows, FinancialIndicators } from '../dossiers/types';

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

describe('RedFlagDetector', () => {
  const detector = new RedFlagDetector();

  it('dossier sain → aucun red flag', () => {
    expect(detector.detect(healthyFin, healthyBank)).toEqual([]);
  });

  it('DEBT_TO_EBITDA_HIGH se déclenche pour dette > 5× EBITDA', () => {
    const fin = { ...healthyFin, ebitda: 10000, totalDebt: 60000 };
    const flags = detector.detect(fin, healthyBank);
    const flag = flags.find((f) => f.code === 'DEBT_TO_EBITDA_HIGH');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('high');
    expect(flag?.value).toContain('6.0×');
  });

  it('DEBT_TO_EBITDA_MEDIUM se déclenche dans la zone 3×–5×', () => {
    const fin = { ...healthyFin, ebitda: 10000, totalDebt: 40000 };
    const flags = detector.detect(fin, healthyBank);
    const flag = flags.find((f) => f.code === 'DEBT_TO_EBITDA_MEDIUM');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('medium');
    expect(flags.find((f) => f.code === 'DEBT_TO_EBITDA_HIGH')).toBeUndefined();
  });

  it('EBITDA_MARGIN_LOW se déclenche pour marge < 5%', () => {
    const fin = { ...healthyFin, revenue: 1000000, ebitda: 30000 };
    const flags = detector.detect(fin, healthyBank);
    expect(flags.find((f) => f.code === 'EBITDA_MARGIN_LOW')).toBeDefined();
  });

  it('NEGATIVE_NET_INCOME se déclenche pour résultat net négatif', () => {
    const fin = { ...healthyFin, netIncome: -1000 };
    const flags = detector.detect(fin, healthyBank);
    expect(flags.find((f) => f.code === 'NEGATIVE_NET_INCOME')).toBeDefined();
  });

  it('REVENUE_DECLINING se déclenche pour CA < 90% N-1', () => {
    const fin = { ...healthyFin, revenue: 200000, revenuePreviousYear: 300000 };
    const flags = detector.detect(fin, healthyBank);
    expect(flags.find((f) => f.code === 'REVENUE_DECLINING')).toBeDefined();
  });

  it('OVERDRAFT_DAYS_HIGH se déclenche au-delà de 30 jours', () => {
    const flags = detector.detect(healthyFin, { ...healthyBank, overdraftDaysLast12m: 45 });
    const flag = flags.find((f) => f.code === 'OVERDRAFT_DAYS_HIGH');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('high');
  });

  it('REJECTED_PAYMENTS se déclenche pour ≥1 rejet', () => {
    const flags = detector.detect(healthyFin, { ...healthyBank, rejectedPaymentsCount: 2 });
    expect(flags.find((f) => f.code === 'REJECTED_PAYMENTS')).toBeDefined();
  });

  it('LOW_CASH_POSITION se déclenche quand cash < sorties moy', () => {
    const fin = { ...healthyFin, cashPosition: 1000 };
    const bank = { ...healthyBank, monthlyOutflowsAverage: 20000 };
    const flags = detector.detect(fin, bank);
    expect(flags.find((f) => f.code === 'LOW_CASH_POSITION')).toBeDefined();
  });

  it('DSO_LONG se déclenche au-delà de 60j', () => {
    const flags = detector.detect({ ...healthyFin, dso: 75 }, healthyBank);
    expect(flags.find((f) => f.code === 'DSO_LONG')).toBeDefined();
  });

  it('EBITDA_NEGATIVE_OR_ZERO se déclenche pour EBITDA ≤ 0 (et supprime les ratios dette/EBITDA)', () => {
    const flags = detector.detect({ ...healthyFin, ebitda: 0, totalDebt: 50000 }, healthyBank);
    expect(flags.find((f) => f.code === 'EBITDA_NEGATIVE_OR_ZERO')).toBeDefined();
    expect(flags.find((f) => f.code === 'DEBT_TO_EBITDA_HIGH')).toBeUndefined();
  });
});
