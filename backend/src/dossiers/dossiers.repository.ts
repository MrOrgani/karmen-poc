import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { AugmentedDossier } from './types';

@Injectable()
export class DossiersRepository implements OnModuleInit {
  private readonly logger = new Logger(DossiersRepository.name);
  private dossiers: AugmentedDossier[] = [];

  async onModuleInit(): Promise<void> {
    const dataDir = this.resolveDataDir();
    const files = (await readdir(dataDir)).filter((f) => f.endsWith('.json'));
    const loaded: AugmentedDossier[] = [];
    for (const file of files) {
      const raw = await readFile(join(dataDir, file), 'utf-8');
      loaded.push(JSON.parse(raw) as AugmentedDossier);
    }
    this.dossiers = loaded;
    this.logger.log(
      `📁 [DossiersRepository.onModuleInit] loaded ${loaded.length} dossiers from ${dataDir}`,
    );
  }

  async list(): Promise<AugmentedDossier[]> {
    return [...this.dossiers];
  }

  async findById(id: string): Promise<AugmentedDossier | null> {
    return this.dossiers.find((d) => d.financing_request.id === id) ?? null;
  }

  async updateStatus(
    id: string,
    status: AugmentedDossier['financing_request']['status'],
  ): Promise<AugmentedDossier | null> {
    const dossier = this.dossiers.find((d) => d.financing_request.id === id);
    if (!dossier) return null;
    dossier.financing_request.status = status;
    return dossier;
  }

  private resolveDataDir(): string {
    let dir = process.cwd();
    for (let i = 0; i < 5; i++) {
      const candidate = resolve(dir, 'data/augmented');
      if (existsSync(candidate)) return candidate;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    throw new Error(
      `🚨 [DossiersRepository.resolveDataDir] data/augmented not found from cwd=${process.cwd()}`,
    );
  }
}
