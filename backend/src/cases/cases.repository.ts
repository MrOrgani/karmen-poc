import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { AugmentedCase } from './types';

@Injectable()
export class CasesRepository implements OnModuleInit {
  private readonly logger = new Logger(CasesRepository.name);
  private cases: AugmentedCase[] = [];

  async onModuleInit(): Promise<void> {
    const dataDir = this.resolveDataDir();
    const files = (await readdir(dataDir)).filter((f) => f.endsWith('.json'));
    const loaded: AugmentedCase[] = [];
    for (const file of files) {
      const raw = await readFile(join(dataDir, file), 'utf-8');
      loaded.push(JSON.parse(raw) as AugmentedCase);
    }
    this.cases = loaded;
    this.logger.log(
      `📁 [CasesRepository.onModuleInit] loaded ${loaded.length} cases from ${dataDir}`,
    );
  }

  async list(): Promise<AugmentedCase[]> {
    return [...this.cases];
  }

  async findById(id: string): Promise<AugmentedCase | null> {
    return this.cases.find((c) => c.financing_request.id === id) ?? null;
  }

  async updateStatus(
    id: string,
    status: AugmentedCase['financing_request']['status'],
  ): Promise<AugmentedCase | null> {
    const case_ = this.cases.find((c) => c.financing_request.id === id);
    if (!case_) return null;
    case_.financing_request.status = status;
    return case_;
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
      `🚨 [CasesRepository.resolveDataDir] data/augmented not found from cwd=${process.cwd()}`,
    );
  }
}
