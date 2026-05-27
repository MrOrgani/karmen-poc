import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DecisionsModule } from './decisions/decisions.module';
import { DossiersModule } from './dossiers/dossiers.module';
import { EventsModule } from './events/events.module';
import { TrackingMiddleware } from './events/tracking.middleware';
import { RelancesModule } from './relances/relances.module';

@Module({
  imports: [DossiersModule, EventsModule, RelancesModule, DecisionsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TrackingMiddleware).forRoutes('*');
  }
}
