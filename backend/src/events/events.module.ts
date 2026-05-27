import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsStore } from './events.store';

@Module({
  controllers: [EventsController],
  providers: [EventsStore],
  exports: [EventsStore],
})
export class EventsModule {}
