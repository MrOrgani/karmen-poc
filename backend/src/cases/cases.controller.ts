import { Controller, Get, Param } from '@nestjs/common';
import { CasesRepository } from './cases.repository';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { CockpitAggregator } from './cockpit.aggregator';
import type { CaseCockpit, CaseSummary } from './types';

@Controller('cases')
export class CasesController {
  constructor(
    private readonly repository: CasesRepository,
    private readonly completeness: CompletenessEngine,
    private readonly aggregator: CockpitAggregator,
  ) {}

  @Get()
  async list(): Promise<CaseSummary[]> {
    const cases = await this.repository.list();
    return cases.map((c) => ({
      id: c.financing_request.id,
      companyName: c.company.name,
      type: c.financing_request.type,
      amount: c.financing_request.amount,
      riskBucket: c.score.risk_bucket,
      globalScore: c.score.global_score,
      isComplete: this.completeness.check(c).isComplete,
    }));
  }

  @Get(':id/cockpit')
  async cockpit(@Param('id') id: string): Promise<CaseCockpit> {
    return this.aggregator.getCockpit(id);
  }
}
