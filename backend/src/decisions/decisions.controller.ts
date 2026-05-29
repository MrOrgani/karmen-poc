import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { CasesRepository } from '../cases/cases.repository';
import type { AugmentedCase } from '../cases/types';
import { EventsStore } from '../events/events.store';

type DecisionType = 'approve' | 'request_docs' | 'reject';
const VALID_DECISIONS: readonly DecisionType[] = [
  'approve',
  'request_docs',
  'reject',
];
const MAX_JUSTIFICATION = 500;

const DECISION_TO_STATUS: Record<
  DecisionType,
  AugmentedCase['financing_request']['status']
> = {
  approve: 'approved',
  request_docs: 'awaiting_documents',
  reject: 'rejected',
};

type DecisionBody = {
  caseId?: unknown;
  decision?: unknown;
  justification?: unknown;
};

type DecisionResponse = {
  ok: true;
  decision: DecisionType;
  caseId: string;
  ts: number;
};

function isDecisionType(v: unknown): v is DecisionType {
  return (
    typeof v === 'string' && (VALID_DECISIONS as readonly string[]).includes(v)
  );
}

@Controller('decisions')
export class DecisionsController {
  private readonly logger = new Logger(DecisionsController.name);

  constructor(
    private readonly events: EventsStore,
    private readonly cases: CasesRepository,
  ) {}

  @Post()
  @HttpCode(201)
  async record(@Body() body: DecisionBody): Promise<DecisionResponse> {
    if (typeof body?.caseId !== 'string' || body.caseId.length === 0) {
      throw new BadRequestException(
        'Invalid "caseId" (non-empty string required)',
      );
    }
    if (!isDecisionType(body.decision)) {
      throw new BadRequestException(
        `Invalid "decision" (expected one of: ${VALID_DECISIONS.join(', ')})`,
      );
    }
    const justification =
      typeof body.justification === 'string'
        ? body.justification.slice(0, MAX_JUSTIFICATION)
        : '';
    const ts = Date.now();
    const nextStatus = DECISION_TO_STATUS[body.decision];
    const updated = await this.cases.updateStatus(body.caseId, nextStatus);
    if (!updated) {
      throw new NotFoundException(`Case "${body.caseId}" not found`);
    }
    const logSafeJustif = justification
      // eslint-disable-next-line no-control-regex -- on neutralise délibérément les caractères de contrôle pour le log
      .replace(/[\r\n\x00-\x1f\x7f]/g, ' ')
      .slice(0, 80);
    this.logger.log(
      `📝 [DecisionsController.record] case=${body.caseId} decision=${body.decision} status=${nextStatus} justifPreview="${logSafeJustif}"`,
    );
    this.events.push({
      ts,
      type: 'decision.made',
      caseId: body.caseId,
      payload: { decision: body.decision, justification, status: nextStatus },
    });
    return { ok: true, decision: body.decision, caseId: body.caseId, ts };
  }
}
