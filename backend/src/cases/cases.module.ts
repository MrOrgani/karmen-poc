import { Module } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
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
    ScoreExplainer,
  ],
  exports: [CasesRepository, CompletenessEngine, RuleEngine, ScoreExplainer],
})
export class CasesModule {}
