import { Module } from '@nestjs/common';
import { DossiersModule } from './dossiers/dossiers.module';

@Module({
  imports: [DossiersModule],
})
export class AppModule {}
