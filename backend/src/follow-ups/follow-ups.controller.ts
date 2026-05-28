import { Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { CasesRepository } from '../cases/cases.repository';
import { FollowUpsService, type FollowUpDraft } from './follow-ups.service';

@Controller('cases/:id/follow-ups')
export class FollowUpsController {
  constructor(
    private readonly repository: CasesRepository,
    private readonly completeness: CompletenessEngine,
    private readonly followUps: FollowUpsService,
  ) {}

  @Post()
  async draft(@Param('id') id: string): Promise<FollowUpDraft> {
    const case_ = await this.repository.findById(id);
    if (!case_) throw new NotFoundException(`Case "${id}" not found`);
    const completeness = this.completeness.check(case_);
    return this.followUps.draft(case_, completeness.missing);
  }
}
