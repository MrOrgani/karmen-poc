import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { EventsModule } from '../events/events.module';
import { DecisionsController } from './decisions.controller';

@Module({
  imports: [EventsModule, CasesModule],
  controllers: [DecisionsController],
})
export class DecisionsModule {}
