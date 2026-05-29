import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common';
import { EventsStore } from './events.store';
import type { TrackedEvent } from './events.types';

type IngestBody = {
  type?: unknown;
  caseId?: unknown;
  durationMs?: unknown;
  payload?: unknown;
  ts?: unknown;
};

const MAX_PAYLOAD_KEYS = 32;
const MAX_TYPE_LENGTH = 100;

@Controller('events')
export class EventsController {
  constructor(private readonly store: EventsStore) {}

  @Post()
  @HttpCode(202)
  ingest(@Body() body: IngestBody): { ok: true } {
    if (
      typeof body?.type !== 'string' ||
      body.type.length === 0 ||
      body.type.length > MAX_TYPE_LENGTH
    ) {
      throw new BadRequestException(
        'Invalid event "type" (non-empty string required)',
      );
    }
    const ts =
      typeof body.ts === 'number' && Number.isFinite(body.ts) && body.ts > 0
        ? body.ts
        : Date.now();
    const caseId = typeof body.caseId === 'string' ? body.caseId : undefined;
    const durationMs =
      typeof body.durationMs === 'number' && Number.isFinite(body.durationMs)
        ? body.durationMs
        : undefined;
    let payload: Record<string, unknown> | undefined;
    if (
      body.payload &&
      typeof body.payload === 'object' &&
      !Array.isArray(body.payload)
    ) {
      const entries = Object.entries(
        body.payload as Record<string, unknown>,
      ).slice(0, MAX_PAYLOAD_KEYS);
      payload = Object.fromEntries(entries);
    }
    this.store.push({ ts, type: body.type, caseId, durationMs, payload });
    return { ok: true };
  }

  @Get()
  list(): TrackedEvent[] {
    return this.store.all();
  }
}
