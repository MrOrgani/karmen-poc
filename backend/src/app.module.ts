import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DecisionsModule } from './decisions/decisions.module';
import { CasesModule } from './cases/cases.module';
import { EventsModule } from './events/events.module';
import { TrackingMiddleware } from './events/tracking.middleware';
import { FollowUpsModule } from './follow-ups/follow-ups.module';

@Module({
  imports: [CasesModule, EventsModule, FollowUpsModule, DecisionsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TrackingMiddleware).forRoutes('*');
  }
}
