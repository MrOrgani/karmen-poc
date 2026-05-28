# PRD — Cockpit Analyste Karmen (POC)

**Statut :** ready-for-agent
**Auteur :** Max · 2026-05-27
**Timebox :** 2-3h de code
**Sources :** méthode de cadrage intégrée au [README §2](../README.md#2-méthode-de-cadrage), [architecture POC](architecture-poc-karmen.md), [brainstorming](brainstorming/brainstorming-session-2026-05-26-1058.md), [fiche finance](learning/fiche-finance-entreprise-analyse-credit-pme.md).

---

## Problem Statement

Un analyste crédit Karmen traite aujourd'hui un dossier de financement PME (prêt ou affacturage) en **2h en moyenne**, avec une distribution bimodale (no-brainers ~30 min, complexes jusqu'à 4h). Les 4 étapes du workflow — vérifier la complétude documentaire, creuser les données financières, consulter le scoring, rédiger la recommandation — sont aujourd'hui dispersées entre plusieurs modules et écrans, sans vue récap. Résultat : allers-retours email manuels pour réclamer des pièces, navigation entre onglets pour retrouver les indicateurs financiers, rédaction de note finale sur une interface peu adaptée. L'analyste perd du temps sur des tâches mécaniques au lieu de se concentrer sur le jugement métier.

## Solution

Un **écran unique de cockpit** par dossier qui agrège, en un seul scroll :
- la **complétude documentaire** détectée automatiquement (liasses fiscales, relevés bancaires) avec liste des pièces manquantes,
- le **score de risque** existant rendu lisible par 3 phrases d'explication,
- les **indicateurs financiers clés** extraits de la liasse (CA, EBITDA, marge, dette, DSO, trésorerie),
- les **flux bancaires** agrégés sur 12 mois (entrées/sorties moyennes, jours de découvert, rejets),
- les **red flags** détectés automatiquement par règles métier (dette/EBITDA, marge EBITDA, découverts, rejets…),
- une **action de relance** par email pré-rédigé en 1 clic si pièces manquantes,
- une **prise de décision** intégrée (approuver / demander docs / refuser + justification courte).

L'écran est **instrumenté jour 1** : chaque interaction émet un event horodaté, exportable en JSON, pour mesurer le temps réel passé par dossier et identifier les voleurs résiduels. L'écran s'adapte au type de financement (prêt vs affacturage) en surfaçant les indicateurs spécifiques quand c'est de l'affacturage : **balance âgée, concentration top client, taux de dilution livrés** (3 règles `category: 'factoring'` activées conditionnellement sur `financing_request.type === 'factoring'`, cf. §Out of Scope pour les compléments roadmap).

## User Stories

1. En tant qu'analyste crédit, je veux voir la liste des dossiers en attente avec un badge de complétude visible, afin d'attaquer en priorité ceux qui sont déjà complets.
2. En tant qu'analyste, je veux cliquer sur un dossier et arriver directement sur son écran cockpit, afin de ne pas naviguer entre plusieurs modules.
3. En tant qu'analyste, je veux voir en haut du cockpit l'identité de l'entreprise (raison sociale, SIREN, type juridique, secteur) et les paramètres de la demande (montant, durée, taux, type prêt/affacturage), afin d'avoir le contexte immédiat.
4. En tant qu'analyste, je veux voir en haut du cockpit un **diagnostic structuré des 10 indicateurs clés** (CA, EBITDA, marge, dette/EBITDA, résultat net, trésorerie, DSO, découverts, rejets, balance E/S) groupés par catégorie (financiers / bancaires) avec un statut visuel par tuile (`ok` / `warn` / `alert` / `unknown`), afin de juger en 5 secondes la santé du dossier sans lire de prose.
5. En tant qu'analyste, je veux survoler chaque tuile pour voir un **popover de méthodologie** (seuil, formule, source de la donnée), afin de comprendre *pourquoi* une tuile est en alerte sans rouvrir la doc règles.

> **Évolution post-bloc 2 → "diagnostic 10 indicateurs".** La spec d'origine (US #4-5) prévoyait un simple bandeau `Alert` collapsible listant les red flags textuels. À l'usage on a constaté que la liste textuelle (« Dette/EBITDA = 11.2× ») demande à l'analyste de reconstruire mentalement la cartographie des indicateurs, ce qui annule une partie du gain de temps. Le diagnostic 10 indicateurs surface l'intégralité du référentiel d'analyse (y compris les indicateurs *sains* et ceux *non-calculables*), avec popover méthodo intégré → moins de "trous noirs" cognitifs, plus didactique pour les juniors. Trade-off : surface UI plus large (10 tuiles vs 1 bandeau), assumé.
6. En tant qu'analyste, je veux voir un indicateur de complétude documentaire avec un pourcentage et un état visuel (vert si 100%), afin de savoir si je peux décider tout de suite ou si je dois relancer.
7. En tant qu'analyste, je veux voir la liste des pièces manquantes avec une raison explicite (« seulement 10 mois sur 12 pour LCL », « 1/2 liasses fournies »), afin de comprendre exactement ce qu'il manque.
8. En tant qu'analyste, je veux un bouton « Demander docs » qui ouvre une modale d'email pré-rédigé, afin de relancer le client sans rédiger l'email moi-même.
9. En tant qu'analyste, je veux pouvoir éditer le contenu de l'email avant envoi, afin de personnaliser le ton si nécessaire.
10. En tant qu'analyste, je veux voir le score de risque (low/medium/high) **co-localisé avec le panneau de décision**, accompagné de 3 bullets d'explication cliquables qui me **scrollent vers la ou les tuiles d'indicateurs sous-jacentes** (cross-highlight), afin de comprendre l'origine du score sans switch d'attention.

> **Évolution post-bloc 2 → score fusionné dans `DecisionPanel`.** La spec d'origine prévoyait un `ScoreCard` séparé (collapsed) et un `DecisionPanel` distinct (expanded). À l'usage, l'analyste consulte le score *au moment de cliquer un des 3 boutons* — séparer les deux force un aller-retour visuel. La fusion réduit la cognitive load au moment décisif et permet le **cross-highlight bullet → tuile** (chaque bullet expose `ruleCodes[]` côté backend). Trade-off : le score n'est plus visible "en survol" sans dérouler la section décision, assumé puisque la décision est toujours expanded.
11. En tant qu'analyste, je veux voir les indicateurs financiers clés (CA N et N-1 avec variation, EBITDA et marge, résultat net, dette, dette/EBITDA, trésorerie, DSO), afin d'évaluer la santé financière sans rouvrir un autre écran.
12. En tant qu'analyste, je veux voir les flux bancaires agrégés sur 12 mois (entrées/sorties moyennes, jours de découvert, nombre de rejets), afin d'évaluer le comportement bancaire réel.
13. En tant qu'analyste, je veux que les sections « santé financière » et « flux bancaires » soient collapsibles, afin d'aller vite quand le dossier est un no-brainer.
14. En tant qu'analyste, je veux pouvoir prendre une décision directement depuis l'écran cockpit avec 3 boutons (approuver / demander docs / refuser), afin de ne pas changer d'interface pour conclure.
15. En tant qu'analyste, je veux saisir une justification courte (1 phrase) accompagnant ma décision, afin de tracer le raisonnement sans rédiger une note longue.
16. En tant qu'analyste, je veux que le bouton « Demander docs » soit mis en avant si la complétude n'est pas à 100%, afin d'être guidé vers l'action la plus probable.
17. En tant qu'analyste, je veux que l'écran cockpit s'adapte au type de financement (prêt vs affacturage), afin de voir les indicateurs pertinents pour chaque cas.
18. En tant qu'analyste, je veux que chacune de mes interactions (ouverture dossier, expansion section, ouverture modale relance, envoi relance, décision prise) soit trackée, afin de pouvoir mesurer où je passe mon temps.
19. En tant que product owner Karmen, je veux pouvoir exporter le journal d'events en JSON depuis un endpoint dédié, afin de calculer le temps moyen par dossier en post-traitement.
20. En tant que product owner, je veux qu'au moins 5 types d'events distincts soient instrumentés, afin d'avoir un signal suffisamment riche pour décider des prochaines optimisations.
21. En tant qu'analyste, je veux que l'écran soit utilisable sur mobile/tablette (responsive), afin de pouvoir consulter un dossier en mobilité.
22. En tant que dev qui reprend le POC, je veux un README clair avec démarrage en 30 secondes, scope IN/OUT explicite et captures écran, afin de comprendre le périmètre sans interview.
23. En tant que dev, je veux que les règles de complétude soient testées unitairement, afin d'avoir un filet de sécurité sur le moteur métier le plus critique.
24. En tant que dev, je veux que les règles de red flags soient testées unitairement, afin de garantir que les seuils déclarés (dette/EBITDA > 5, découverts > 30j…) déclenchent bien les alertes correspondantes.
25. En tant que dev, je veux que la génération des bullets d'explication du score soit testée unitairement, afin de garantir que les phrases produites correspondent aux indicateurs sous-jacents.
26. En tant que dev, je veux pouvoir lancer back + front en une seule commande (`npm run dev` à la racine), afin de démarrer le POC sans friction.
27. En tant que dev, je veux que les données du POC vivent dans `data/raw/` (intact) et `data/augmented/` (enrichi), afin que la séparation entre données fournies et données simulées soit auditable.

## Implementation Decisions

> **Évolutions post-livraison (synthèse).** Cette section décrit l'architecture telle que livrée. Trois évolutions notables par rapport au design initial ont été actées en cours de réalisation :
> 1. **`RuleEngine` comme source unique de vérité métier** (cf. §Modules backend). Le `RedFlagDetector` simple a été promu en moteur déclaratif unique qui produit à la fois les red flags textuels, les statuts par indicateur (`metricStatuses`), les seuils (`financialThresholds`) et le diagnostic groupé (`rulesDiagnostic`). Justification : une seule table de règles → cohérence garantie entre bandeau anomalies, tuiles, popovers, et bullets du score.
> 2. **Gating data → KPI (Hybrid Option 2).** Quand une donnée requise par une règle est absente (ex. liasse N-1 manquante → `revenuePreviousYear = null`), la règle correspondante n'est pas évaluée silencieusement : elle remonte avec le statut `unknown` + raison (`"Liasse N-1 manquante"`). On préfère un diagnostic *honnête mais incomplet* à un diagnostic *complet mais extrapolé*. Le contrat `FinancialIndicators` accepte donc des champs nullables (`revenuePreviousYear: number | null`), et le frontend affiche les tuiles `unknown` en gris explicite.
> 3. **Diagnostic 10 indicateurs + score-dans-décision.** Voir US #4-5 et #10 ci-dessus. Conséquence sur le contrat API : `CockpitResponse` est enrichi (cf. §Schéma `CockpitResponseDto`).

### Modules backend (NestJS)

- **CompletenessEngine** (module profond, pur, sans état) — interface unique : `check(dossier: AugmentedDossier) → { score: number, isComplete: boolean, missing: MissingItem[] }`. Encapsule les règles `liasseFiscaleMinCount` et `minMonthsPerBankAccount` par type de financement. Table de règles déclarative pour faciliter l'ajout de nouveaux types de pièces. Le score est calculé comme `completedItems / totalItems × 100`.
- **RuleEngine** (module profond, pur, sans état) — **source unique de vérité métier**. Interface : `evaluateAll(indicators, bankFlows, dataCoverage) → { redFlags, metricStatuses, diagnostic, thresholds }`. Une table déclarative de 10 règles (code, condition, severity, label, catégorie `financial|bank`, formatter de la valeur, rationale du popover, prérequis de données pour le gating Option 2). Codes : `DEBT_TO_EBITDA_HIGH/MEDIUM`, `EBITDA_MARGIN_LOW`, `EBITDA_NEGATIVE_OR_ZERO`, `NEGATIVE_NET_INCOME`, `REVENUE_DECLINING` (gated sur N-1), `OVERDRAFT_DAYS_HIGH`, `REJECTED_PAYMENTS`, `LOW_CASH_POSITION`, `DSO_LONG`.
- **RedFlagDetector** — façade conservée pour compat de contrat ; délègue intégralement à `RuleEngine.redFlags()`. *Évolution post-bloc 2 : la promotion de la table de règles en `RuleEngine` était indispensable pour produire le diagnostic 10 indicateurs et garantir que `redFlags`, tuiles, popovers et bullets du score partagent strictement le même référentiel.*
- **ScoreExplainer** (module profond, pur) — `explain(dossier, redFlags) → ScoreBullet[]`. Produit 3 bullets max, priorise les angles rentabilité / endettement / flux bancaires. *Évolution : chaque bullet porte désormais `ruleCodes: string[]` permettant le cross-highlight bullet → tuile côté front.*
- **CockpitAggregator** (orchestrateur fin) — `getCockpit(dossierId) → CockpitResponseDto`. Lit le dossier via le repository, calcule la `dataCoverage`, appelle `RuleEngine` + `ScoreExplainer`, compose la réponse. Pas de logique métier propre.
- **RelanceDrafter** — `draft(dossier, missing[]) → { subject, body, missingDocs[] }`. Implémentation mock par défaut (template paramétré), branchement LLM réel commenté pour démo si clé API dispo.
- **EventTracker** — store in-memory (`Array<Event>`), endpoints `POST /events` (ingest depuis front) et `GET /events` (export JSON pour analyse). Pas de persistance.
- **Tracking middleware** — log chaque request avec sa duration, alimente le même store que les events front.

### Modules frontend (React/Vite/Tailwind)

> **Évolution post-bloc 2 — arborescence feature-based.** L'arbo initiale était `frontend/src/components/cockpit/*`. Au moment d'ajouter relances + décisions + tracking (bloc 3), le besoin de regrouper composants + hooks + types *par feature* est devenu évident. Arbo finale : `frontend/src/features/{dossiers-list,cockpit,relance,decision}/{components,hooks,...}`. Bénéfice : un dossier = une feature complète, plus simple à lire et à supprimer.

- **DossiersListPage** (`features/dossiers-list/`) — liste les 4 dossiers + badge complétude. Appelle `GET /dossiers` via React Query.
- **CockpitPage** (`features/cockpit/`) — appelle `GET /dossiers/:id/cockpit` et compose la vue. Fournit `CockpitProvider` (id) + `RuleHighlightProvider` (cross-highlight).
- **Composition cockpit** — ordre de progressive disclosure : (1) `CockpitHeader` (entreprise + demande), (2) `CompletenessSection` *expanded*, (3) `RulesDiagnostic` *expanded* (10 tuiles groupées financial/bank + popovers méthodo), (4) `FinancialIndicators` + `BankFlowsCard` *collapsed* en grid 2-col sur `lg:`, (5) `DecisionPanel` *expanded* (synthèse score + 3 bullets cliquables + 3 boutons + justification).
- **`RulesDiagnostic`** — composant clé du POC : reçoit `rulesDiagnostic` + `metricStatuses` + `financialThresholds`, rend 10 `MetricTile` (status ok/warn/alert/unknown, popover méthodo, ancrage scrollable). *Remplace `RedFlagsBanner` initialement spécifié.*
- **`DecisionPanel`** — synthèse score (pastille + global_score) + 3 bullets `ScoreBullet` (chaque bullet scrolle + highlight les tuiles de `ruleCodes[]` via `useRuleHighlight`) + 3 boutons (approve / request_docs / reject) + textarea justification + `AlertDialog` de confirmation pour `reject`. POST `/decisions` au submit.
- **`RelanceModal`** — Dialog shadcn, email pré-rédigé éditable (subject + body), bouton "Envoyer" → émet `relance.sent` (pas d'envoi SMTP réel) + ferme la modale.
- **Composants extraits** — `MetricTile`, `SectionCard`, `CollapsibleSection`, `CockpitHeader` : extraits pour réutilisabilité et lisibilité (vs spec initiale qui ne les listait pas).
- **`lib/track.ts`** — `track(type, payload)` log console + POST `/events`. Wrapper unique.
- **`lib/api.ts`** — wrapper `fetch` + `ApiError` typé ; React Query l'appelle dans les hooks de features.

### Contrats API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/dossiers` | Liste 4 dossiers + badge complétude |
| `GET` | `/dossiers/:id/cockpit` | Endpoint roi — réponse `CockpitResponseDto` |
| `POST` | `/relances/draft` | Génère brouillon email (mock LLM) |
| `POST` | `/decisions` | Enregistre décision (log console + event) |
| `POST` | `/events` | Ingest events front |
| `GET` | `/events` | Export JSON pour post-traitement |

### Schéma `CockpitResponseDto`

> **Évolution post-bloc 2 — DTO enrichi.** Le schéma initial (`completeness`, `redFlags`, `scoreExplanation.bullets`) ne suffisait pas pour alimenter `RulesDiagnostic` (statuts par indicateur, seuils, méthodologie) ni le cross-highlight (`ruleCodes` par bullet). Le DTO a été étendu de façon backward-compatible : les champs initiaux sont conservés, les nouveaux sont additifs.

```typescript
type CockpitResponse = {
  dossier: AugmentedDossier;
  completeness: { score: number; isComplete: boolean; missing: MissingItem[] };
  dataCoverage: {                       // Hybrid Option 2 — quelles données sont disponibles
    hasPreviousYearLiasse: boolean;
    bankMonthsCovered: number;
    isBankFlowsExtrapolated: boolean;
  };
  redFlags: Array<{ severity: 'low'|'medium'|'high'; code: string; label: string; value: string }>;
  metricStatuses: Record<MetricKey, { status: 'ok'|'warn'|'alert'|'unknown'; unavailableReason?: string }>;
  financialThresholds: Record<MetricKey, { warn?: number; alert?: number; unit: string }>;
  rulesDiagnostic: Array<{              // 10 tuiles groupées
    code: string;
    metricKey: MetricKey;
    category: 'financial'|'bank';
    status: 'ok'|'warn'|'alert'|'unknown';
    label: string;
    valueLabel: string;
    rationale: string;                  // popover méthodo
    unavailableReason?: string;
  }>;
  scoreExplanation: {
    bullets: Array<{ text: string; ruleCodes: string[] }>;   // ruleCodes → cross-highlight
  };
};
```

Le champ `FinancialIndicators.revenuePreviousYear` est `number | null` côté backend (null si la liasse N-1 est manquante), ce qui désactive proprement la règle `REVENUE_DECLINING` (statut `unknown`).

### Décisions transverses

- **Pas de DB** : lecture directe des JSON `data/augmented/*` via `fs`. Justifié par le périmètre POC (4 dossiers).
- **Pas d'auth** : hors scope, signalé dans README.
- **LLM mocké par défaut** : le POC tourne sans clé API, branchement réel documenté.
- **Mobile responsive** : Tailwind, breakpoints standards, sections empilables.
- **Monorepo npm workspaces** : `npm install && npm run dev` à la racine lance back (3000) + front (5173). Proxy Vite `/api/*` → backend.

## Testing Decisions

**Principe :** ne tester que le comportement externe des modules profonds (entrées → sorties), pas les détails d'implémentation. Pas de mock des dépendances internes des modules purs (ils n'en ont pas). Pas de test E2E ni d'intégration HTTP — hors timebox.

**Modules testés (Jest, déjà présent dans le setup NestJS) :**

- **CompletenessEngine** — cas couverts : dossier prêt complet (2 liasses + 12 mois bancaires) → `isComplete: true, score: 100` ; dossier prêt avec 1 seule liasse → `missing` contient un item de type `liasse_fiscale` avec ratio dans la raison ; dossier avec relevé bancaire à 10 mois → `missing` contient un item `releve_bancaire` mentionnant le nombre de mois et le nom de la banque ; dossier multi-comptes bancaires (LCL + BNP) → checks indépendants par compte.
- **RedFlagDetector** — cas couverts : chaque règle déclenche son code attendu sur des valeurs en zone critique (ex. `totalDebt=11×ebitda` → `DEBT_TO_EBITDA_HIGH`) ; aucune règle ne déclenche sur des valeurs saines ; sévérités correctes pour les paliers (ex. dette/EBITDA entre 3 et 5 → `MEDIUM`, > 5 → `HIGH`) ; le formatter de la valeur produit la chaîne attendue (ex. `"11.2× (seuil critique > 5×)"`).
- **ScoreExplainer** — cas couverts : produit ≤3 bullets ; en présence de red flags HIGH, au moins un bullet reflète l'angle problématique ; sur un dossier sain (aucun red flag, marge EBITDA > 10%, dette/EBITDA < 2), les 3 bullets reflètent rentabilité, endettement, trésorerie.

**Prior art :** le scaffold NestJS contient déjà `app.controller.spec.ts` + setup Jest dans `backend/package.json`. Pattern à reprendre : `describe('CompletenessEngine', () => { it('...', () => {...}) })` avec données de test inline ou factory minimale.

**Non testés (assumé) :** orchestrateurs (CockpitAggregator, controllers NestJS), RelanceDrafter (mock trivial), EventTracker (store in-memory trivial), tous les composants React. Justification : pas de logique métier propre, et le timebox de 2-3h prime.

## Out of Scope

- OCR réel des liasses fiscales (en prod : Holofin / Dataleon).
- Open Banking réel (en prod : Bridge / Powens, déjà chez Karmen).
- Authentification, RBAC, multi-tenant.
- Moteur de scoring (existe déjà chez Karmen, on consomme le `risk_bucket` et `global_score` fournis).
- Persistance en base de données ; tout est in-memory.
- Envoi SMTP réel des relances (la modale simule l'envoi).
- Tests E2E exhaustifs, tests d'intégration HTTP, tests des composants React.
- Indicateurs affacturage *complémentaires* hors POC (les 3 cœur — balance âgée, concentration top 1, dilution — sont livrés) : `CONCENTRATION_TOP_5`, `DEBTOR_PAYMENT_INCIDENTS`, `SECTOR_CONCENTRATION`, pondération variable `REVENUE_DECLINING` en factoring. Roadmap J3+.
- Pré-validation des no-brainers en 1 clic (jalon J4 de la roadmap, hors POC).
- Note IA pré-rédigée pour la décision finale (jalon J3, hors POC).
- Accessibilité (WCAG) : effort de base via Tailwind mais pas d'audit.
- i18n : tout en français en dur.

## Further Notes

- Le POC sert avant tout à **démontrer la méthode** (mesure jour 1 + adaptabilité prêt/affacturage) au-delà des features, et à supporter le débrief Grégoire (lundi 2026-06-01 après-midi).
- Métriques de succès POC, vérifiables à la démo :
  - Détection complétude correcte sur les 2 dossiers incomplets fournis (test unitaire valide).
  - Red flags visibles sur Transport Leclerc (high risk, score 34).
  - Au moins 5 events distincts instrumentés, exportables en JSON via `GET /events`.
  - Démo end-to-end < 5 min par dossier.
- En cas de dépassement timebox, l'ordre de coupe est : (1) tracking middleware backend (garder uniquement track front), (2) tests RedFlagDetector et ScoreExplainer (garder uniquement CompletenessEngine), (3) modale relance simplifiée à une alert(), (4) responsive mobile basique sans peaufinage.
- Pas de tracker d'issues configuré sur ce projet ; ce PRD vit dans `_bmad-output/`. Si un Linear/GitHub Projects est mis en place plus tard, ré-importer avec le label `ready-for-agent`.
