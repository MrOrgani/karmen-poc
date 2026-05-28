import { Injectable } from '@nestjs/common';
import type {
  BankFlows,
  FinancialIndicators,
  FinancingType,
  RedFlag,
} from '../dossiers/types';
import { RuleEngine } from '../rule-engine/rule-engine';

@Injectable()
export class RedFlagDetector {
  constructor(private readonly engine: RuleEngine = new RuleEngine()) {}

  detect(
    fin: FinancialIndicators,
    bank: BankFlows,
    financingType: FinancingType = 'loan',
  ): RedFlag[] {
    return this.engine.redFlags({ fin, bank, financingType });
  }
}
