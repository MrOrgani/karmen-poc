import { Injectable, NotFoundException } from '@nestjs/common';
import { DossiersRepository } from './dossiers.repository';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { RuleEngine } from '../rule-engine/rule-engine';
import { ScoreExplainer } from '../score/score.explainer';
import type { CockpitResponse } from './types';
import { computeDataCoverage } from './data-coverage';
import { normalizeFinancialIndicators } from './normalize-financial-indicators';

@Injectable()
export class CockpitAggregator {
  constructor(
    private readonly repository: DossiersRepository,
    private readonly completeness: CompletenessEngine,
    private readonly rules: RuleEngine,
    private readonly scoreExplainer: ScoreExplainer,
  ) {}

  async getCockpit(id: string): Promise<CockpitResponse> {
    const raw = await this.repository.findById(id);
    if (!raw) {
      throw new NotFoundException(`Dossier "${id}" introuvable`);
    }

    const dataCoverage = computeDataCoverage(raw);
    const dossier = normalizeFinancialIndicators(raw, dataCoverage);

    const completeness = this.completeness.check(dossier);
    const input = {
      fin: dossier.financialIndicators,
      bank: dossier.bankFlows,
      financingType: dossier.financing_request.type,
      factoring: dossier.factoringIndicators,
    };
    const redFlags = this.rules.redFlags(input);
    const metricStatuses = this.rules.metricStatuses(input);
    const rulesDiagnostic = this.rules.diagnostic(input);
    const scoreExplanation = this.scoreExplainer.explain(dossier, redFlags);

    return {
      dossier,
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
