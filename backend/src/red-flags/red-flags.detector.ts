import { Injectable } from '@nestjs/common';
import type { BankFlows, FinancialIndicators, RedFlag } from '../dossiers/types';
import { RuleEngine } from '../rule-engine/rule-engine';

/**
 * Détecteur de red flags — délègue désormais à RuleEngine (source de vérité
 * unique des règles). Conservé comme service Injectable pour préserver le
 * contrat historique (`detect(fin, bank): RedFlag[]`) et les tests existants.
 */
@Injectable()
export class RedFlagDetector {
  constructor(private readonly engine: RuleEngine = new RuleEngine()) {}

  detect(fin: FinancialIndicators, bank: BankFlows): RedFlag[] {
    return this.engine.redFlags({ fin, bank });
  }
}
