# Karmen — Test technique Max 2026-05 - POC Cockpit Analyste

> Pas une feature livrée : une **réduction de 2h à ~21 min par dossier**, construite sur un cadrage validé Grégoire et **mesurable dès le jour 1** via events instrumentés.

**Stack** NestJS + React/Vite + Tailwind + TanStack Router/Query + shadcn/ui

**Données** 4 dossiers réels + indicateurs simulés (`data/raw` intact, `data/augmented` enrichi).

---

## 1. Le problème

Un analyste Karmen traite un dossier PME en **2h en moyenne** (distribution bimodale 30 min ↔ 4h).  
Les 4 étapes du workflow : complétude -> données financières -> scoring -> rédaction.

Les informations sont dispersées sur plusieurs écrans, sans vue récap, avec **allers-retours email manuels** pour réclamer les pièces et **navigation onglet-à-onglet** pour reconstruire mentalement la santé financière.

Ordre chronophagie validé Grégoire : complétude > financier > note > scoring.

## 2. Méthode de cadrage

**Triangulation** (le socle avant toute ligne de code) :

- **(a)** voix analystes (3-5 interviews + observation chronométrée 2 dossiers junior+senior — _prévue, non-collectée à date : c'est l'ouverture du cycle mesure_),
- **(b)** data parcours via l'outil d'instrumentation Karmen existant (audit baseline en kickoff + events POC compatibles dès la 1ère ligne),
- **(c)** hypothèses business validées en kickoff Grégoire : différenciation prêt/factoring **faible** (+ quelques indicateurs spécifiques affacturage), distribution **bimodale confirmée** (no-brainers ~30 min vs complexes ~4h), ordre chronophagie validé.

**Garde-fous posture** : jugement humain reste roi, IA assistée jamais décisionnelle, instrumentation jour 1.

**Avant de coder — questions analystes ciblées** (3-5 analystes, mix junior/senior, observation think-aloud 60 min) :

- **Q1.** _"Sur ton dernier dossier 2h, quelles étapes ont été les plus consommatrices ? Où as-tu perdu du temps inutilement ?"_
- **Q2.** _"Qu'est-ce qui fait qu'un dossier prend 30 min plutôt que 4h ? Quel type te plombe, lequel passe sans douleur ?"_
- **Q3.** _"Combien de fois tu rouvres un onglet ou un module déjà consulté ? Dernier cas concret ?"_

**Roadmap 2h → 30 min — 4 jalons / 8 semaines :**

| Jalon  | Période | Livrable                                                   | Voleur                     | Gain                                       | Métrique de validation                                 |
| ------ | ------- | ---------------------------------------------------------- | -------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| **J1** | S1-S2   | Completeness Engine (+ Smart Relance IA?)                  | Étape 1 (#1)               | **-25 min**                                | % complets au 1er dépôt, nb relances/dossier, NPS      |
| **J2** | S3-S4   | Cockpit unifié adaptatif prêt/affacturage                  | Étape 3 (#2)               | **-45 min**                                | Temps cockpit→décision (`case.opened`→`decision.made`) |
| **J3** | S5-S6   | Note IA pré-rédigée + interface décision rénovée           | Étape 4 (#3 + frustration) | **-15 min + adhésion**                     | Temps rédaction médian, NPS analyste rédaction         |
| **J4** | S7-S8   | Pré-validation no-brainers (encadrée, 1 clic, audit trail) | Bimodalité                 | **-25 min sur 50 % portef = -12 min moy.** | % pré-validés, taux confirmation, rouverture           |

**Décision structurante POC** : coder **J1 + J2** = les 2 plus gros voleurs (étapes 1+3), embarquant l'instrumentation events jour 1 dans un format compatible avec l'outil Karmen existant. **J3 (note IA) et J4 (pré-validation no-brainers) explicitement écartés** — faire moins, mais mesurable. La démo Fleurs de Saison matérialise l'adaptabilité prêt/factoring promise par J2.

## 3. Le POC livré (J1 + J2)

Un **écran unique par dossier** qui empile, dans l'ordre où l'analyste pense :

(1) complétude documentaire auto-détectée + modale email pré-rédigé éditable,  
(2) **diagnostic 10 indicateurs communs** (`RulesDiagnostic`) groupés financial/bank + **3 indicateurs factoring** (concentration top client, balance âgée, dilution) surfacés _uniquement_ sur les dossiers `type === 'factoring'`. Statuts `ok`/`warn`/`alert`/`unknown` + popover méthodo (seuil + formule + source).  
(3) indicateurs financiers détaillés + flux bancaires en grille 2 colonnes (la complétude reste la seule section repliable — progressive disclosure ciblée sur l'étape 1),  
(4) panneau décision unifié : score + 3 bullets cliquables (cross-highlight bullet → tuile), 3 boutons + justification 1 phrase + confirmation modale sur refus. Le `RuleEngine` est **source unique de vérité** (cohérence garantie tuiles ↔ bandeau ↔ bullets) et **lit `financing_request.type`** : `DSO_LONG` `medium` en prêt vs `high` en factoring, catégorie `factoring` activée conditionnellement (cf. [annexe 1](README-annexe-1-regles.md)).

**Honnêteté méthodo** : les 3 indicateurs factoring (balance âgée, concentration top, dilution) ne sont pas dans `data/raw/` — les valeurs _Fleurs de Saison_ dans `data/augmented/` sont simulées de manière cohérente avec un fleuriste B2B (top client 38 %, 24 % de créances > 60 j, dilution 4,2 %). L'enrichissement est documenté en architecture §3.

## 4. Démo — 4 dossiers, 4 scénarios

| Dossier                 | Type           | Score                   | Démontre                                                                                                                                 |
| ----------------------- | -------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Brasserie du Marais** | loan 35k€      | 82 _low_                | Le no-brainer : progressive disclosure, 0 red flag, approbation ~30s                                                                     |
| **Fleurs de Saison**    | factoring 12k€ | 67 _medium_             | Différenciation factoring **livrée** : 3 tuiles dédiées + `DSO_LONG` `high` + flags `CONCENTRATION_TOP_CLIENT` & `AGED_RECEIVABLES_HIGH` |
| **Studio Pixel**        | loan 20k€      | 58 _medium_ (incomplet) | Bouton « Demander docs » → modale relance → event `relance.sent`, tuiles `unknown` (gating)                                              |
| **Transport Leclerc**   | loan 75k€      | 34 _high_               | Le refus : tuiles `alert` multiples, cross-highlight bullet → tuile, confirmation modale                                                 |

À la fin : `curl http://localhost:3000/api/events | jq` → ≥ 5 types d'events distincts horodatés.

## 5. Mesure (events jour 1)

Chaque interaction (ouverture dossier, ouverture/envoi relance, décision) émet un **event horodaté exportable en JSON** (`GET /api/events`) → la métrique « temps moyen par dossier » (`case.opened`→`decision.made`, collapse `MIN(ts)` par dossier) devient calculable post-démo. Le détail de ce que l'apparatus peut et ne peut **pas** répondre — par métrique de la roadmap — est audité en **[annexe 3](README-annexe-3-audit-instrumentation.md)**.

**Honnêteté méthodo** : aucune baseline n'a été mesurée chez Karmen avant le POC — les chiffres "2h → 21 min" ([détail par étape en annexe 2](README-annexe-2-mesure-cout-trade-offs.md#1-gain-de-temps-par-étape-détail)) sont des hypothèses de cadrage validées en kickoff. Les events permettent précisément de basculer de l'hypothèse à la mesure dès la prochaine session analyste.

## 6. Trade-offs assumés & roadmap

5 trade-offs assumés :

- gating Hybrid Option 2 (data → KPI),
- indicateurs structurés en tuiles vs 1 bandeau d'alertes,
- in-memory (pas d'auth/DB),
- instrumenter avant d'avoir des users,
- enrichissement données factoring (3 indicateurs simulés sur 1 dossier — assumé).

**Roadmap court terme** : mesurer baseline réelle + interviews analystes Q1-Q3 + tests directs `RuleEngine`.  
**Moyen terme** : J3 note IA pré-rédigée (Sonnet 4.x bootstrap, ~75 €/mois @ 4k dossiers, [chiffrage complet annexe 2](README-annexe-2-mesure-cout-trade-offs.md#2-coût-ia--projection-pour-j3-note-pré-rédigée)) + J4 pré-validation no-brainers + 3 règles factoring complémentaires (`CONCENTRATION_TOP_5`, `DEBTOR_PAYMENT_INCIDENTS`, `SECTOR_CONCENTRATION`).  
**Long terme** : OCR réel, Open Banking réel, auth/RBAC/multi-tenant, persistance Postgres, idempotency décisions, audit a11y WCAG.

---

## Démarrage en 30s

```bash
git clone … && cd test-karmen
npm install          # workspaces backend + frontend
npm run dev          # back :3000 + front :5173 en parallèle
# Ouvrir http://localhost:5173
```

Tests : `npm run -w backend test` (12 specs `red-flags` + completeness + decisions). Typecheck : `npm run typecheck`.

---

## Annexes & sources

- **[Annexe 1 — Règles](README-annexe-1-regles.md)** : 10 règles raisonnées, différenciation prêt/factoring (livrée + à ajouter).
- **[Annexe 2 — Mesure, coût IA J3, trade-offs](README-annexe-2-mesure-cout-trade-offs.md)** : gain détaillé par étape, coût IA chiffré, 5 trade-offs, évolutions vs spec, timeline 5 phases, axes d'amélioration complets, out of scope.
- **[Annexe 3 — Audit de l'instrumentation](README-annexe-3-audit-instrumentation.md)** : soundness de l'apparatus de mesure — carte action→event, régimes de calculabilité par métrique, dettes assumées, journal des corrections.
- [PRD](_bmad-output/prd-cockpit-analyste.md) · [Architecture POC](_bmad-output/architecture-poc-karmen.md) · [Specs d'implémentation](_bmad-output/implementation-artifacts/) (figées) · [Fiche finance](_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md)
