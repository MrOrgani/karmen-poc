import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { LlmModule } from '../llm/llm.module';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';

@Module({
  imports: [CasesModule, LlmModule],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
})
export class FollowUpsModule {}
