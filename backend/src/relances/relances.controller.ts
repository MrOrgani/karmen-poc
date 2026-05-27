import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { CompletenessEngine } from '../completeness/completeness.engine';
import { DossiersRepository } from '../dossiers/dossiers.repository';
import { RelancesService, type RelanceDraft } from './relances.service';

type DraftBody = { dossierId: string };

@Controller('relances')
export class RelancesController {
  constructor(
    private readonly repository: DossiersRepository,
    private readonly completeness: CompletenessEngine,
    private readonly relances: RelancesService,
  ) {}

  @Post('draft')
  async draft(@Body() body: DraftBody): Promise<RelanceDraft> {
    const dossier = await this.repository.findById(body.dossierId);
    if (!dossier)
      throw new NotFoundException(`Dossier "${body.dossierId}" introuvable`);
    const completeness = this.completeness.check(dossier);
    return this.relances.draft(dossier, completeness.missing);
  }
}
