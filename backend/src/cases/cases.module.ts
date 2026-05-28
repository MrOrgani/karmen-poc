import { Module } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { RedFlagDetector } from '../red-flags/red-flags.detector';
import { RuleEngine } from '../rule-engine/rule-engine';
import { ScoreExplainer } from '../score/score.explainer';
import { CockpitAggregator } from './cockpit.aggregator';
import { CasesController } from './cases.controller';
import { CasesRepository } from './cases.repository';

@Module({
  controllers: [CasesController],
  providers: [
    CasesRepository,
    CockpitAggregator,
    CompletenessEngine,
    RuleEngine,
    RedFlagDetector,
    ScoreExplainer,
  ],
  exports: [
    CasesRepository,
    CompletenessEngine,
    RuleEngine,
    RedFlagDetector,
    ScoreExplainer,
  ],
})
export class CasesModule {}
