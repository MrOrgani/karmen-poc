import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { EventsModule } from '../events/events.module';
import { LlmModule } from '../llm/llm.module';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';

@Module({
  imports: [EventsModule, CasesModule, LlmModule],
  controllers: [DecisionsController],
  providers: [DecisionsService],
})
export class DecisionsModule {}
