---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: "Karmen — réduire le traitement d'un dossier de financement PME par un analyste crédit de 2h à 30min"
session_goals: "Générer un max d'idées sur les 4 étapes du workflow analyste (vérif docs, scoring, va-et-vient modules, note + décision), puis converger sur LE POC à coder (2-3h, React/TS + NestJS) et alimenter un doc cadrage 1 page."
selected_approach: ""
techniques_used: []
ideas_generated: []
context_file: ""
---

# Brainstorming Session Results

**Facilitator:** Max
**Date:** 2026-05-26

## Session Overview

**Topic:** Réduire de 2h à 30min le traitement d'un dossier de financement PME par un analyste crédit chez Karmen (fintech — prêt & affacturage).

**Goals:**
- Générer un large pool d'idées sur les 4 étapes du workflow (divergence radicale avant convergence).
- Filtrer via une grille de garde-fous Product Engineer (inspirée des fiches Dillon Mulroy & Dax Raad — *Chats with Kent S7*).
- Identifier LE POC à coder (front React/TS + back NestJS, 2-3h) qui maximise *Impact × faisabilité × signal envoyé au jury Karmen*.
- Alimenter un doc cadrage 1 page : solutions par goulet, roadmap, questions analystes, choix du POC + pourquoi.

### Context Guidance

**Les 4 étapes du workflow analyste (douleurs à attaquer)** :
1. **Vérification dossier complet** — exige ≥2 liasses fiscales + ≥12 mois de relevés bancaires/compte ; relances client par email manuelles.
2. **Consultation du scoring automatique** — score global + catégorie de risque déjà existants.
3. **Va-et-vient entre modules** — l'analyste navigue d'écran en écran pour creuser les indicateurs financiers.
4. **Rédaction note d'analyse + décision** — approuver / refuser / demander documents complémentaires.

**Garde-fous Product Engineer (grille de filtrage)** :
- Empathie & paper cuts (Dillon) — interview analystes obligatoire.
- Clarté du problème + restraint (Dax) — challenger le « 30 min » : moyenne ? P90 ? segment ?
- Jugement humain reste roi — IA assiste, n'arbitre jamais sur la décision finale.
- Triangulation qualitatif (voix analyste) × quantitatif (product analytics : auditer outil existant OU instrumenter dès le POC).
- Observabilité dès la 1ère ligne du POC (events trackés, métriques de succès définies AVANT le code).
- IA agressive là où pas de goût (OCR, extraction, draft) ; prudente là où il y a goût (jugement, décision).
- UN écran récap, pas un junk drawer — *progressive disclosure*.
- Lent sur la décision, rapide sur l'exécution.
- Pas de « ticket-taking » — on livre une réduction mesurable de douleur, pas une feature.

### Session Setup

**Approche retenue :** Brainstorm en parallèle sur les 4 étapes, séquence imposée par Max :
1. **How Might We** par étape (divergence ciblée).
2. **Reverse Brainstorming** — « comment faire pour qu'un dossier prenne 4h ? » (révèle les frictions invisibles).
3. **Wild Card "et si…"** (orthogonalité forcée).
4. **Convergence** — matrice Impact × Effort × Risque-de-goût → choix du POC.

**Objectif quantité :** 100+ idées avant toute organisation. ✅ **Atteint : 102 idées.**

---

## Phase de divergence — idées générées

### Technique 1 — How Might We

#### Étape 1 — Vérification dossier complet (24)

**Technique**
1. OCR + extraction auto liasses (Textract / Mistral OCR) — check sections clés en 30s.
2. Parsing relevés bancaires multi-formats (PDF, CSV, OFX) — comptage auto 12 mois.
3. Détection trous dans relevés (mois manquant, doublon) avant ouverture analyste.
4. Hash fichier → détection doublons soumis.
5. Connecteurs Open Banking (Bridge, Powens, Budget Insight) — finis les PDFs.
6. API DGFiP / FEC pour récupération liasse fiscale officielle.
7. Validation bloquante côté upload — pas de finalisation si pièces minimales absentes.

**UX**
8. Checklist visuelle complétude côté client (jauge 0-100% temps réel).
9. Email de relance auto-généré et précis (X et Y manquent, pas « complétez »).
10. SMS de relance (~98% taux d'ouverture).
11. Notification WhatsApp.
12. Magic link drag-and-drop (pas de login).
13. Upload mobile par photo (OCR derrière).

**Business / process**
14. Pré-vérification au dépôt initial — bloquante si critique.
15. Score complétude affiché à l'analyste avant ouverture.
16. SLA automatisé — escalade commercial si pas de réponse client X jours.
17. Auto-clôture dossiers fantômes (>30j sans réponse).

**Edge case**
18. Document corrompu/illisible → IA flagge et redemande.
19. Liasse en cours d'exercice → règle d'exception tracée.
20. Compte bancaire <12 mois → règle dérogatoire.
21. Client multi-comptes — check que TOUS les comptes sont couverts.

**Wild**
22. Open Banking 5 min → plus aucun PDF.
23. Agent IA téléphone client pour pièces manquantes.
24. Vocal WhatsApp client → IA structure.

#### Étape 2 — Consultation du scoring (16)

**Technique**
25. Score avec breakdown sous-composantes au survol.
26. Drill-down clickable score → indicateurs sous-jacents.
27. Comparaison portefeuille (top 20% / bas 10%).
28. Historique scores secteur/taille/âge.
29. Confidence interval (72 ±5).
30. SHAP values — features qui poussent le score.

**UX**
31. Feu tricolore visible dès l'ouverture.
32. « Score = X parce que A, B, C » en 3 bullets max.
33. Surlignage composantes >2σ de la médiane sectorielle.
34. Comparaison visuelle dossier-type approuvé/refusé du segment.

**Business**
35. Auto-approbation scores > N.
36. Auto-refus scores < M.
37. Routage différencié junior/senior selon catégorie.

**Edge case**
38. « Scores piégeux » — moyen avec signal fort isolé → flag dédié.
39. Détection incohérences liasse vs relevés (CA déclaré ≠ flux observés).

**Wild**
40. « Second avis IA » qui critique le score auto — anti-confirmation bias.

#### Étape 3 — Va-et-vient entre modules (20)

**Technique**
41. **Decision Cockpit unifié** — UN écran agrège tous les indicateurs.
42. Layout adaptatif selon catégorie de risque.
43. Hotkeys clavier (j/k, A/R).
44. Pré-fetch background — zéro latence.
45. État conservé entre sessions.

**UX**
46. Une seule colonne scrollable : Société → Financier → Bancaire → Score → Note.
47. Tags « anomalie » en tête de section.
48. Heatmap 12 mois trésorerie.
49. Annotations inline.
50. Mode lecture rapide (1 ligne par section, expand à la demande) — progressive disclosure.
51. N/N-1/N-2 côte à côte, pas pages séparées.

**Data viz**
52. Graphes pré-calculés ratios clés (EBE, DSO, levier).
53. Timeline événements (création, alertes, retards).
54. Sparklines par indicateur.

**Business / process**
55. Workflow guidé par checklist (pas free-roaming).
56. Mode comité — préparer dossier pour comité crédit en 1 clic.

**Edge case**
57. Détection auto red flags (DSO>60j, tréso<0 >3 mois, dette/EBE>5x).
58. Dossier similaire suggéré (k-NN portefeuille).

**Wild**
59. Fil narratif IA — dossier raconté en 30s.
60. Mode focus — modules non-pertinents masqués dynamiquement.

#### Étape 4 — Note + décision (16)

**Technique**
61. Template pré-rempli avec données dossier.
62. LLM pré-rédige la note depuis indicateurs surfacés.
63. Phrases-types suggérées (autocomplete Copilot-style).
64. Note structurée 3 sections : Constat / Analyse / Recommandation.
65. Mémoire du style analyste (50 dernières notes).

**UX**
66. Décision en haut — note = argumentation.
67. Boutons Approuver/Refuser/Docs → chacun pré-remplit template.
68. « Demander docs » → liste cochable → email auto.
69. Note dictée à l'oral, IA structure.
70. Note MVP : 3 phrases obligatoires, reste optionnel.

**Business**
71. Auto-décision no-brainers (score>X + complétude 100% + zéro red flag).
72. Pré-comité avec note + reco déjà rédigées.

**Edge case**
73. Détection incohérence note ↔ décision.
74. Précédents similaires suggérés.

**Wild**
75. Note s'écrit en observant le parcours de l'analyste.
76. Audit trail = note : checkboxes + 1 phrase.

### Technique 2 — Reverse Brainstorming (« comment prendre 4h »)

77. Scans N&B basse résolution un par un.
78. Ne pas dire au client ce qui manque.
79. 14 modules sans récap unifié.
80. Re-saisie manuelle d'infos déjà dans le scoring.
81. Template note différent par dossier.
82. Réécriture from scratch à chaque note.
83. Score caché derrière 3 clics.
84. Pas de SSOT — données contradictoires entre modules.
85. Recalcul manuel des ratios dans Excel.
86. Zéro raccourci clavier.
87. Reload complet à chaque navigation.
88. Notifications qui cassent le flow.
89. Pas d'historique de session.
90. Téléchargement obligatoire des PDFs dans viewer externe.

→ Chaque ligne, retournée, = feature à construire.

### Technique 3 — Wild Card « et si… »

91. Batch de 20 dossiers similaires plutôt qu'un par un.
92. Résumé exécutif IA lu en 2 min par dossier.
93. IA pré-analyse la nuit les dossiers du lendemain.
94. Analyste n'écrit jamais — mémo vocal + IA structure.
95. Client pré-rédige sa propre note (sous contrôle).
96. Copilote analyste dans une oreillette (aviation-style).
97. Tout dossier >30 min → rétro auto pour identifier la friction.
98. Chrome extension qui injecte un cockpit dans l'UI existante.
99. Trois analystes co-analysent en 15 min de stand-up.
100. Support client + analyste sur le même outil.
101. Chaque red flag → question auto au client.
102. IA propose 3 décisions plausibles, analyste arbitre en 1 clic + justification courte.

---

## Phase de convergence

### Filtrage par garde-fous PE + data fournie

Idées éliminées :
- **Hors data fournie** : #1, #2, #30, #39, #48, #52-54, #28 (pas de PDFs, transactions, modèle scoring).
- **Viole "jugement humain reste roi"** : #35, #36 (auto-décision pure), #71 si sans humain.
- **Risque-de-goût trop élevé** : #96 (oreillette IA), #75 (note depuis souris).
- **Hors timebox 2-3h** : #22, #23, #91, #94, #98, #99, #100.
- **Plus process que POC** : #16, #17, #37, #56.

**Reste : ~55 idées implémentables et alignées PE.**

### Clusterisation en 5 POCs candidats

- **POC-A** Completeness Engine + Smart Relance (étape 1)
- **POC-B** Decision Cockpit unifié (étape 3)
- **POC-C** AI Note Drafter + Decision Helper (étape 4)
- **POC-D** Combo Cockpit + Completeness intégré (étapes 1 + 3)
- **POC-E** Observability Foundation (orthogonal)

### Matrice de scoring (1-5, pondérée)

| Critère | Poids | A | B | C | D | E |
|---|---|---|---|---|---|---|
| Impact 2h→30min | ×3 | 4 | 5 | 3 | 5 | 2 |
| Effort 2-3h | ×3 | 5 | 3 | 3 | 3 | 4 |
| Risque-de-goût (inversé) | ×2 | 5 | 4 | 2 | 4 | 5 |
| Wow factor démo | ×2 | 3 | 5 | 4 | 5 | 2 |
| Signal Product Engineer | ×3 | 4 | 4 | 3 | 5 | 5 |
| Exploitation data fournie | ×2 | 5 | 4 | 3 | 5 | 3 |
| **TOTAL** | | 63 | 62 | 49 | **🏆 73** | 53 |

### Verdict

**POC retenu : D — Cockpit Analyste avec Completeness intégré.**

Raisons :
1. Couvre les 2 plus gros voleurs de temps (étapes 1 + 3).
2. Démo end-to-end visuellement forte.
3. Exploite à 100% les 4 dossiers test (diversité voulue).
4. Signal PE max : restraint + IA dosée + instrumentation dès la 1ère ligne.

### Scope (in / out)

**IN** : liste dossiers, cockpit unifié, completeness engine, score card, red flags, draft email relance IA, boutons décision, instrumentation events.

**OUT** : OCR liasses (Holofin), Open Banking (Bridge), auth, RBAC, scoring engine, DB, tests E2E exhaustifs.

### Métriques de succès POC

- Temps simulé < 5 min par dossier (4 dossiers démo).
- Détection complétude 100% sur les 2 dossiers incomplets (test unitaire).
- Red flags visibles sur Transport Leclerc.
- ≥5 events distincts instrumentés.

### Enrichissement schéma data

Ajout `financialIndicators` (issu liasse fiscale) + `bankFlows` (issu Open Banking) cohérents avec chaque `risk_bucket`.

**Convention :** `data/raw/` (fichiers fournis intacts) + `data/augmented/` (fichiers enrichis pour le POC).

---

## Livrables produits suite à cette session

1. `README.md` §2 (Méthode de cadrage) — intégré au README principal (anciennement `_bmad-output/cadrage-karmen-1-page.md`).
2. `_bmad-output/architecture-poc-karmen.md` — Architecture technique POC.
3. `data/raw/*.json` — Fichiers fournis originaux.
4. `data/augmented/*.json` — Fichiers enrichis pour le POC.
5. `_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md` — Fiche pédagogique de référence.

