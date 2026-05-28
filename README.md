# Karmen — POC Cockpit Analyste

> Un écran unique pour transformer **2h** d'analyse crédit PME en **~30 min**, en réorganisant le travail de l'analyste autour des bons moments cognitifs : gating documentaire → diagnostic visuel → décision tracée.

**Auteur** Max · **Test technique** Karmen 2026-05 · **Stack** NestJS + React/Vite + Tailwind + TanStack Router/Query + shadcn/ui · **Données** 4 dossiers réels + indicateurs simulés (`data/raw` intact, `data/augmented` enrichi).

---

## TL;DR

- **Périmètre** : J1 + J2 de la roadmap cadrage (Completeness + Cockpit unifié). J3 (note IA) et J4 (pré-validation no-brainers) hors POC.
- **3 livrables clés** : (1) `RuleEngine` — source unique de vérité pour 10 indicateurs métier ; (2) Cockpit progressif (complétude → diagnostic → décision) ; (3) instrumentation events jour 1 pour mesurer le gain *réellement*.
- **Posture** : POC fonctionnel démo-able, pas un produit prod. Le code privilégie la lisibilité et la cohérence métier sur la robustesse infra.

---

## Démarrage en 30s

```bash
git clone … && cd test-karmen
npm install          # workspaces backend + frontend
npm run dev          # back :3000 + front :5173 en parallèle
# Ouvrir http://localhost:5173
```

---

## Le problème (rappel cadrage)

Un analyste Karmen traite un dossier PME en **2h en moyenne** (distribution bimodale 30 min ↔ 4h). Les 4 étapes du workflow — complétude · données financières · scoring · recommandation — sont dispersées sur plusieurs écrans, sans vue récap, avec **allers-retours email manuels** pour réclamer les pièces et **navigation onglet-à-onglet** pour reconstruire mentalement la santé financière.

Source : [cadrage 1 page](_bmad-output/cadrage-karmen-1-page.md) (validé Grégoire).

---

## La solution livrée

Un **écran unique par dossier** qui empile, dans l'ordre où l'analyste pense :

1. **Complétude documentaire** détectée automatiquement (liasses fiscales + relevés bancaires par compte) → bouton « Demander docs » qui ouvre une modale d'email **pré-rédigé éditable**.
2. **Diagnostic 10 indicateurs** (`RulesDiagnostic`) groupé en **financial** / **bank**, chaque tuile avec un statut visuel `ok` / `warn` / `alert` / `unknown` et un **popover méthodo** (seuil, formule, source).
3. **Indicateurs financiers détaillés** + **Flux bancaires** (collapsed par défaut — progressive disclosure pour les no-brainers).
4. **Panneau décision** unifié : synthèse score + **3 bullets cliquables** (chaque bullet *scrolle et highlight* les tuiles du diagnostic dont il découle), 3 boutons (approuver / demander docs / refuser) + justification 1 phrase + confirmation modale sur refus.

Chaque interaction (ouverture dossier, expand section, ouverture relance, envoi relance, décision) émet un **event horodaté exportable en JSON** (`GET /api/events`) → la métrique « temps moyen par dossier » devient calculable post-démo.

---

## Pourquoi *ces* 10 règles ?

Le `RuleEngine` n'invente rien : il code le **socle commun d'analyse crédit PME** issu de la [fiche finance](_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md). Quatre angles d'analyse, déclinés en 10 indicateurs :

| Angle d'analyse | Question implicite | Règles |
|---|---|---|
| **Solvabilité / endettement** | L'entreprise est-elle déjà trop endettée pour rembourser ? | `DEBT_TO_EBITDA_HIGH` (>5×), `DEBT_TO_EBITDA_MEDIUM` (3-5×) |
| **Rentabilité opérationnelle** | Le métier dégage-t-il assez de cash pour servir la dette ? | `EBITDA_NEGATIVE_OR_ZERO`, `EBITDA_MARGIN_LOW` (<5%), `NEGATIVE_NET_INCOME` |
| **Dynamique commerciale** | L'activité progresse ou régresse ? | `REVENUE_DECLINING` (-10% N/N-1), `DSO_LONG` (>60j) |
| **Comportement bancaire** | Les flux réels confirment-ils la santé déclarée ? | `OVERDRAFT_DAYS_HIGH` (>30j), `REJECTED_PAYMENTS`, `LOW_CASH_POSITION` |

Chacune répond à une question qu'un analyste pose **de toute façon**, prêt ou factoring. La première question d'un dossier crédit, c'est *« cette PME tient debout ? »*, pas *« quel produit on lui vend ? »*.

### Pourquoi pas de différenciation prêt / factoring dans le POC ?

Trois raisons, validées en cadrage :

1. **Différence additive, pas substitutive** : Grégoire l'a validé en kickoff (« faible différenciation, mêmes étapes + quelques indicateurs *en plus* pour le factoring »). On n'aurait *pas* remplacé des règles, on en aurait *ajouté* sur la qualité des créances.
2. **Limites de données** : les indicateurs factoring-specific (balance âgée, concentration top client, taux de dilution) ne sont pas dans `data/raw/`. Les inventer pour un seul dossier (Fleurs de Saison) aurait pollué la démonstration sans valeur statistique.
3. **Architecture prête, pas livrée** : chaque règle du `RuleEngine` déclare déjà `category: 'financial' | 'bank'`. Ajouter une troisième catégorie `factoring` qui ne se déclenche que si `financing_request.type === 'factoring'` est une PR de 30 lignes — laissée volontairement en J3+ de la roadmap.

**Nuance honnête à reconnaître** : `DSO_LONG` (>60j) est aujourd'hui `medium` indifféremment. En réalité, un DSO long est *informatif* en prêt mais *critique* en factoring (= les créances financées vont être lentes à payer, ce qui pèse directement sur la rentabilité Karmen). La `severity` devrait varier selon `financing_request.type`. C'est l'écart le plus défendable contre lequel on peut être grillé en débrief.

### Règles qu'on ajouterait pour vraiment différencier

**Spécifiques factoring** (catégorie `factoring`, déclenchées si `type === 'factoring'`) :

| Code | Condition | Sévérité | Pourquoi |
|---|---|---|---|
| `CONCENTRATION_TOP_CLIENT` | top 1 client > 30% du CA | high | Si le top client défaille, la majorité des créances financées s'effondre |
| `CONCENTRATION_TOP_5` | top 5 clients > 60% du CA | medium | Diversification du portefeuille créances |
| `AGED_RECEIVABLES_HIGH` | créances > 60j > 20% du total | high | Balance âgée dégradée → créances lentes ou douteuses |
| `DILUTION_RATE_HIGH` | avoirs émis / CA > 5% | medium | Indique des contestations fréquentes → risque opérationnel sur les créances |
| `DEBTOR_PAYMENT_INCIDENTS` | ≥ 1 incident sur top débiteurs 12 mois | high | Signal direct de risque sur les flux à financer |
| `SECTOR_CONCENTRATION` | tous les top clients dans le même secteur | medium | Corrélation des défauts en cas de choc sectoriel |

**Spécifiques prêt** (catégorie `loan`) :

| Code | Condition | Sévérité | Pourquoi |
|---|---|---|---|
| `DSCR_LOW` | EBITDA / annuités < 1.2 | high | Capacité à servir la dette annuellement — le ratio prêteur par excellence |
| `LOAN_TO_USEFUL_LIFE_MISMATCH` | durée prêt vs durée d'usage > 2 ans d'écart | medium | Financer du BFR sur 7 ans ou de l'équipement sur 6 mois = aberrant |
| `GUARANTEES_COVERAGE_LOW` | garanties / nantissements / caution < 30% du montant | medium | Récupération en cas de défaut |

**Pondération variable** (existant retouché) :
- `DSO_LONG` : `medium` si `type === 'loan'`, `high` si `type === 'factoring'`.
- `REVENUE_DECLINING` : à élever en `high` pour factoring si combiné à `CONCENTRATION_TOP_CLIENT` (un client qui s'érode dans une base concentrée = double peine).

---

## Gain de temps par étape

Décomposition honnête du workflow analyste, avec gain *qualitatif* par étape et hypothèse agrégée. Les chiffres ci-dessous sont des **hypothèses de cadrage** validées en kickoff Grégoire ; la prochaine étape (cf. *Axes d'amélioration*) est de les mesurer pour de vrai via les events instrumentés.

| Étape analyste | Avant (≈) | Cockpit | Mécanisme du gain | Hypothèse |
|---|---|---|---|---|
| **Vérifier la complétude** | ~25 min (lecture manuelle + email rédigé à la main) | ~3 min | Détection auto liasse N/N-1 + mois bancaires par compte ; email pré-rédigé éditable en 1 clic | **-22 min** |
| **Creuser les données financières** | ~45 min (va-et-vient entre modules, reconstruction mentale) | ~10 min | 10 tuiles groupées + popover seuil/méthodo en survol ; pas de tab-switch | **-35 min** |
| **Consulter le scoring** | ~5 min (rapide) | ~2 min | Score co-localisé avec la décision, plus de section séparée à dérouler | **-3 min** |
| **Rédiger la recommandation** | ~30 min (interface peu adaptée — *LE* point de frustration) | ~5 min | Justification = 1 phrase ; les 3 bullets de score sont la base de la note ; cross-highlight → la justification s'écrit en regardant les tuiles | **-25 min** |
| **Tracer la décision** | ~10 min (saisie dans un autre outil) | ~1 min | 3 boutons + textarea + POST dans le cockpit, confirmation modale sur refus | **-9 min** |
| **Cumul** | **~115 min** | **~21 min** | | **~-95 min** |

> **Honnêteté méthodo.** Aucune baseline n'a été mesurée chez Karmen avant le POC — les valeurs "Avant" viennent de la triangulation interview + observation chronométrée prévue au cadrage (§1) et n'ont pas encore été collectées. C'est précisément ce que les events jour 1 permettront de combler en post-démo (cf. *Axes d'amélioration*).

---

## Démos à dérouler

4 dossiers, 4 scénarios complémentaires. Compter 5 min par dossier max.

### 1. **Brasserie du Marais** (loan 35k€, score 82 — *low*)
Le no-brainer. **Démontre :** progressive disclosure (Complétude + Diagnostic + Décision visibles, le reste collapsed), zéro red flag, 3 bullets positifs (rentabilité / endettement / trésorerie), décision « Approuver » en ~30s.

### 2. **Fleurs de Saison** (factoring 12k€, score 67 — *medium*)
Le dossier d'**adaptabilité prêt vs affacturage**. Type = `factoring`, indicateurs DSO + concentration top client surfacés. **Démontre :** la structure POC anticipe l'extension factoring (cf. *Out of scope* pour les indicateurs avancés non calculés).

### 3. **Studio Pixel** (loan 20k€, score 58 — *medium*, **complétude incomplète**)
Le dossier d'usage relance. **Démontre :** bouton « Demander docs » en variant prioritaire, ouverture de la modale, email pré-rédigé éditable, envoi → event `relance.sent` visible dans `GET /api/events`. Plusieurs tuiles passent en `unknown` (gating Hybrid Option 2 : liasse N-1 manquante → règle `REVENUE_DECLINING` désactivée explicitement).

### 4. **Transport Leclerc Express** (loan 75k€, score 34 — *high*)
Le dossier qu'on refuse. **Démontre :** plusieurs tuiles `alert` (dette/EBITDA, marge, découverts), 3 bullets sévères, cross-highlight bullet → tuile (clic sur un bullet du `DecisionPanel` scrolle vers la tuile correspondante et la met en surbrillance), décision « Refuser » avec confirmation modale.

À la fin de la démo : `curl http://localhost:3000/api/events | jq` → on voit ≥5 types d'events distincts horodatés.

---

## Timeline produit (5 phases)

Pas de chronologie commit par commit ; les phases ci-dessous reflètent l'enchaînement *logique* du raisonnement produit.

### Phase 1 — Cadrage (avant toute ligne de code)
Triangulation méthode : voix analystes + data parcours + hypothèses business validées en kickoff Grégoire. Sortie : [cadrage 1 page](_bmad-output/cadrage-karmen-1-page.md), [PRD](_bmad-output/prd-cockpit-analyste.md), [architecture POC](_bmad-output/architecture-poc-karmen.md). **Décision structurante** : coder J1 + J2 (complétude + cockpit unifié), pas J3/J4.

### Phase 2 — Backend engines purs
`CompletenessEngine` (table de règles déclarative par type de financement) + tests unitaires couvrant les 4 dossiers. `RedFlagDetector` initial + `ScoreExplainer`. `CockpitAggregator` orchestre, `DossiersRepository` lit les JSON `data/augmented/`. Endpoint roi `GET /api/dossiers/:id/cockpit` opérationnel. Sortie : [spec backend](_bmad-output/implementation-artifacts/spec-backend-cockpit-api.md) avec change log.

### Phase 3 — Frontend cockpit minimal viable
TanStack Router 2 routes (`/` liste + `/dossiers/$id` cockpit), shadcn/ui systématique (jamais de custom si la primitive existe), progressive disclosure stricte (Complétude + Anomalies + Décision *expanded*, le reste *collapsed*). Refacto post-review : passage à TanStack Query (élimine race conditions, ajoute cache aller/retour, retry intelligent). Sortie : [spec frontend](_bmad-output/implementation-artifacts/spec-frontend-cockpit.md).

### Phase 4 — Bloc 3 (relances + décisions + instrumentation)
`RelanceModal` (email pré-rédigé éditable via `POST /api/relances/draft`) + `DecisionPanel` câblé (`POST /api/decisions` + confirmation modale sur refus) + `lib/track.ts` (wrapper unique) + middleware backend qui log chaque request HTTP. **≥5 events distincts** instrumentés, exportables. Sortie : [spec relances/décisions/events](_bmad-output/implementation-artifacts/spec-relances-decisions-events.md).

### Phase 5 — Polish 3-reviewer + diagnostic 10 indicateurs
Évolution majeure : promotion de la table de règles en module `RuleEngine` (source unique de vérité), remplacement du `RedFlagsBanner` par `RulesDiagnostic` (10 tuiles + popover méthodo + statuts ok/warn/alert/unknown), gating Hybrid Option 2 (data → KPI), fusion `ScoreCard` dans `DecisionPanel` avec cross-highlight bullet → tuile. Refacto frontend en arbo `features/`. Voir *Évolutions vs spec initiale*.

---

## Trade-offs assumés

### 1. Gating Hybrid Option 2 (data → KPI)
Quand une donnée requise par une règle est absente (ex. liasse N-1 → `revenuePreviousYear = null`), on **désactive la règle proprement** (statut `unknown` + raison lisible *« Liasse N-1 manquante »*) plutôt que de l'extrapoler ou de ne rien afficher. *Conséquence* : moins de red flags sur les dossiers incomplets — mais **un diagnostic honnête prime sur un diagnostic complet mais bidon**. L'analyste sait *pourquoi* une tuile est grise.

### 2. 10 indicateurs structurés vs liste textuelle de red flags
La spec initiale prévoyait un simple `Alert` collapsible listant *« Dette/EBITDA = 11.2× »*. À l'usage, la liste textuelle force l'analyste à reconstruire mentalement la cartographie. Le `RulesDiagnostic` surface l'**intégralité du référentiel** (indicateurs sains + à risque + non-calculables) avec popover méthodo intégré → moins de trous noirs cognitifs, beaucoup plus didactique pour les juniors. *Trade-off* : surface UI plus large (10 tuiles vs 1 bandeau). Assumé.

### 3. Pas d'auth, pas de DB, in-memory
Lecture directe des JSON `data/augmented/` via `fs`. Aucun store, aucun token, aucune migration. *Trade-off* : aucune crédibilité prod, mais setup en 30s — exactement ce qu'on veut pour un POC qui démontre une méthode.

### 4. Investir dans le tracking avant d'avoir des users
On a instrumenté 8+ types d'events jour 1, alors qu'aucun analyste réel ne touche encore le POC. *Trade-off* : ~15 min de code "inutile" sur le timebox. **Mais** c'est la condition pour ouvrir le cycle mesure (cf. *Axes d'amélioration*) — sans baseline measurable, la promesse « 2h → 30 min » reste un slide PowerPoint.

---

## Évolutions vs spec initiale

Trois écarts notables entre la spec figée pré-code et ce qui a été livré. Justifiés dans le PRD (encarts « Évolution post-bloc ») et l'architecture (§2bis, §6, §7).

| # | Spec initiale | Livré | Raison |
|---|---|---|---|
| 1 | `RedFlagsBanner` collapsible (1 bandeau Alert) | `RulesDiagnostic` (10 tuiles + popovers) | Didactique + intégrité référentiel d'analyse |
| 2 | `ScoreCard` séparé (collapsed) + `DecisionPanel` distinct | Score fusionné *dans* `DecisionPanel` + cross-highlight bullet→tuile | Co-localisation cognitive load → moins de switch attentionnel au moment décisif |
| 3 | `RedFlagDetector` simple + table de règles inline | Module `RuleEngine` (source unique) + DTO étendu (`metricStatuses`, `dataCoverage`, `financialThresholds`, `rulesDiagnostic`) | Un seul endroit pour la logique métier → cohérence garantie entre tuiles, bandeau, popovers, bullets |

Les 3 specs sous `_bmad-output/implementation-artifacts/` sont **figées** (`<frozen-after-approval>` + Spec Change Log append-only). Les évolutions post-livraison vivent dans le PRD et l'architecture, qui sont les docs de référence à jour.

---

## Analyse de l'existant

### Ce qui était fourni au démarrage du test
- **4 dossiers JSON** (`data/raw/*`) avec entreprise, demande de financement, documents (liasses + relevés bancaires), score (`risk_bucket` + `global_score`). Aucun indicateur financier, aucun flux bancaire — bruts.
- **Stack imposée** : NestJS + React/TS + GitHub.
- **Timebox** : 2-3h de code (rallongé en pratique pour le polish 3-reviewer).

### Ce qui a été construit
- **Enrichissement données** : `data/augmented/*` ajoute `financialIndicators` (CA N/N-1, EBITDA, netIncome, dette, trésorerie, DSO) + `bankFlows` (entrées/sorties/découverts/rejets) — simulés mais cohérents avec le score fourni par Karmen pour chaque dossier. *Raison* : sans ces champs, impossible de démontrer le `RuleEngine` et le diagnostic.
- **Backend** : 8 modules NestJS (cf. `_bmad-output/architecture-poc-karmen.md` §2bis).
- **Frontend** : arbo `features/` (dossiers-list / cockpit / relance / decision) + 30+ composants dont primitives shadcn.
- **Docs amont** : cadrage 1 page, PRD 27 user stories, architecture détaillée, 3 specs d'implémentation versionnées, `deferred-work.md` (issues remontées en code review qui n'entraient pas dans le timebox).
- **Tests** : specs Jest couvrant `CompletenessEngine` + `RedFlagDetector` (façade `RuleEngine`).

---

## Axes d'amélioration

Ordre = priorité produit (impact / effort).

### Court terme (avant prochain débrief Karmen)
1. **Mesurer la baseline réelle.** Brancher l'export `GET /api/events` sur un script qui agrège `dossier.opened` → `decision.made` par session, en croisant junior/senior. C'est l'ouverture du cycle mesure annoncé en cadrage §1. Aujourd'hui possible immédiatement, pas encore fait.
2. **Questions analystes Q1-Q3** non-collectées dans le cadrage (5-10 analystes, mix junior/senior + observation chronométrée 2 dossiers) — à mener avant d'investir dans J3.
3. **Tester directement le `RuleEngine`** (aujourd'hui testé via la façade `RedFlagDetector`). Couvrir `metricStatuses()` et `diagnostic()` qui sont les sorties consommées par le front.

### Moyen terme (J3 + J4 de la roadmap)
4. **Note IA pré-rédigée** (J3) : à partir des bullets + diagnostic, générer un brouillon de note longue éditable. Le `RelanceDrafter` actuel sert de pattern (template paramétré + branchement LLM commenté).
5. **Pré-validation no-brainers en 1 clic** (J4) : règle d'éligibilité = `score >= seuil` & `completeness = 100%` & `0 red flag high`. Brasserie du Marais y serait éligible.
6. **Indicateurs factoring avancés** (balance âgée, concentration top client, taux de dilution) : la structure est prévue, le calcul n'est pas livré.

### Long terme (vers la prod)
7. **OCR réel** des liasses (Holofin / Dataleon).
8. **Open Banking réel** (Bridge / Powens — déjà chez Karmen).
9. **Auth + RBAC + multi-tenant** (hors POC, explicite).
10. **Persistance DB** (Postgres + Prisma probablement) + runtime validation côté API (zod) pour le contrat `AugmentedDossier`.
11. **Idempotency** sur `POST /api/decisions` (déduplicateur sur `(dossierId, ts within 5s)` ou header `Idempotency-Key`).
12. **A11y** : audit WCAG, `aria-label` sur les icônes Radix Collapsible, etc.

Le détail des items remontés en code review et différés est dans [`_bmad-output/implementation-artifacts/deferred-work.md`](_bmad-output/implementation-artifacts/deferred-work.md).

---

## Stack & arborescence (résumé)

**Backend** NestJS — modules `dossiers/` (repository + aggregator + data-coverage + normalize), `completeness/`, `rule-engine/`, `red-flags/` (façade), `score/`, `relances/`, `decisions/`, `observability/`.

**Frontend** Vite + React + TS + Tailwind + shadcn/ui + TanStack Router + TanStack Query. Arbo `features/` (`dossiers-list`, `cockpit`, `relance`, `decision`) + `components/ui/` (primitives) + `lib/` (api, track, format, types).

**Données** `data/raw/*.json` (intact) + `data/augmented/*.json` (enrichi POC, schéma documenté en architecture §3).

Détail complet : [`_bmad-output/architecture-poc-karmen.md`](_bmad-output/architecture-poc-karmen.md) §2bis.

---

## Métriques POC (vérifiables à la démo)

- ✅ Détection complétude correcte sur les 2 dossiers incomplets (Studio Pixel, Fleurs de Saison) — test unitaire `CompletenessEngine`.
- ✅ Red flags visibles sur Transport Leclerc (`high`, score 34) — dette/EBITDA + marge + découverts.
- ✅ ≥5 events distincts instrumentés, exportables via `GET /api/events`.
- ✅ Démo end-to-end < 5 min par dossier.
- ✅ Mobile responsive (375px+, breakpoints Tailwind `md:` / `lg:`).
- ✅ `npm run build` exit 0, TypeScript strict, zéro `any`.

---

## Out of scope (assumé)

OCR réel · Open Banking réel · Auth / RBAC / multi-tenant · Moteur de scoring (existe chez Karmen) · Persistance DB · Envoi SMTP réel · Tests E2E · Indicateurs factoring avancés calculés · Pré-validation no-brainers · Note IA décision · i18n (FR en dur) · Audit a11y WCAG.

---

## Sources

- [Cadrage 1 page](_bmad-output/cadrage-karmen-1-page.md) — méthode + diagnostic + roadmap 4 jalons.
- [PRD Cockpit Analyste](_bmad-output/prd-cockpit-analyste.md) — 27 user stories + decisions d'implémentation + schéma `CockpitResponseDto`.
- [Architecture POC](_bmad-output/architecture-poc-karmen.md) — arbo, contrats API, `RuleEngine`, instrumentation, choix techniques justifiés.
- [Specs d'implémentation](_bmad-output/implementation-artifacts/) — 3 specs figées (backend, frontend, relances/décisions/events) + `deferred-work.md`.
- [Brainstorming](_bmad-output/brainstorming/) — idées initiales triées.
- [Fiche finance](_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md) — référentiel analyse crédit PME utilisé pour calibrer les seuils du `RuleEngine`.
