import { Controller, Get, Param } from '@nestjs/common';
import { DossiersRepository } from './dossiers.repository';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { CockpitAggregator } from './cockpit.aggregator';
import type { CockpitResponse, DossierSummary } from './types';

@Controller('dossiers')
export class DossiersController {
  constructor(
    private readonly repository: DossiersRepository,
    private readonly completeness: CompletenessEngine,
    private readonly aggregator: CockpitAggregator,
  ) {}

  @Get()
  async list(): Promise<DossierSummary[]> {
    const dossiers = await this.repository.list();
    return dossiers.map((d) => ({
      id: d.financing_request.id,
      companyName: d.company.name,
      type: d.financing_request.type,
      amount: d.financing_request.amount,
      riskBucket: d.score.risk_bucket,
      completenessScore: this.completeness.check(d).score,
    }));
  }

  @Get(':id/cockpit')
  async cockpit(@Param('id') id: string): Promise<CockpitResponse> {
    return this.aggregator.getCockpit(id);
  }
}
