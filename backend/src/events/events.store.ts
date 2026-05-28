import { Injectable, Logger } from '@nestjs/common';
import type { TrackedEvent } from './events.types';

const MAX_EVENTS = 5000;

@Injectable()
export class EventsStore {
  private readonly logger = new Logger(EventsStore.name);
  private readonly events: TrackedEvent[] = [];

  push(event: TrackedEvent): void {
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS);
    }
    this.logger.log(
      `📊 [EventsStore.push] type=${event.type} case=${event.caseId ?? '-'} dur=${event.durationMs ?? '-'}ms`,
    );
  }

  all(): TrackedEvent[] {
    return [...this.events];
  }

  count(): number {
    return this.events.length;
  }
}
