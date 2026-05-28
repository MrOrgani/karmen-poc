import { Module } from '@nestjs/common';
import { DossiersModule } from '../dossiers/dossiers.module';
import { EventsModule } from '../events/events.module';
import { DecisionsController } from './decisions.controller';

@Module({
  imports: [EventsModule, DossiersModule],
  controllers: [DecisionsController],
})
export class DecisionsModule {}
