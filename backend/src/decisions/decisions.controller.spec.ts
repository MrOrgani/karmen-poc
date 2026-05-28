import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DossiersRepository } from '../dossiers/dossiers.repository';
import type { AugmentedDossier } from '../dossiers/types';
import { EventsStore } from '../events/events.store';
import { DecisionsController } from './decisions.controller';

type Status = AugmentedDossier['financing_request']['status'];

function makeRepo(found: boolean): {
  repo: DossiersRepository;
  updateStatus: jest.Mock;
} {
  const updateStatus = jest.fn(async (_id: string, status: Status) =>
    found ? ({ financing_request: { status } } as AugmentedDossier) : null,
  );
  return {
    repo: { updateStatus } as unknown as DossiersRepository,
    updateStatus,
  };
}

describe('DecisionsController.record', () => {
  let events: EventsStore;

  beforeEach(() => {
    events = new EventsStore();
  });

  describe('mapping decision → status', () => {
    it.each<[string, Status]>([
      ['approve', 'approved'],
      ['request_docs', 'awaiting_documents'],
      ['reject', 'rejected'],
    ])(
      'decision=%s → mute le repo en status=%s et pousse event decision.made',
      async (decision, expectedStatus) => {
        const { repo, updateStatus } = makeRepo(true);
        const controller = new DecisionsController(events, repo);

        const res = await controller.record({
          dossierId: 'fr-001',
          decision,
          justification: 'ok',
        });

        expect(updateStatus).toHaveBeenCalledWith('fr-001', expectedStatus);
        expect(res).toMatchObject({ ok: true, decision, dossierId: 'fr-001' });
        expect(typeof res.ts).toBe('number');

        const pushed = events.all();
        expect(pushed).toHaveLength(1);
        expect(pushed[0]).toMatchObject({
          type: 'decision.made',
          dossierId: 'fr-001',
          payload: { decision, status: expectedStatus, justification: 'ok' },
        });
      },
    );
  });

  it('dossier introuvable → NotFoundException, aucun event pushé', async () => {
    const { repo, updateStatus } = makeRepo(false);
    const controller = new DecisionsController(events, repo);

    await expect(
      controller.record({
        dossierId: 'fr-unknown',
        decision: 'approve',
        justification: '',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(updateStatus).toHaveBeenCalledTimes(1);
    expect(events.count()).toBe(0);
  });

  it('decision invalide → BadRequestException, repo non appelé, aucun event', async () => {
    const { repo, updateStatus } = makeRepo(true);
    const controller = new DecisionsController(events, repo);

    await expect(
      controller.record({
        dossierId: 'fr-001',
        decision: 'pending',
        justification: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(updateStatus).not.toHaveBeenCalled();
    expect(events.count()).toBe(0);
  });

  it.each<[string, unknown]>([
    ['dossierId vide', ''],
    ['dossierId non-string', 42],
    ['dossierId undefined', undefined],
  ])('%s → BadRequestException', async (_, dossierId) => {
    const { repo, updateStatus } = makeRepo(true);
    const controller = new DecisionsController(events, repo);

    await expect(
      controller.record({ dossierId, decision: 'approve', justification: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('justification > 500 caractères → tronquée dans le payload event', async () => {
    const { repo } = makeRepo(true);
    const controller = new DecisionsController(events, repo);
    const longJustif = 'a'.repeat(800);

    await controller.record({
      dossierId: 'fr-001',
      decision: 'approve',
      justification: longJustif,
    });

    const [pushed] = events.all();
    expect(
      (pushed.payload as { justification: string }).justification,
    ).toHaveLength(500);
  });

  it('justification non-string → traitée comme chaîne vide', async () => {
    const { repo } = makeRepo(true);
    const controller = new DecisionsController(events, repo);

    await controller.record({
      dossierId: 'fr-001',
      decision: 'reject',
      justification: 42,
    });

    const [pushed] = events.all();
    expect((pushed.payload as { justification: string }).justification).toBe(
      '',
    );
  });
});
