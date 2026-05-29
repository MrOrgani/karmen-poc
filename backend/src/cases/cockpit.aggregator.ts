import { Injectable, NotFoundException } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { RuleEngine } from '../rule-engine/rule-engine';
import { ScoreExplainer } from '../score/score.explainer';
import { CasesRepository } from './cases.repository';
import { computeDataCoverage } from './data-coverage';
import { normalizeFinancialIndicators } from './normalize-financial-indicators';
import type { CaseCockpit } from './types';

@Injectable()
export class CockpitAggregator {
  constructor(
    private readonly repository: CasesRepository,
    private readonly completeness: CompletenessEngine,
    private readonly rules: RuleEngine,
    private readonly scoreExplainer: ScoreExplainer,
  ) {}

  async getCockpit(id: string): Promise<CaseCockpit> {
    const raw = await this.repository.findById(id);
    if (!raw) {
      throw new NotFoundException(`Case "${id}" not found`);
    }

    const dataCoverage = computeDataCoverage(raw);
    const caseData = normalizeFinancialIndicators(raw, dataCoverage);

    const completeness = this.completeness.check(caseData);
    const input = {
      fin: caseData.financialIndicators,
      bank: caseData.bankFlows,
      financingType: caseData.financing_request.type,
      factoring: caseData.factoringIndicators,
    };
    const redFlags = this.rules.redFlags(input);
    const metricStatuses = this.rules.metricStatuses(input);
    const rulesDiagnostic = this.rules.diagnostic(input);
    const scoreExplanation = this.scoreExplainer.explain(caseData, redFlags);

    return {
      caseData,
      completeness,
      redFlags,
      scoreExplanation,
      financialThresholds: this.rules.tileThresholds(),
      metricStatuses,
      dataCoverage,
      rulesDiagnostic,
    };
  }
}
