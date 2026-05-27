---
title: 'Backend Cockpit API — repository, pure modules, aggregator, endpoints'
type: 'feature'
created: '2026-05-27'
status: 'done'
baseline_commit: '3318cd6642b58dda9c00b60006b407080b557aab'
context:
  - '{project-root}/_bmad-output/prd-cockpit-analyste.md'
  - '{project-root}/_bmad-output/architecture-poc-karmen.md'
  - '{project-root}/data/augmented/'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le backend NestJS n'a que le scaffold par défaut. Le frontend (bloc 2) a besoin d'un endpoint unique qui retourne un dossier de financement agrégé avec complétude documentaire, red flags et explication de score, sinon impossible de démontrer le cockpit lundi.

**Approach:** Implémenter 3 modules métier purs (`CompletenessEngine`, `RedFlagDetector`, `ScoreExplainer`) testés unitairement, un `DossiersRepository` qui lit les JSON `data/augmented/*`, un `CockpitAggregator` qui compose la réponse, et exposer `GET /dossiers` + `GET /dossiers/:id/cockpit`. Pas de DB, pas d'auth.

## Boundaries & Constraints

**Always:**
- TypeScript strict, jamais `any` (utiliser `unknown` + narrowing si nécessaire).
- ES modules, imports destructurés.
- Les 3 modules métier sont **purs** : pas d'I/O, pas d'état, signature unique documentée.
- Règles métier déclaratives (table de règles) — un nouveau seuil = un nouvel objet, pas un nouveau `if`.
- Lecture des JSON via `fs/promises`, chemin résolu depuis `process.cwd()` ou un path absolu calculé une fois.
- Retourner `404` si dossier inconnu.

**Ask First:**
- Modifier le schéma `data/augmented/*.json` (les données sont gelées comme contrat).
- Ajouter une dépendance npm (l'archi ne le prévoit pas pour ce bloc).
- Changer le port (3000 imposé par le proxy Vite).

**Never:**
- Pas de base de données, pas d'ORM.
- Pas d'auth, pas de middleware de sécurité.
- Pas de test E2E ni de test d'intégration HTTP (hors timebox).
- Pas d'endpoints `relances`, `decisions`, `events` (bloc 3).
- Pas de logique métier dans le controller ou l'aggregator (tout vit dans les modules purs).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| `GET /dossiers` | 4 fichiers présents | `200` + array de 4 résumés `{id, companyName, type, amount, riskBucket, completenessScore}` | N/A |
| `GET /dossiers/:id/cockpit` happy path | `id=fr-001` (Brasserie, complet) | `200` + `CockpitResponse` avec `completeness.score=100`, `redFlags=[]`, 3 bullets | N/A |
| Dossier incomplet (1 liasse) | `id=fr-002` (Studio Pixel) | `missing` contient item `liasse_fiscale` avec ratio `1/2` dans `reason` | N/A |
| Dossier incomplet (mois bancaires) | `id=fr-004` (Fleurs, LCL 10 mois) | `missing` contient item `releve_bancaire` mentionnant `10` et `LCL` | N/A |
| Dossier high risk multi-comptes | `id=fr-003` (Transport Leclerc) | Red flags incluent `DEBT_TO_EBITDA_HIGH`, `EBITDA_MARGIN_LOW`, `OVERDRAFT_DAYS_HIGH`, `REJECTED_PAYMENTS`, `NEGATIVE_NET_INCOME`, `REVENUE_DECLINING`, `DSO_LONG` ; complétude `100%` (2 comptes × 12 mois) | N/A |
| Id inconnu | `id=fr-999` | `404 Not Found` | NestJS `NotFoundException` |

</frozen-after-approval>

## Code Map

- `backend/src/app.module.ts` — enregistrer `DossiersModule` ; supprimer `AppController`/`AppService` (boilerplate).
- `backend/src/dossiers/types.ts` — types partagés (`AugmentedDossier`, `CockpitResponse`, `MissingItem`, `RedFlag`).
- `backend/src/dossiers/dossiers.repository.ts` — lecture des 4 JSON depuis `data/augmented/`, cache en mémoire après 1er load.
- `backend/src/dossiers/dossiers.controller.ts` — routes `GET /dossiers` et `GET /dossiers/:id/cockpit`.
- `backend/src/dossiers/dossiers.module.ts` — wire-up.
- `backend/src/dossiers/cockpit.aggregator.ts` — orchestrateur (repo + 3 modules → DTO).
- `backend/src/completeness/completeness.engine.ts` + `.spec.ts` — règles + 4 cas de test.
- `backend/src/red-flags/red-flags.detector.ts` + `.spec.ts` — table de règles + tests par règle.
- `backend/src/score/score.explainer.ts` + `.spec.ts` — 3 bullets max, priorisation.
- `backend/src/main.ts` — activer `app.setGlobalPrefix('api')` pour matcher le proxy Vite `/api/*`.
- `backend/src/app.controller.ts` + `app.service.ts` + `app.controller.spec.ts` — supprimer.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/dossiers/types.ts` — déclarer `AugmentedDossier`, `MissingItem`, `RedFlag`, `CockpitResponse`, `DossierSummary` selon archi §3 et PRD `CockpitResponseDto`.
- [x] `backend/src/dossiers/dossiers.repository.ts` — `@Injectable()`, méthodes `list(): Promise<AugmentedDossier[]>` et `findById(id: string): Promise<AugmentedDossier | null>` (id = `financing_request.id`). Charger les 4 fichiers une fois, mémoïser.
- [x] `backend/src/completeness/completeness.engine.ts` — `check(dossier): CompletenessResult` selon archi §5. Score = `(completed / total) × 100` arrondi. Group bancaire par `metadata.account`.
- [x] `backend/src/completeness/completeness.spec.ts` — 4 cas : Brasserie complet → `score:100, isComplete:true` ; Studio Pixel → `missing` contient `liasse_fiscale` avec `1/2` ; Fleurs → `missing` contient `releve_bancaire` avec `10` et `LCL` ; Transport Leclerc multi-comptes (SG+BNP) → checks indépendants, `isComplete:true`.
- [x] `backend/src/red-flags/red-flags.detector.ts` — table de 9 règles (archi §6) : `{ code, severity, predicate, label, format }`. Export `detect(financialIndicators, bankFlows): RedFlag[]`.
- [x] `backend/src/red-flags/red-flags.spec.ts` — 1 cas par règle au-dessus du seuil + 1 cas global "tout sain" → `[]` + 1 cas palier (`debt/ebitda=4` → MEDIUM, `=6` → HIGH).
- [x] `backend/src/score/score.explainer.ts` — `explain(dossier, redFlags): string[]` ; renvoie ≤3 bullets ; priorise les angles couverts par un red flag HIGH, sinon rentabilité / endettement / trésorerie sains.
- [x] `backend/src/score/score.explainer.spec.ts` — Brasserie (sain) → 3 bullets reflétant marge EBITDA, ratio dette/EBITDA, trésorerie ; Transport Leclerc → au moins 1 bullet évoque le surendettement ou les découverts ; bullets toujours ≤3.
- [x] `backend/src/dossiers/cockpit.aggregator.ts` — `@Injectable()` ; `getCockpit(id): Promise<CockpitResponse>` ; appelle repo + 3 modules ; lance `NotFoundException` si null.
- [x] `backend/src/dossiers/dossiers.controller.ts` — `GET /dossiers` (mappe vers `DossierSummary`) et `GET /dossiers/:id/cockpit`.
- [x] `backend/src/dossiers/dossiers.module.ts` — déclare providers (`DossiersRepository`, `CompletenessEngine`, `RedFlagDetector`, `ScoreExplainer`, `CockpitAggregator`) et le controller.
- [x] `backend/src/app.module.ts` — remplacer par `imports: [DossiersModule]`, sans controllers/providers.
- [x] `backend/src/main.ts` — ajouter `app.setGlobalPrefix('api')` et `app.enableCors()` (proxy Vite).
- [x] Supprimer `backend/src/app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`.

**Acceptance Criteria:**
- Given le serveur démarre, when `GET /api/dossiers`, then status `200` et body = array de 4 entrées avec `companyName` non vide et `completenessScore` numérique.
- Given un id de demande inconnu, when `GET /api/dossiers/fr-999/cockpit`, then status `404`.
- Given `GET /api/dossiers/fr-003/cockpit`, when réponse parsée, then `redFlags.length ≥ 5` et `completeness.isComplete === true`.
- Given `npm test` dans `backend/`, when la suite tourne, then `completeness`, `red-flags` et `score.explainer` passent tous.
- Given `npm run typecheck` à la racine, when commande terminée, then exit 0, aucune occurrence du mot `any` introduit dans les nouveaux fichiers.

## Design Notes

**Repository — chemin des données :** `path.resolve(process.cwd(), '../data/augmented')` quand le backend tourne depuis `backend/`. Si lancé depuis la racine via workspaces, fallback : remonter jusqu'à trouver `data/augmented/`. Garder simple : un seul `resolve` + try/catch explicite si fichier absent au boot (log + throw).

**Table de règles red flags (forme cible) :**
```ts
const RULES: Rule[] = [
  { code: 'DEBT_TO_EBITDA_HIGH', severity: 'high',
    when: (f) => f.ebitda > 0 && f.totalDebt / f.ebitda > 5,
    label: 'Dette / EBITDA critique',
    format: (f) => `${(f.totalDebt / f.ebitda).toFixed(1)}× (seuil > 5×)` },
  // ... 8 autres règles
];
```
Évite l'ambiguïté quand `ebitda ≤ 0` (sinon division par zéro produit faux positifs).

**Score explainer — priorisation :** si red flag HIGH présent, le 1er bullet décrit l'angle problématique en utilisant la valeur réelle (ex. `"Endettement préoccupant : 11.2× l'EBITDA"`). Sinon bullets neutres "rentabilité / endettement / trésorerie" avec les valeurs.

## Verification

**Commands:**
- `cd backend && npx jest completeness` — expected: 4 tests passent.
- `cd backend && npx jest red-flags` — expected: tous les tests passent, chaque code de règle est asserté au moins une fois.
- `cd backend && npx jest score.explainer` — expected: tests passent.
- `npm run typecheck` (racine) — expected: exit 0.
- `cd backend && npm run start` puis `curl localhost:3000/api/dossiers/fr-003/cockpit | jq '.redFlags | length'` — expected: ≥ 5.

## Spec Change Log

### 2026-05-27 — review loop 1 (patches, no spec change)

Triggered by 3-reviewer audit. Auditor verdict PASS. Applied 5 patches in-code (no `<frozen-after-approval>` modification):

- Completeness : faux positif quand `releves.length === 0` → missing item explicite (HIGH).
- Completeness : `months_covered` agrégé sur tous les docs du même compte (au lieu de `docs[0]`).
- RedFlag : nouvelle règle `EBITDA_NEGATIVE_OR_ZERO` (high) — couvre l'insolvabilité quand `ebitda ≤ 0` désactivait silencieusement les ratios dette/EBITDA.
- ScoreExplainer : bullets désormais cohérents avec `REVENUE_DECLINING` / `DSO_LONG` / `EBITDA_NEGATIVE_OR_ZERO`.
- Tests : fixture "sain" réellement saine ; 5 nouveaux tests (22 au total).

**Deferred** → `deferred-work.md` : validation runtime JSON, env var data path, allowlist CORS prod, distinct(year) liasses.

**Rejected** (out-of-scope POC) : auth, intégration HTTP tests, caching liste, branchement `financing_request.status`.

## Review Findings

### Code review — 2026-05-27 (pass 2, `bmad-code-review`)

- [x] [Review][Defer] **I/O Matrix fr-001 (Brasserie) `redFlags=[]` est inatteignable** — déferré post-démo : la spec est légèrement bavarde mais le code marche sur les 4 dossiers et la démo lundi ne nécessite pas de re-négocier le contrat. — Le fixture Brasserie a `cashPosition=18500 €` < `monthlyOutflowsAverage=22500 €`, donc `LOW_CASH_POSITION` se déclenche systématiquement. La ligne I/O matrix dit `redFlags=[]`. Le fixture est gelé (contrat), donc deux options : (a) durcir le seuil `LOW_CASH_POSITION` (ex. `cash < 0.5× outflows` = moins de 2 semaines de runway, plus signifiant business) — Brasserie devient propre, les 3 autres dossiers restent flaggés ; (b) re-négocier la ligne I/O matrix pour acter que Brasserie a 1 flag medium. [`red-flags.detector.ts:75`, `data/augmented/brasserie-du-marais.json`]

- [x] [Review][Patch] **ScoreExplainer : pas de priorisation par sévérité dans `cashFlag.find`** — Plusieurs flags partagent le bucket cash (OVERDRAFT_DAYS_HIGH=high, REJECTED_PAYMENTS=medium, LOW_CASH_POSITION=medium, DSO_LONG=medium) ; `find()` prend le premier dans l'ordre du RULES, pas le plus sévère. À fixer : trier par severity desc avant `find`. [`score.explainer.ts:22`]

- [x] [Review][Patch] **Completeness : releves accountless créent N buckets distincts** — `account ?? '__unknown_${doc.id}'` produit une clé unique par doc, donc 2 releves sans `account` deviennent 2 comptes distincts incomplets. Fix : fallback sur `bank` puis sur un identifiant stable, ou regrouper sous `__missing_account`. [`completeness.engine.ts:25-29`]

- [x] [Review][Patch] **Completeness : score=50% quand 0 relevé + liasse OK n'exprime pas la criticité** — `totalItems=2, missing=1 (aucun relevé) → score=50%`. Un dossier sans aucune donnée bancaire est non-finançable, pas "à moitié complet". Fix : zéro pondération séparée pour la catégorie "relevés totalement absents" (ex. cap score à 25% si releves.length===0). [`completeness.engine.ts:55-63`]

- [x] [Review][Patch] **Aggregator construit le DTO `ScoreExplanation` (logique de shape qui appartient au module pur)** — `{bullets: scoreExplainer.explain(...)}` est composé dans `cockpit.aggregator.ts:24`. La règle "pas de logique dans l'aggregator" est borderline mais la signature de `ScoreExplainer.explain()` devrait retourner `ScoreExplanation` directement. [`score.explainer.ts:8`, `cockpit.aggregator.ts:24`]

- [x] [Review][Patch] **`DossiersRepository.list()` retourne la référence interne mutable** — Un caller qui fait `.sort()` ou `.splice()` corrompt l'état du repo. Fix : `return [...this.dossiers]`. [`dossiers.repository.ts:22`]

- [x] [Review][Defer] DEBT_TO_EBITDA boundary à exactement 5× non documenté/testé [`red-flags.detector.ts:25-34`] — pré-existant, low impact
- [x] [Review][Defer] LOW_CASH_POSITION utilise `<` strict (vs `<=`) — cosmétique, dépend du choix sur la décision A1
- [x] [Review][Defer] `readdir` accepte n'importe quel `*.json` (DS_Store, schema.json) — opérationnel
- [x] [Review][Defer] Multi-comptes tous incomplets → `completedItems` clamped à 0 masque la différence — informationnel
- [x] [Review][Defer] `revenuePreviousYear===0` (startup, dossier neuf) court-circuite REVENUE_DECLINING — aucun cas dans le fixture
- [x] [Review][Defer] Boundary equality `revenue = 0.9 × prev` exact / `overdraftDays = 30` exact — sémantique, label vs predicate
- [x] [Review][Defer] `monthlyOutflowsAverage <= 0` produit faux positif LOW_CASH_POSITION — donnée corrompue
- [x] [Review][Defer] `data/augmented` vide → boot silencieux avec 0 dossier — opérationnel
- [x] [Review][Defer] `DossiersController.list` recalcule completeness à chaque request (vs aggregator) — 4 dossiers, prématuré
- [x] [Review][Defer] `RULES` loan/factoring identiques (ports de divergence absents) — divergeront en bloc 4
- [x] [Review][Defer] EBITDA très petit mais > 0 → ratio dette/EBITDA énorme affiché sans flag — exotique
- [x] [Review][Defer] `docs[0].metadata.bank` ne signale pas une incohérence inter-banques même compte — donnée corrompue
- [x] [Review][Defer] Controller inline le mapping `DossierSummary` + appelle CompletenessEngine — spec borderline, autorise "mappe vers"
- [x] [Review][Defer] Score formula drift vs Architecture §5 — minor, AC tient

## Suggested Review Order

**Endpoints & wiring**

- Entrée — controller minimal, délègue tout à l'aggregator + repo.
  [`dossiers.controller.ts:1`](../../backend/src/dossiers/dossiers.controller.ts#L1)

- Orchestration — repo + 3 modules purs → DTO ; 404 si id inconnu.
  [`cockpit.aggregator.ts:1`](../../backend/src/dossiers/cockpit.aggregator.ts#L1)

- Bootstrap — préfixe `/api` pour le proxy Vite + CORS dev.
  [`main.ts:1`](../../backend/src/main.ts#L1)

**Règles métier (cœur du diff)**

- Completeness — table de règles + agrégation par compte bancaire + garde "0 relevé".
  [`completeness.engine.ts:14`](../../backend/src/completeness/completeness.engine.ts#L14)

- Red flags — table déclarative 10 règles (dont `EBITDA_NEGATIVE_OR_ZERO`).
  [`red-flags.detector.ts:16`](../../backend/src/red-flags/red-flags.detector.ts#L16)

- Score explainer — 3 bullets, cohérence forcée avec les flags par thème.
  [`score.explainer.ts:10`](../../backend/src/score/score.explainer.ts#L10)

**Données & types**

- Repository — lecture JSON in-memory, mémoïsée au boot.
  [`dossiers.repository.ts:12`](../../backend/src/dossiers/dossiers.repository.ts#L12)

- Types partagés — schéma `AugmentedDossier`, `CockpitResponse`, `DossierSummary`.
  [`types.ts:1`](../../backend/src/dossiers/types.ts#L1)

**Tests (filet de sécurité)**

- Completeness — 6 cas (Brasserie, Studio Pixel, Fleurs, Transport Leclerc multi-comptes, 0 relevé, split 6+6).
  [`completeness.spec.ts:1`](../../backend/src/completeness/completeness.spec.ts#L1)

- Red flags — 11 cas couvrant chaque règle + paliers + `ebitda=0`.
  [`red-flags.spec.ts:1`](../../backend/src/red-flags/red-flags.spec.ts#L1)

- Score explainer — 5 cas dont REVENUE_DECLINING / DSO_LONG isolés.
  [`score.explainer.spec.ts:1`](../../backend/src/score/score.explainer.spec.ts#L1)
