import { Injectable, NotFoundException } from '@nestjs/common';
import { DossiersRepository } from './dossiers.repository';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { RedFlagDetector } from '../red-flags/red-flags.detector';
import { ScoreExplainer } from '../score/score.explainer';
import type { AugmentedDossier, CockpitResponse } from './types';
import { FINANCIAL_THRESHOLDS } from './financial-thresholds.constants';
import { computeDataCoverage } from './data-coverage';
import { computeMetricStatuses } from './metric-status';
import { buildRulesDiagnostic } from './rules-diagnostic';

@Injectable()
export class CockpitAggregator {
  constructor(
    private readonly repository: DossiersRepository,
    private readonly completeness: CompletenessEngine,
    private readonly redFlags: RedFlagDetector,
    private readonly scoreExplainer: ScoreExplainer,
  ) {}

  async getCockpit(id: string): Promise<CockpitResponse> {
    const raw = await this.repository.findById(id);
    if (!raw) {
      throw new NotFoundException(`Dossier "${id}" introuvable`);
    }

    const dataCoverage = computeDataCoverage(raw);

    // Option 2 hybride : si la liasse N-1 manque, revenuePreviousYear devient
    // null → la tile CA bascule en "non comparable" et le red flag
    // REVENUE_DECLINING ne se déclenche pas.
    const dossier: AugmentedDossier = dataCoverage.hasLiassePreviousYear
      ? raw
      : {
          ...raw,
          financialIndicators: {
            ...raw.financialIndicators,
            revenuePreviousYear: null,
          },
        };

    const completeness = this.completeness.check(dossier);
    const redFlags = this.redFlags.detect(
      dossier.financialIndicators,
      dossier.bankFlows,
    );
    const scoreExplanation = this.scoreExplainer.explain(dossier, redFlags);
    const metricStatuses = computeMetricStatuses(
      dossier.financialIndicators,
      dossier.bankFlows,
    );
    const rulesDiagnostic = buildRulesDiagnostic(
      dossier.financialIndicators,
      dossier.bankFlows,
      metricStatuses,
    );

    return {
      dossier,
      completeness,
      redFlags,
      scoreExplanation,
      financialThresholds: FINANCIAL_THRESHOLDS,
      metricStatuses,
      dataCoverage,
      rulesDiagnostic,
    };
  }
}
