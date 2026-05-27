import { Module } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { RedFlagDetector } from '../red-flags/red-flags.detector';
import { ScoreExplainer } from '../score/score.explainer';
import { CockpitAggregator } from './cockpit.aggregator';
import { DossiersController } from './dossiers.controller';
import { DossiersRepository } from './dossiers.repository';

@Module({
  controllers: [DossiersController],
  providers: [
    DossiersRepository,
    CockpitAggregator,
    CompletenessEngine,
    RedFlagDetector,
    ScoreExplainer,
  ],
  exports: [
    DossiersRepository,
    CompletenessEngine,
    RedFlagDetector,
    ScoreExplainer,
  ],
})
export class DossiersModule {}
