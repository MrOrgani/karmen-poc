/**
 * Types frontend.
 *
 * Le coeur (DTOs API : AugmentedDossier, RedFlag, MetricStatuses, etc.) est
 * généré depuis backend/src/dossiers/types.ts via scripts/sync-types.mjs
 * (predev + prebuild). Ne pas éditer api.gen.ts à la main.
 *
 * Les types frontend-only viendraient ici si besoin (aucun pour l'instant).
 */
export * from './api.gen';
