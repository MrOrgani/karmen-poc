import { Injectable, NotFoundException } from '@nestjs/common';
import { DossiersRepository } from './dossiers.repository';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { RedFlagDetector } from '../red-flags/red-flags.detector';
import { ScoreExplainer } from '../score/score.explainer';
import type { CockpitResponse } from './types';

@Injectable()
export class CockpitAggregator {
  constructor(
    private readonly repository: DossiersRepository,
    private readonly completeness: CompletenessEngine,
    private readonly redFlags: RedFlagDetector,
    private readonly scoreExplainer: ScoreExplainer,
  ) {}

  async getCockpit(id: string): Promise<CockpitResponse> {
    const dossier = await this.repository.findById(id);
    if (!dossier) {
      throw new NotFoundException(`Dossier "${id}" introuvable`);
    }
    const completeness = this.completeness.check(dossier);
    const redFlags = this.redFlags.detect(dossier.financialIndicators, dossier.bankFlows);
    const scoreExplanation = this.scoreExplainer.explain(dossier, redFlags);
    return { dossier, completeness, redFlags, scoreExplanation };
  }
}
