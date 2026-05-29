# Annexe 3 — Audit de l'instrumentation (soundness de l'apparatus de mesure)

> Complément au [README](README.md) §5 (Mesure). Lecture isolée possible.
>
> **Posture.** Le POC ne prétend **pas** _démontrer_ la réduction « 2h → 21 min » — avec un échantillon de **1 utilisateur en démo, toute mesure est statistiquement nulle**, et aucune baseline n'a été collectée (cf. README §5). Cette annexe prouve l'autre chose : que **l'apparatus de mesure est sain** — chaque événement émis correspond à une action analyste réelle, et on sait exactement quelle métrique de la roadmap il permet (ou non) de calculer.

---

## 1. Taxonomie actuelle (après audit)

| Event                       | Émis par    | `caseId` | Payload                                   | Action analyste                                        |
| --------------------------- | ----------- | -------- | ----------------------------------------- | ------------------------------------------------------ |
| `case.list.viewed`          | front       | –        | `{ count }`                               | Arrivée sur la liste                                   |
| `case.opened`               | front       | ✓        | –                                         | Ouverture d'un dossier (début chrono cockpit→décision) |
| `follow-up.modal.opened`    | front       | ✓        | –                                         | Ouverture modale relance                               |
| `follow-up.draft.generated` | front       | ✓        | `{ missingCount }`                        | Brouillon de relance généré                            |
| `follow-up.sent`            | front       | ✓        | `{ subject, bodyLength }`                 | Envoi de la relance                                    |
| `decision.made`             | **serveur** | ✓        | `{ decision, justification, status }`     | Verdict (artefact terminal)                            |
| `http.request`              | **serveur** | –        | `{ method, path, status }` + `durationMs` | Latence serveur (ops, pas comportement analyste)       |

Les deux events serveur sont annotés `server-side only` dans `frontend/src/shared/lib/track.ts` : le client ne les émet jamais, ils sont déclarés côté front uniquement pour garder la taxonomie cross-stack complète.

---

## 2. Carte action analyste → event (pertinence)

L'apparatus est _pertinent_ si chaque action décisionnelle émet un event, et si chaque event correspond à une action réelle. Audit du surface interactif du cockpit :

| Action analyste                                 | Event ?                   | Verdict                                                                                                                                                                                                      |
| ----------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Voir la liste                                   | `case.list.viewed`        | ✓ couvert                                                                                                                                                                                                    |
| Ouvrir un dossier                               | `case.opened`             | ✓ couvert                                                                                                                                                                                                    |
| Générer / envoyer une relance                   | `follow-up.*`             | ✓ couvert                                                                                                                                                                                                    |
| Approuver / refuser / demander docs             | `decision.made` (serveur) | ✓ couvert                                                                                                                                                                                                    |
| Replier / déplier une section                   | —                         | **angle mort assumé** (voir §4)                                                                                                                                                                              |
| Survoler un popover méthodo (seuil/formule)     | —                         | angle mort assumé                                                                                                                                                                                            |
| Cross-highlight bullet score → tuile            | —                         | **non instrumenté — jugé non pertinent** : micro-interaction d'UI (ne change aucun état, ne produit aucun artefact, ne marque aucune étape). C'est de l'engagement feature, pas un signal de la thèse temps. |
| Annuler dans la modale de confirmation de refus | —                         | angle mort assumé (signal d'hésitation perdu)                                                                                                                                                                |

**Event vestigial supprimé.** `cockpit.section.expanded` a été **retiré** de la taxonomie (front + back) et son appel `track()` supprimé. Après le refacto du cockpit en grille plate, `CollapsibleSection` ne subsiste que sur la complétude, rendue `defaultOpen` — or `onOpenChange` ne se déclenche pas au montage. L'event ne pouvait donc se produire **que si l'analyste repliait puis redépliait la complétude** : un geste inversé, quasi-inexistant. Il portait en plus une métrique morte (voir §3, « Nb modules ouverts »).

---

## 3. Métrique roadmap → régime de calculabilité

L'audit ne se résume pas à « calculable / pas calculable » : il y a **trois régimes** selon la source de données nécessaire.

| Métrique (README §2)           | Jalon  | Régime                          | Détail                                                                                                                                                                         |
| ------------------------------ | ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nb relances/dossier**        | J1     | ✅ **events seuls**             | `COUNT(follow-up.sent)` group by `caseId`                                                                                                                                      |
| **Temps cockpit→décision**     | J2     | ✅ **events seuls**             | `case.opened` → `MIN(decision.made.ts)` par `caseId` (collapse, voir §4)                                                                                                       |
| **% complets au 1er dépôt**    | J1     | ⚠️ **jointure event ↔ dossier** | `isComplete` est calculé server-side (`CompletenessEngine`) et exposé via `GET …/cockpit`, mais **aucun event ne le transporte**. Non calculable depuis le flux d'events seul. |
| **NPS analyste**               | J1/J3  | 🔌 **instrument externe**       | Pas un event in-app : nécessite un sondage. Correctement hors apparatus.                                                                                                       |
| ~~Nb modules ouverts/dossier~~ | ~~J2~~ | ❌ **obsolété**                 | Le refacto grille plate a supprimé les modules repliables que la métrique comptait. Retirée du README §2. Le signal J2 survivant est _temps cockpit→décision_.                 |

---

## 3bis. Mode opératoire : calculer le temps par dossier

Le POC ne sert pas un temps tout fait — il sert la **matière première horodatée**. Reconstitution en post-traitement à partir de `GET /api/events` (tableau de `{ ts, type, caseId, … }`).

**Principe.** Par `caseId` : borne de début = `case.opened.ts`, borne de fin = `MIN(decision.made.ts)` (règle de collapse, §4.1). Durée = fin − début. Agrégat métier = **médiane** sur les dossiers (pas la moyenne : distribution bimodale, README §1).

```bash
curl -s localhost:3000/api/events | jq '
  [.[] | select(.caseId)] | group_by(.caseId)
  | map({ caseId: .[0].caseId,
          o: ([.[]|select(.type=="case.opened").ts]|min),
          d: ([.[]|select(.type=="decision.made").ts]|min) }
        | select(.o and .d) | {caseId, minutes: ((.d-.o)/60000)})'
```

**Ce que ce chiffre est** : un wall-clock _première-ouverture → première-décision_. **Ce qu'il n'est pas**, et qui doit être dit explicitement :

| Limite                                                         | Conséquence                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| Pas de temps _actif_ (aucun event focus/blur/heartbeat — §4.3) | Un dossier laissé ouvert gonfle la durée                           |
| Aucune identité analyste dans les events                       | « par analyste » et split junior/senior **impossibles à ce stade** |
| n = 1 en démo                                                  | Mesure statistiquement nulle — prouve le _pipeline_, pas le gain   |

**Pour passer de « calculable » à « mesure analyste fiable »** (ordre = cycle mesure, README §6) : (1) ajouter un `sessionId`/`analystId` sur chaque event → débloque le « par analyste » ; (2) events focus/blur → temps actif ; (3) persistance Postgres → agrégat multi-session ; (4) baseline « avant » (interviews + chronométrage, README §2a) pour avoir un point de comparaison.

---

## 4. Décisions de soundness & dettes documentées (non construites)

Choix assumés, **pas** des oublis. Construire ces items maintenant contredirait soit la roadmap (out-of-scope), soit le timebox POC.

1. **`decision.made` est append-only.** Un dossier peut porter plusieurs `decision.made` (retry après erreur ; progression `request_docs` → `approve`). C'est la **bonne propriété d'un journal d'audit** — on trace chaque tentative, on n'écrase pas. _Exigence de soundness_ : toute métrique de durée doit **collapse via `MIN(ts)` par `caseId`** (time-to-first-disposition). L'idempotency des décisions est déjà cadrée **out-of-scope long-terme** (README §6).

2. **Source de vérité dupliquée (front ↔ back).** Les deux unions `EventType` sont des miroirs recopiés à la main. Dérive **constatée et corrigée** dans cet audit : le front émettait `cases.list.viewed` (pluriel) alors que le back déclarait `case.list.viewed`. _Fix durable_ : un type partagé importé des deux côtés. Différé (touche au build des deux workspaces — yak-shaving pour un POC).

3. **Angles morts d'instrumentation assumés** : repli/dwell-time de section, hover popover méthodo, cross-highlight bullet→tuile (§2), annulation de la modale de refus. Tous instrumentables en une ligne `track()` — non faits car aucun ne sert la thèse temps, et instrumenter une mesure non validée par un analyste réel rejouerait précisément le travers évité (mesurer ce qu'on ne peut pas encore valider).

4. **Divergences de documentation taxonomique** :
   - `_bmad-output/architecture-poc-karmen.md` §8 : **resynchronisé** dans cet audit sur la taxonomie courante (il était antérieur au rename `dossier→case` / `relance→follow-up`, commit 9ffe046).
   - `_bmad-output/implementation-artifacts/spec-relances-decisions-events.md` : **figée par design** (`<frozen-after-approval>` + Spec Change Log append-only) — référence encore `cockpit.section.expanded` et l'ancien nommage. La divergence avec le code livré est **attendue et assumée** ; les évolutions vivent dans le PRD et l'architecture (cf. annexe 2 §4).

---

## 5. Journal des corrections appliquées dans cet audit

| #   | Défaut                                                                                                                                                                   | Type                            | Correction                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `cases.list.viewed` (front) ≠ `case.list.viewed` (back)                                                                                                                  | Correctness (drift)             | Front aligné sur `case.list.viewed` (`track.ts`, `case-list.tsx`)                                                                                                                        |
| 2   | `decision.made` annoncé côté front sans être émis par le front                                                                                                           | Correctness (taxonomie honnête) | Annoté `server-side only` dans `track.ts` (idem `http.request`)                                                                                                                          |
| 3   | `cockpit.section.expanded` vestigial + métrique « modules ouverts » morte                                                                                                | Pertinence                      | Event supprimé (front + back + `track()`), README §2/§3/§5 corrigés                                                                                                                      |
| 4   | `decision.made` doublonnable                                                                                                                                             | Sémantique                      | Append-only assumé + règle de collapse `MIN(ts)` documentée (ci-dessus §4.1)                                                                                                             |
| 5   | `sendBeacon` droppait silencieusement les events front (Blob `application/json` non CORS-safelisted : `true` = « mis en file » ≠ livré, fallback `fetch` jamais atteint) | Correctness (livraison)         | `sendBeacon` supprimé, `fetch` keepalive en chemin unique (`track.ts`). Démasqué par test live ; `temps cockpit→décision` était incalculable sans ça (borne `case.opened` jamais livrée) |
