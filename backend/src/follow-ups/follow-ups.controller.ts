import { Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { CasesRepository } from '../cases/cases.repository';
import { FollowUpsService, type FollowUpDraft } from './follow-ups.service';

@Controller('cases/:id/follow-ups')
export class FollowUpsController {
  constructor(
    private readonly repository: CasesRepository,
    private readonly followUps: FollowUpsService,
  ) {}

  @Post()
  async draft(@Param('id') id: string): Promise<FollowUpDraft> {
    const caseData = await this.repository.findById(id);
    if (!caseData) throw new NotFoundException(`Case "${id}" not found`);
    return this.followUps.draftForCase(caseData);
  }
}
