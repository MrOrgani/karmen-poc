import { BadRequestException, Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { EventsStore } from '../events/events.store';

type DecisionType = 'approve' | 'request_docs' | 'reject';
const VALID_DECISIONS: readonly DecisionType[] = ['approve', 'request_docs', 'reject'];
const MAX_JUSTIFICATION = 500;

type DecisionBody = {
  dossierId?: unknown;
  decision?: unknown;
  justification?: unknown;
};

type DecisionResponse = {
  ok: true;
  decision: DecisionType;
  dossierId: string;
  ts: number;
};

function isDecisionType(v: unknown): v is DecisionType {
  return typeof v === 'string' && (VALID_DECISIONS as readonly string[]).includes(v);
}

@Controller('decisions')
export class DecisionsController {
  private readonly logger = new Logger(DecisionsController.name);

  constructor(private readonly events: EventsStore) {}

  @Post()
  @HttpCode(201)
  record(@Body() body: DecisionBody): DecisionResponse {
    if (typeof body?.dossierId !== 'string' || body.dossierId.length === 0) {
      throw new BadRequestException('Invalid "dossierId" (non-empty string required)');
    }
    if (!isDecisionType(body.decision)) {
      throw new BadRequestException(`Invalid "decision" (expected one of: ${VALID_DECISIONS.join(', ')})`);
    }
    const justification =
      typeof body.justification === 'string' ? body.justification.slice(0, MAX_JUSTIFICATION) : '';
    const ts = Date.now();
    this.logger.log(
      `📝 [DecisionsController.record] dossier=${body.dossierId} decision=${body.decision} justif="${justification}"`,
    );
    this.events.push({
      ts,
      type: 'decision.made',
      dossierId: body.dossierId,
      payload: { decision: body.decision, justification },
    });
    return { ok: true, decision: body.decision, dossierId: body.dossierId, ts };
  }
}
