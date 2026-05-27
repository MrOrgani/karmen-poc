#!/usr/bin/env node
/**
 * Source unique des types d'API : backend/src/dossiers/types.ts.
 * Ce script le copie vers frontend/src/lib/api-types.gen.ts (avec header).
 *
 * Exécuté en predev et prebuild côté frontend pour garantir l'alignement
 * sans dépendre de la mémoire du dev. Pas de dépendance npm — juste fs.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = join(ROOT, 'backend/src/dossiers/types.ts');
const TARGET = join(ROOT, 'frontend/src/shared/types/api.gen.ts');

if (!existsSync(SOURCE)) {
  console.error(`[sync-types] source introuvable : ${SOURCE}`);
  process.exit(1);
}

const body = readFileSync(SOURCE, 'utf8');

const header = `/* eslint-disable */
/**
 * AUTO-GENERATED — ne pas éditer à la main.
 *
 * Source : backend/src/dossiers/types.ts
 * Script : scripts/sync-types.mjs (exécuté en predev / prebuild côté frontend)
 *
 * Pour modifier ces types : édite le fichier source côté backend puis relance
 * le frontend (\`npm run dev\`). Les types frontend-only vivent dans
 * frontend/src/lib/types.ts qui re-exporte ceux-ci.
 */
`;

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, header + body, 'utf8');
console.log(`[sync-types] ${SOURCE} → ${TARGET}`);
