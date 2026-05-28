# Karmen — Cadrage : 2h → 30 min par dossier

**Max · 2026-05-26** · Diagnostic et hypothèses validés via kickoff Grégoire.

## 1. Méthode — le socle avant toute ligne de code

Triangulation systématique : 

**(a) voix analystes** (3 interviews + observation directe chronométrée 2 dossiers, junior+senior), 
**(b) data parcours** via outil d'instrumentation Karmen existant (audit baseline en kickoff + complément des trous via events POC dès la 1ère ligne, format compatible avec l'outil existant), 
**(c) hypothèses business** validées en kickoff Grégoire (cf. §2). 
Garde-fous : jugement humain reste roi, IA assistée jamais décisionnelle, instrumentation jour 1.

## 2. Diagnostic (validé Grégoire)

**Ordre chronophagie des 4 étapes :**
1. **Vérification complétude — #1**, génère des allers-retours client par email manuels.
2. **Creuser les données financières — #2**, va-et-vient entre modules sans écran récap.
3. **Rédiger la recommandation — #3 chronophage + LE point de frustration** (interface peu adaptée).
4. **Consulter le scoring** — déjà rapide.

**Distribution bimodale confirmée :** no-brainers ~30 min, complexes jusqu'à 4h.

**Différenciation prêt/affacturage :** faible — mêmes étapes + quelques indicateurs financiers spécifiques affacturage (balance âgée, concentration top client, taux de dilution).

## 3. Avant de coder — questions analystes ciblées temps (3-5 analystes, mix junior/senior)

**Q1.** *"Sur ton dernier dossier 2h, quelles étapes ont été les plus consommatrices ? Où as-tu perdu du temps inutilement ?"*  
**Q2.** *"Qu'est-ce qui fait qu'un dossier prend 30 min plutôt que 4h ? Quel type te plombe, lequel passe sans douleur ?"*  
**Q3.** *"Combien de fois tu rouvres un onglet ou un module déjà consulté ? Dernier cas concret ?"* 

**+ Observation directe chronométrée :** 2 analystes (junior+senior), think-aloud, 60 min/session.

## 4. Roadmap 2h → 30 min (4 jalons, 8 semaines)

| Jalon | Période | Livrable | Voleur attaqué | Gain estimé | Métrique de validation | Questions complémentaires
|---|---|---|---|---|---|---|
| **J1** | S1-S2 | Completeness Engine + Smart Relance IA | Étape 1 (#1) | **-25 min** | % complets au 1er dépôt, nb relances/dossier + Net Promoter Score (NPS) | Quel est actuellement le pourcentage de dossiers qui arrivent incomplet ? Est-ce que les analystes doivent regarder l'ensemble des documents uploadés individuellement pour vérifier la complétude du dossier ? Que se passe-t-il quand un dossier est incomplet ? Est-ce qu'un analyste peut faire des recommandations autres que la demande d'autres documents ?  
| **J2** | S3-S4 | Cockpit unifié adaptatif prêt/affacturage | Étape 3 (#2) | **-45 min** | Nb modules ouverts/dossier, temps cockpit→décision | Que regarde un analyste ? À quelles métriques s'intéresse un analyste ? 
| **J3** | S5-S6 | Note IA pré-rédigée + interface décision rénovée | Étape 4 (#3 + frustration) | **-15 min + adhésion** | Temps rédaction médian, Net Promoter Score (NPS) analyste rédaction | Y a-t-il un format type de réponse actuellement? 
| **J4** | S7-S8 | Pré-validation no-brainers (encadrée, 1 clic, audit trail) | Bimodalité confirmée | **-25 min sur 50% portef = -12 min moy.** | % pré-validés, taux confirmation, taux rouverture | 

**Cumul cible : 120 min → ~30 min**, mesuré via l'outil d'instrumentation Karmen existant (audit kickoff + events POC compatibles).

## 5. POC à coder en premier : **Completeness Engine + Cockpit intégré**

**Pourquoi :** couvre J1 + J2 = les 2 plus gros voleurs (étapes 1+3). Démontre l'**adaptabilité prêt vs affacturage** via Fleurs de Saison (le dossier factoring fourni). Embarque l'**instrumentation events jour 1**, format compatible avec l'outil Karmen existant.

**Métriques de succès POC** (définies avant le code) :
- Détection complétude 100% sur les 2 dossiers incomplets fournis (test unitaire).
- Red flags visibles sur Transport Leclerc (high risk, score 34).
- Sur Fleurs de Saison (factoring) : balance âgée + concentration top client surfacées dans des modules spécifiques.
- ≥5 events distincts instrumentés, exportables en JSON.
- Démo end-to-end < 5 min par dossier.

---
*Cockpit = écran unique agrégeant complétude, score, indicateurs financiers, flux bancaires, red flags. Métaphore standard B2B SaaS (Salesforce Cockpit, Risk Cockpit BNP). Sources détaillées : brainstorming (102 idées), fiche finance, architecture POC dans `_bmad-output/`.*
