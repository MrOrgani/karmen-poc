#!/usr/bin/env node
// Copie backend/src/cases/types.ts → frontend/src/shared/types/api.gen.ts.
// Lancé en predev/prebuild côté frontend pour garantir l'alignement.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = join(ROOT, 'backend/src/cases/types.ts');
const TARGET = join(ROOT, 'frontend/src/shared/types/api.gen.ts');

if (!existsSync(SOURCE)) {
  console.error(`[sync-types] source introuvable : ${SOURCE}`);
  process.exit(1);
}

const body = readFileSync(SOURCE, 'utf8');

const header = `/* eslint-disable */
// AUTO-GENERATED depuis backend/src/cases/types.ts — ne pas éditer.
`;

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, header + body, 'utf8');
console.log(`[sync-types] ${SOURCE} → ${TARGET}`);
