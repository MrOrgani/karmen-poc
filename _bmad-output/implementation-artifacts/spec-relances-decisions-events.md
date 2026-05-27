---
title: 'Relances + Décisions + Instrumentation jour 1'
type: 'feature'
created: '2026-05-27'
status: 'done'
baseline_commit: '186d371'
context:
  - '{project-root}/_bmad-output/prd-cockpit-analyste.md'
  - '{project-root}/_bmad-output/architecture-poc-karmen.md'
---

## Intent

**Problem:** Le cockpit affiche les données mais l'analyste n'a aucun moyen de (1) relancer le client pour les pièces manquantes, (2) tracer sa décision finale, ni (3) mesurer le temps passé. Sans instrumentation jour 1, impossible de valider la promesse "2h → 30 min" en post-démo.

**Approach:** Backend NestJS — `EventsStore` in-memory + `POST/GET /events` + tracking middleware HTTP. `RelancesService` mock LLM (template paramétré) avec `POST /relances/draft`. `POST /decisions` log + émet event. Frontend — `lib/track.ts` wrapper unique, `RelanceModal` shadcn Dialog déclenchée depuis CompletenessSection, `DecisionPanel` POST réel avec états success/error, instrumentation des routes + section expand.

## Boundaries & Constraints

**Always:**
- 7 types d'events fonctionnels + 1 technique (`http.request` middleware) → ≥ cible PRD (≥5).
- `track()` fire-and-forget : ne throw jamais, ne bloque jamais l'UX.
- `RelancesService` reste pur (pas d'I/O autre que la lecture dossier via repo) — branchement LLM réel à activer plus tard en commentaire.
- Modale relance utilise le composant shadcn `Dialog` (réinstallé), pas de custom.

**Never:**
- Pas d'envoi SMTP réel.
- Pas de persistance events (in-memory, perdu au redémarrage — assumé pour le POC).
- Pas d'auth ni RBAC.

## Code Map

**Backend:**
- `backend/src/events/{events.types,events.store,events.controller,tracking.middleware,events.module}.ts` — store + endpoints + middleware
- `backend/src/relances/{relances.service,relances.controller,relances.module}.ts` — mock LLM
- `backend/src/decisions/{decisions.controller,decisions.module}.ts` — POST décision
- `backend/src/app.module.ts` — wire-up + middleware tracking sur toutes les routes

**Frontend:**
- `frontend/src/lib/track.ts` — wrapper unique
- `frontend/src/lib/api.ts` — `draftRelance()`, `recordDecision()`
- `frontend/src/components/cockpit/RelanceModal.tsx` — Dialog + draft éditable
- `frontend/src/components/cockpit/CompletenessSection.tsx` — branche le bouton "Demander des pièces"
- `frontend/src/components/cockpit/DecisionPanel.tsx` — POST réel + états + tracking
- `frontend/src/components/cockpit/CollapsibleSection.tsx` — émet `cockpit.section.expanded` via `onOpenChange`
- `frontend/src/routes/{index,dossiers.$id}.tsx` — instrumentation `dossier.list.viewed` / `dossier.opened`
- `frontend/src/components/ui/{dialog,label}.tsx` — shadcn ré-ajoutés

## Tasks & Acceptance

**Acceptance Criteria:**
- Given backend en route, when `POST /api/relances/draft {dossierId:fr-002}`, then 201 + `{subject, body, missingDocs[]}` avec body contenant les 2 missing items.
- Given un dossier, when je clique "Demander des pièces" → modale s'ouvre, brouillon généré, "Envoyer" → fermeture + alerte succès.
- Given je clique "Approuver" sur le DecisionPanel, when le POST `/decisions` résout, then bandeau de confirmation lime affiche horodatage.
- Given navigation liste → cockpit → expand sections → relance → décision, when `GET /api/events`, then ≥ 7 types distincts retournés en JSON, exportable.
- Given typecheck + build, when commandes terminent, then exit 0.

## Verification

**Commands:**
- `cd backend && npx jest --silent` — expected 33/33 (inchangés, tests existants).
- `npx tsc -b` (frontend) — exit 0.
- `npm run build` (racine) — backend + frontend build OK.
- `curl /api/events | jq 'unique_by(.type) | length'` — expected ≥ 5 (mesuré 8).

## Spec Change Log

### 2026-05-27 — review React (3 agents Vercel) + Web Interface Guidelines

Triggered par 3 reviewers délégués en parallèle :
1. **vercel-react-best-practices** — perf, hooks, TanStack patterns.
2. **vercel-composition-patterns** — prop drilling, compound components.
3. **Vercel Web Interface Guidelines** — a11y, typography, animation, forms.

**Tout appliqué en 5 phases :**

**Phase 1 — Quick wins UI/a11y** : `console.log` gated `import.meta.env.DEV` (track, openDoc, DecisionPanel, RelanceModal) ; `track()` utilise `navigator.sendBeacon` quand dispo + `keepalive: true` fallback ; `<meta name="theme-color">` `#1B5FFF` ; `<meta name="description">` ajouté ; `color-scheme: light` sur `:root` ; `@media (prefers-reduced-motion: reduce)` global ; `text-wrap: balance` sur h1/h2/h3 ; `tabular-nums` sur tous les chiffres (KPIs, currency, score, %) ; `NBSP` helper dans `lib/format` + `formatMonths`/`formatDays` ; `motion-reduce:transition-none` sur chevrons + cards ; `transition-all` → `transition-[colors,box-shadow,transform]` sur Card hover ; `RelanceModal` rendu conditionnel (`{relanceOpen && …}`) ; `role="status"` sur empty state RedFlags ; `aria-busy` + `aria-live` sur Skeleton loaders + Alerts ; apostrophes droites → courbes (`l’identifiant`, `l’enregistrement`) ; form attrs `name`/`autoComplete`/`spellCheck`/`maxLength` sur textarea + inputs ; `alert()` retirée de openDoc (log seul).

**Phase 2 — MetricTile extraction** : nouveau `components/cockpit/MetricTile.tsx` partagé ; `FinancialIndicators` et `BankFlowsCard` consomment au lieu de définir leur propre `KV`.

**Phase 3 — CockpitProvider + context** : nouveau `components/cockpit/CockpitContext.tsx` (`CockpitProvider`, `useDossierId`, `useOptionalDossierId`) ; `dossierId` lifted à la route, lu via context dans `CompletenessSection`, `DecisionPanel`, `CollapsibleSection` (pour tracking). Drop du `dossierId` prop des signatures `ScoreCard`, `FinancialIndicators`, `BankFlowsCard`, `DecisionPanel`.

**Phase 4 — Router loaders + boundaries** : `createRootRouteWithContext<RouterContext>()` ; `createAppRouter({ queryClient })` exporté ; chaque route a un `loader` qui appelle `queryClient.ensureQueryData(queryOptions)` — prefetch automatique, plus de loading flash en navigation ; `defaultPreload: 'intent'` ; `defaultErrorComponent` + `defaultNotFoundComponent` centralisés via `components/RouteErrorBoundary.tsx`.

**Phase 5 — AlertDialog confirm destructive** : `npx shadcn add alert-dialog` ; bouton "Refuser" wrappé dans `AlertDialog` avec confirmation explicite (titre, description, Cancel/Refuser le dossier).

**Vérifs sortie :** 33/33 tests jest ✅ · `tsc -b` exit 0 ✅ · `npm run build` exit 0 (gzip 116 KB, +2 KB pour AlertDialog) ✅.

### 2026-05-27 — code review pass 3 : 11 patches appliqués

Triggered by 3-reviewer audit (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Auditor verdict **PASS** ; patches issus de Blind + Edge.

**Backend :**
- `EventsStore` capé à 5000 events (FIFO splice) — évite OOM long-running.
- `tracking.middleware` matcher robuste : `req.originalUrl.endsWith('/events')` au lieu de `req.path` strict — pas de feedback loop quel que soit le prefix.
- `events.controller.ingest` valide `type` (string non vide, ≤100 chars), parse `ts` (Number.isFinite), tronque `payload` à 32 clés. `BadRequestException` 400 si invalide.
- `decisions.controller.record` valide `decision` (whitelist) et `dossierId` (string non vide), tronque `justification` à 500 chars.
- `relances.service.draft` : guard `owner` undefined (pas de "Bonjour ," pendant), guards NaN/négatif sur `amount`/`durationInMonth`.

**Frontend :**
- `RelanceModal` : `AbortController` sur le fetch draft (annule en background sur close), `setTimeout` envoyé dans ref + cleanup, reset state on close (subject/body/error/sent), inputs disabled pendant `sent`, double-send protection (`if (sent) return`).
- `DecisionPanel` : `track('decision.made')` retiré côté front — backend est source de vérité (évite double comptage). Status machine étendue avec `phase: 'error'` qui conserve la `decision` choisie pour permettre un bouton "Réessayer".
- `routes/index.tsx` : `dossier.list.viewed` fire-once via `useRef` (n'inflate plus le compteur sur refetch).
- `lib/track.ts` : `EventType` aligné avec backend (ajout `http.request` pour la cohérence taxonomie, commenté comme server-side only).
- `lib/api.ts` : `draftRelance(id, { signal })` supporte `AbortSignal`.

**Deferred** → `deferred-work.md` (bloc 3) :
- XSS / template injection mock email (à durcir au branchement LLM réel).
- CORS/CSRF posture (out-of-scope POC).
- `EventType | string` union discriminée (cosmétique).
- `res.on('close')` pour capture des requests abortées par client.
- Idempotency `/decisions` (POC no replay protection).
- Batching `track()` (POC low throughput).
- `EventsStore.all()` deep copy défensive.
- `relance.sent` succès affiché même si pas de SMTP (PRD assume mock).

**Rejected** : "DecisionPanel dossierId mismatch" (route `id` = `financing_request.id` par construction du contrat backend ; vérifié par auditor).

## Suggested Review Order

**Backend (instrumentation + validation)**

- Entrée — store capé + push centralisé.
  [`events.store.ts:5`](../../backend/src/events/events.store.ts#L5)

- Tracking middleware — filtre `/events` pour éviter le feedback loop.
  [`tracking.middleware.ts:9`](../../backend/src/events/tracking.middleware.ts#L9)

- Ingest validé (type, ts, payload size).
  [`events.controller.ts:21`](../../backend/src/events/events.controller.ts#L21)

- Décision validée + log + push event (source de vérité).
  [`decisions.controller.ts:29`](../../backend/src/decisions/decisions.controller.ts#L29)

- Mock LLM email — guards owner/amount/duration.
  [`relances.service.ts:14`](../../backend/src/relances/relances.service.ts#L14)

**Frontend (UX flow)**

- RelanceModal — AbortController + cleanup + reset state.
  [`RelanceModal.tsx:34`](../../frontend/src/components/cockpit/RelanceModal.tsx#L34)

- DecisionPanel — state machine avec retry après erreur, pas de double-track.
  [`DecisionPanel.tsx:28`](../../frontend/src/components/cockpit/DecisionPanel.tsx#L28)

- Track wrapper fire-and-forget, taxonomie alignée backend.
  [`track.ts:6`](../../frontend/src/lib/track.ts#L6)

- Liste : `dossier.list.viewed` fire-once via ref.
  [`routes/index.tsx:42`](../../frontend/src/routes/index.tsx#L42)

- Section expand — émis via Radix `onOpenChange`.
  [`CollapsibleSection.tsx:24`](../../frontend/src/components/cockpit/CollapsibleSection.tsx#L24)
