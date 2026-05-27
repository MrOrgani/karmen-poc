import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { DecisionsController } from './decisions.controller';

@Module({
  imports: [EventsModule],
  controllers: [DecisionsController],
})
export class DecisionsModule {}
