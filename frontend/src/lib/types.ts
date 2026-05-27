/**
 * Types frontend.
 *
 * Le coeur (DTOs API : AugmentedDossier, RedFlag, MetricStatuses, etc.) est
 * généré depuis backend/src/dossiers/types.ts via scripts/sync-types.mjs
 * (predev + prebuild). Ne pas éditer api-types.gen.ts à la main.
 *
 * Ce fichier ne contient désormais que ce qui est strictement frontend-only.
 */
export * from './api-types.gen';
