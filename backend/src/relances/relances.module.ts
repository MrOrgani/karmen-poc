import { Module } from '@nestjs/common';
import { DossiersModule } from '../dossiers/dossiers.module';
import { RelancesController } from './relances.controller';
import { RelancesService } from './relances.service';

@Module({
  imports: [DossiersModule],
  controllers: [RelancesController],
  providers: [RelancesService],
})
export class RelancesModule {}
