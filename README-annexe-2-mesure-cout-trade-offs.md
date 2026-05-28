# Annexe 2 — Mesure, coût IA J3, trade-offs

> Complément au [README](README.md) — étapes 5 (Mesure) et 6 (Trade-offs & roadmap). Lecture isolée possible.

---

## 1. Gain de temps par étape (détail)

Décomposition honnête du workflow analyste, avec gain *qualitatif* par étape et hypothèse agrégée. Les chiffres ci-dessous sont des **hypothèses de cadrage** validées en kickoff Grégoire ; la prochaine étape (cf. §4) est de les mesurer pour de vrai via les events instrumentés.

| Étape analyste | Avant (≈) | Cockpit | Mécanisme du gain | Hypothèse |
|---|---|---|---|---|
| **Vérifier la complétude** | ~25 min (lecture manuelle + email rédigé à la main) | ~3 min | Détection auto liasse N/N-1 + mois bancaires par compte ; email pré-rédigé éditable en 1 clic | **-22 min** |
| **Creuser les données financières** | ~45 min (va-et-vient entre modules, reconstruction mentale) | ~10 min | 10 tuiles groupées + popover seuil/méthodo en survol ; pas de tab-switch | **-35 min** |
| **Consulter le scoring** | ~5 min (rapide) | ~2 min | Score co-localisé avec la décision, plus de section séparée à dérouler | **-3 min** |
| **Rédiger la recommandation** | ~30 min (interface peu adaptée — *LE* point de frustration) | ~5 min | Justification = 1 phrase ; les 3 bullets de score sont la base de la note ; cross-highlight → la justification s'écrit en regardant les tuiles | **-25 min** |
| **Tracer la décision** | ~10 min (saisie dans un autre outil) | ~1 min | 3 boutons + textarea + POST dans le cockpit, confirmation modale sur refus | **-9 min** |
| **Cumul** | **~115 min** | **~21 min** | | **~-95 min** |

> **Honnêteté méthodo.** Aucune baseline n'a été mesurée chez Karmen avant le POC — les valeurs "Avant" viennent de la triangulation interview + observation chronométrée prévue au cadrage (§1) et n'ont pas encore été collectées. C'est précisément ce que les events jour 1 permettront de combler en post-démo (§4 ci-dessous).

---

## 2. Coût IA — projection pour J3 (Note pré-rédigée)

Le jalon **J3** du cadrage promet une note de recommandation pré-rédigée par IA, éditable par l'analyste (le `RelanceDrafter` actuel sert déjà de pattern : template + branchement LLM commenté). Voici une estimation chiffrée du coût d'API pour orienter le choix de modèle.

### Hypothèses (par dossier)

| Composant | Tokens | Notes |
|---|---|---|
| System prompt (persona analyste FR + format note + glossaire 10 règles) | ~1 200 input | **Statique → cacheable** |
| Dossier sérialisé (`AugmentedDossier` + diagnostic + bullets + scoreExplanation) | ~1 800 input | Dynamique |
| Note générée (recommandation 1 page, ~300-500 mots FR, éditable) | ~800 output | |

### Coût par dossier (snapshot fin 2025 / début 2026 — à valider avant prod, prix volatils)

| Modèle | $/1M input | $/1M output | Coût/dossier |
|---|---|---|---|
| Claude Opus 4.x | 15 | 75 | **~0,10 €** |
| **Claude Sonnet 4.x** | 3 | 15 | **~0,019 €** |
| Claude Haiku 4.x | 1 | 5 | ~0,006 € |
| GPT-4o | 2,50 | 10 | ~0,014 € |
| GPT-4o-mini | 0,15 | 0,60 | ~0,0008 € |
| Gemini 1.5 Pro | 1,25 | 5 | ~0,007 € |
| Gemini 1.5 Flash | 0,075 | 0,30 | ~0,0004 € |
| Mistral Large 2 | 2 | 6 | ~0,010 € |
| Mistral Small | 0,20 | 0,60 | ~0,0009 € |

Le **prompt caching** Anthropic (-90 % sur la portion statique, ~1 200 tokens ici) gagne ~14 % sur le coût input. Marginal parce que l'output domine à ce ratio de tokens.

### Coût mensuel selon volume

| Modèle | 1 000 dossiers/mois (~50/j) | 4 000 dossiers/mois (~200/j) | 10 000 dossiers/mois (~500/j) |
|---|---|---|---|
| Opus 4.x | ~95 € | ~380 € | ~950 € |
| **Sonnet 4.x** | **~19 €** | **~75 €** | **~190 €** |
| Haiku 4.x | ~6 € | ~25 € | ~60 € |
| GPT-4o | ~14 € | ~55 € | ~140 € |
| GPT-4o-mini | ~1 € | ~3,5 € | ~9 € |
| Gemini 1.5 Pro | ~7 € | ~28 € | ~70 € |
| Gemini 1.5 Flash | ~0,4 € | ~1,7 € | ~4 € |
| Mistral Large 2 | ~10 € | ~40 € | ~100 € |

### L'insight clé : le coût n'est pas la contrainte qui pince

Un analyste qui gagne 15 min/dossier (cible J3) à ~50 €/h chargée = **~12,50 € de valeur générée par dossier**.

- Modèle le plus cher (Opus, ~0,10 €/dossier) consomme **0,8 %** de cette valeur.
- Modèle le moins cher (Flash, ~0,0005 €/dossier) consomme **0,004 %**.

→ La vraie contrainte, c'est la **qualité du draft** (taux d'acceptation analyste) — pas l'API bill. Optimiser sur le coût avant d'avoir mesuré la qualité serait inverser les priorités.

### Reco produit (3 phases)

1. **Bootstrap (≤100 premiers dossiers)** : démarrer Claude Sonnet 4.x ou GPT-4o. Bon équilibre raisonnement / FR / coût (~75 €/mois à 4k dossiers). Activer le prompt caching Anthropic.
2. **Mesure** : logger systématiquement `(prompt, output, version éditée par l'analyste)` dans `EventsStore`. Calculer l'**edit distance** moyen entre brouillon et version envoyée — *le* signal d'acceptation.
3. **Descendre la gamme si tenable** : tester Haiku 4.x ou GPT-4o-mini sur un échantillon. Si l'edit distance reste équivalent, switch → ×3 d'économie pour zéro coût qualité.

**À ne pas faire** : partir directement sur Haiku/mini « parce que c'est moins cher ». Risque qu'un analyste senior pose son veto sur la qualité → la feature meurt. Le cadrage est explicite (« IA assistée jamais décisionnelle ») : la barre du draft doit être haute, sinon il n'est plus utilisé.

---

## 3. Trade-offs assumés

### 3.1 Gating Hybrid Option 2 (data → KPI)
Quand une donnée requise par une règle est absente (ex. liasse N-1 → `revenuePreviousYear = null`), on **désactive la règle proprement** (statut `unknown` + raison lisible *« Liasse N-1 manquante »*) plutôt que de l'extrapoler ou de ne rien afficher. *Conséquence* : moins de red flags sur les dossiers incomplets — mais **un diagnostic honnête prime sur un diagnostic complet mais bidon**. L'analyste sait *pourquoi* une tuile est grise.

### 3.2 10 indicateurs structurés vs liste textuelle de red flags
La spec initiale prévoyait un simple `Alert` collapsible listant *« Dette/EBITDA = 11.2× »*. À l'usage, la liste textuelle force l'analyste à reconstruire mentalement la cartographie. Le `RulesDiagnostic` surface l'**intégralité du référentiel** (indicateurs sains + à risque + non-calculables) avec popover méthodo intégré → moins de trous noirs cognitifs, beaucoup plus didactique pour les juniors. *Trade-off* : surface UI plus large (10 tuiles vs 1 bandeau). Assumé.

### 3.3 Pas d'auth, pas de DB, in-memory
Lecture directe des JSON `data/augmented/` via `fs`. Aucun store, aucun token, aucune migration. *Trade-off* : aucune crédibilité prod, mais setup en 30s — exactement ce qu'on veut pour un POC qui démontre une méthode.

### 3.4 Investir dans le tracking avant d'avoir des users
On a instrumenté 8+ types d'events jour 1, alors qu'aucun analyste réel ne touche encore le POC. *Trade-off* : ~15 min de code "inutile" sur le timebox. **Mais** c'est la condition pour ouvrir le cycle mesure (§4) — sans baseline mesurable, la promesse « 2h → 30 min » reste un slide PowerPoint.

### 3.5 Enrichissement données factoring (simulé, assumé)
Les 3 indicateurs factoring livrés (`CONCENTRATION_TOP_CLIENT`, `AGED_RECEIVABLES_HIGH`, `DILUTION_RATE_HIGH`) ne sont pas dans `data/raw/`. Les valeurs *Fleurs de Saison* dans `data/augmented/` sont **simulées** de manière cohérente avec un fleuriste B2B (top 38 %, balance âgée 24 %, dilution 4,2 %). *Trade-off* : extension du périmètre données pour démontrer la différenciation produit — assumé, documenté en architecture §3 et en [annexe 1](README-annexe-1-regles.md). 3 règles factoring supplémentaires (`CONCENTRATION_TOP_5`, `DEBTOR_PAYMENT_INCIDENTS`, `SECTOR_CONCENTRATION`) restent à livrer en J3+.

---

## 4. Évolutions vs spec initiale

Trois écarts notables entre la spec figée pré-code et ce qui a été livré. Justifiés dans le PRD (encarts « Évolution post-bloc ») et l'architecture (§2bis, §6, §7).

| # | Spec initiale | Livré | Raison |
|---|---|---|---|
| 1 | `RedFlagsBanner` collapsible (1 bandeau Alert) | `RulesDiagnostic` (10 tuiles + popovers) | Didactique + intégrité référentiel d'analyse |
| 2 | `ScoreCard` séparé (collapsed) + `DecisionPanel` distinct | Score fusionné *dans* `DecisionPanel` + cross-highlight bullet→tuile | Co-localisation cognitive load → moins de switch attentionnel au moment décisif |
| 3 | `RedFlagDetector` simple + table de règles inline | Module `RuleEngine` (source unique) + DTO étendu (`metricStatuses`, `dataCoverage`, `financialThresholds`, `rulesDiagnostic`) | Un seul endroit pour la logique métier → cohérence garantie entre tuiles, bandeau, popovers, bullets |

Les 3 specs sous `_bmad-output/implementation-artifacts/` sont **figées** (`<frozen-after-approval>` + Spec Change Log append-only). Les évolutions post-livraison vivent dans le PRD et l'architecture, qui sont les docs de référence à jour.

---

## 5. Timeline produit (5 phases)

Pas de chronologie commit par commit ; les phases reflètent l'enchaînement *logique* du raisonnement produit.

1. **Cadrage** (avant toute ligne de code) — triangulation voix analystes + data parcours + kickoff Greg. Sortie : README §2 (méthode + roadmap 4 jalons), PRD, architecture. Décision : J1+J2 only.
2. **Backend engines purs** — `CompletenessEngine` + tests, `RedFlagDetector` + `ScoreExplainer`, `CockpitAggregator`. Endpoint roi `GET /api/dossiers/:id/cockpit`.
3. **Frontend cockpit MVP** — TanStack Router 2 routes, shadcn/ui systématique, progressive disclosure stricte. Refacto → TanStack Query.
4. **Bloc 3 (relances + décisions + instrumentation)** — `RelanceModal` + `DecisionPanel` + `lib/track.ts` + middleware backend. ≥5 events distincts exportables.
5. **Polish 3-reviewer + diagnostic 10 indicateurs** — promotion en `RuleEngine` source unique, `RulesDiagnostic`, gating Hybrid Option 2, fusion `ScoreCard` dans `DecisionPanel` avec cross-highlight, refacto frontend `features/`, **patch `DSO_LONG` factoring=high**.

---

## 6. Axes d'amélioration

Ordre = priorité produit (impact / effort).

### Court terme (avant prochain débrief Karmen)
1. **Mesurer la baseline réelle.** Brancher l'export `GET /api/events` sur un script qui agrège `dossier.opened` → `decision.made` par session, en croisant junior/senior. C'est l'ouverture du cycle mesure annoncé en cadrage §1.
2. **Questions analystes Q1-Q3** non-collectées dans le cadrage (5-10 analystes, mix junior/senior + observation chronométrée 2 dossiers) — à mener avant d'investir dans J3.
3. **Tester directement le `RuleEngine`** (aujourd'hui testé via la façade `RedFlagDetector`). Couvrir `metricStatuses()` et `diagnostic()` qui sont les sorties consommées par le front.

### Moyen terme (J3 + J4 de la roadmap)
4. **Note IA pré-rédigée** (J3) — cf. §2 ci-dessus pour le chiffrage et l'arbitrage modèle.
5. **Pré-validation no-brainers en 1 clic** (J4) : règle d'éligibilité = `score >= seuil` & `completeness = 100%` & `0 red flag high`. Brasserie du Marais y serait éligible.
6. **Indicateurs factoring complémentaires** : `CONCENTRATION_TOP_5`, `DEBTOR_PAYMENT_INCIDENTS`, `SECTOR_CONCENTRATION` (les 3 premiers — concentration top 1, balance âgée, dilution — sont livrés).

### Long terme (vers la prod)
7. OCR réel des liasses (Holofin / Dataleon).
8. Open Banking réel (Bridge / Powens — déjà chez Karmen).
9. Auth + RBAC + multi-tenant.
10. Persistance DB (Postgres + Prisma) + runtime validation `zod` pour `AugmentedDossier`.
11. Idempotency sur `POST /api/decisions`.
12. A11y : audit WCAG, `aria-label` sur les icônes Radix Collapsible.

Détail des items remontés en code review et différés : [`_bmad-output/implementation-artifacts/deferred-work.md`](_bmad-output/implementation-artifacts/deferred-work.md).

---

## 7. Out of scope (assumé)

OCR réel · Open Banking réel · Auth / RBAC / multi-tenant · Moteur de scoring (existe chez Karmen) · Persistance DB · Envoi SMTP réel · Tests E2E · 3 règles factoring complémentaires (cf. roadmap §6) · Pré-validation no-brainers · Note IA décision · i18n (FR en dur) · Audit a11y WCAG.
