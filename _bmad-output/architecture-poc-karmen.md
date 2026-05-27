# Architecture technique — POC Karmen "Cockpit Analyste"

**Stack imposée :** Front React/TypeScript · Back NestJS · Repo GitHub avec README clair.
**Timebox :** 2-3h de code.
**Périmètre :** POC fonctionnel démo-able, **pas un produit prod**.

---

## 1. Vision en une phrase

> Un seul écran qui agrège, pour chaque dossier de financement, sa **complétude documentaire**, son **score de risque**, ses **indicateurs financiers clés**, ses **red flags détectés automatiquement**, et permet de **demander des pièces manquantes** ou **prendre une décision** — le tout instrumenté pour mesurer le temps réel de traitement.

---

## 2. Arborescence du repo

```
test-karmen/
├── README.md                       ← démarrage en 30s, scope IN/OUT, captures
├── data/
│   ├── raw/                        ← dossiers fournis intacts
│   │   ├── brasserie-du-marais.json
│   │   ├── fleurs-de-saison.json
│   │   ├── studio-pixel.json
│   │   └── transport-leclerc-express.json
│   └── augmented/                  ← schéma enrichi pour le POC
│       ├── brasserie-du-marais.json
│       ├── fleurs-de-saison.json
│       ├── studio-pixel.json
│       └── transport-leclerc-express.json
├── backend/                        ← NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── dossiers/
│   │   │   ├── dossiers.controller.ts
│   │   │   ├── dossiers.service.ts
│   │   │   ├── dossiers.repository.ts   ← lecture des JSON augmented
│   │   │   └── dto/
│   │   │       └── cockpit-response.dto.ts
│   │   ├── completeness/
│   │   │   ├── completeness.service.ts  ← règles ≥2 liasses, ≥12 mois/compte
│   │   │   └── completeness.spec.ts     ← tests unitaires
│   │   ├── red-flags/
│   │   │   └── red-flags.service.ts     ← règles DSO>60, debt/EBITDA>5, découverts>30j…
│   │   ├── relances/
│   │   │   ├── relances.controller.ts
│   │   │   └── relances.service.ts      ← draft email (LLM réel ou mock)
│   │   ├── decisions/
│   │   │   └── decisions.controller.ts  ← POST simple, log en console
│   │   └── observability/
│   │       ├── tracking.middleware.ts   ← log chaque request + duration
│   │       └── events.controller.ts     ← GET /events pour exporter
│   ├── package.json
│   └── tsconfig.json
├── frontend/                       ← React/TypeScript + Vite
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── DossiersListPage.tsx     ← liste des 4 dossiers avec badge complétude
│   │   │   └── CockpitPage.tsx          ← écran unique scrollable
│   │   ├── components/
│   │   │   ├── CompletenessSection.tsx  ← progress + liste pièces manquantes
│   │   │   ├── ScoreCard.tsx            ← feu tricolore + 3 bullets explication
│   │   │   ├── FinancialIndicators.tsx  ← CA, EBITDA, dette/EBITDA, DSO…
│   │   │   ├── BankFlowsCard.tsx        ← découverts, rejets
│   │   │   ├── RedFlagsBanner.tsx       ← bandeau anomalies en tête
│   │   │   ├── RelanceModal.tsx         ← email pré-rédigé éditable
│   │   │   └── DecisionPanel.tsx        ← 3 boutons + justification courte
│   │   ├── lib/
│   │   │   ├── api.ts                   ← fetch wrapper
│   │   │   └── track.ts                 ← événements analytics (console.log + POST)
│   │   └── styles/
│   │       └── tailwind.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── _bmad-output/                   ← docs cadrage, brainstorming, fiche finance
└── package.json (optionnel monorepo)
```

---

## 3. Schéma de données — `data/augmented/*.json`

```typescript
type AugmentedDossier = {
  company: {
    id: string;
    name: string;
    siren: string;
    businessType: string;
    legalCategory: string;
    codeNaf: string;
    creationDate: string;
    address: string;
    countryCode: string;
    postalCode: string;
    owner: string;
  };
  financing_request: {
    id: string;
    type: 'loan' | 'factoring';
    status: 'pending_review' | 'approved' | 'rejected' | 'awaiting_documents';
    company_id: string;
    fundUsage: string;
    rejectedReason: string | null;
    amount: number;
    durationInMonth: number;
    interestRate: number;
  };
  documents: Array<{
    id: string;
    name: string;
    type: 'liasse_fiscale' | 'releve_bancaire';
    company_id: string;
    financing_request_id: string;
    metadata: {
      year?: number;          // pour liasse_fiscale
      bank?: string;           // pour releve_bancaire
      account?: string;        // IBAN
      months_covered?: number;
    };
  }>;
  score: {
    id: string;
    financing_request_id: string;
    risk_bucket: 'low' | 'medium' | 'high';
    global_score: number;
  };
  // ─── Enrichissement POC ─────────────────────────────
  financialIndicators: {        // extrait OCR liasse fiscale (simulé)
    revenue: number;            // CA N (€)
    revenuePreviousYear: number;
    ebitda: number;
    netIncome: number;
    totalDebt: number;
    cashPosition: number;
    dso: number;                // jours
  };
  bankFlows: {                  // agrégat Open Banking (simulé)
    monthlyInflowsAverage: number;
    monthlyOutflowsAverage: number;
    overdraftDaysLast12m: number;
    rejectedPaymentsCount: number;
  };
};
```

---

## 4. Endpoints API NestJS

| Méthode | Route | Description | Response |
|---|---|---|---|
| `GET` | `/dossiers` | Liste les 4 dossiers + badge complétude | `Array<{id, companyName, type, amount, riskBucket, completenessScore}>` |
| `GET` | `/dossiers/:id/cockpit` | **L'endpoint roi** — agrège tout pour l'écran cockpit | `CockpitResponseDto` |
| `POST` | `/relances/draft` | Génère le brouillon d'email de relance (LLM ou mock) | `{ subject, body, missingDocs: string[] }` |
| `POST` | `/decisions` | Enregistre une décision (log console pour POC) | `{ ok: true, decision, dossierId }` |
| `GET` | `/events` | Exporte les events trackés | `Array<{ts, type, dossierId, durationMs?}>` |

### `CockpitResponseDto` (structure consolidée)

```typescript
type CockpitResponse = {
  dossier: AugmentedDossier;
  completeness: {
    score: number;          // 0-100
    isComplete: boolean;
    missing: Array<{
      type: 'liasse_fiscale' | 'releve_bancaire';
      reason: string;       // ex: "Seulement 10 mois sur 12 pour LCL"
      details?: Record<string, unknown>;
    }>;
  };
  redFlags: Array<{
    severity: 'low' | 'medium' | 'high';
    code: string;           // ex: "DEBT_TO_EBITDA_HIGH"
    label: string;
    value: string;          // ex: "11.2× (seuil critique > 5×)"
  }>;
  scoreExplanation: {
    bullets: string[];      // 3 phrases max
  };
};
```

---

## 5. Règles métier — Completeness Engine

```typescript
// completeness.service.ts (pseudo)
const RULES = {
  loan: {
    liasseFiscaleMinCount: 2,
    minMonthsPerBankAccount: 12,
  },
  factoring: {
    liasseFiscaleMinCount: 2,
    minMonthsPerBankAccount: 12,
  },
};

function checkCompleteness(dossier): CompletenessResult {
  const requirements = RULES[dossier.financing_request.type];
  const missing = [];

  const liasses = dossier.documents.filter(d => d.type === 'liasse_fiscale');
  if (liasses.length < requirements.liasseFiscaleMinCount) {
    missing.push({
      type: 'liasse_fiscale',
      reason: `${liasses.length}/${requirements.liasseFiscaleMinCount} liasses fournies`,
    });
  }

  // par compte bancaire distinct (account)
  const releves = dossier.documents.filter(d => d.type === 'releve_bancaire');
  const byAccount = groupBy(releves, r => r.metadata.account);
  for (const [account, docs] of byAccount) {
    const months = docs[0].metadata.months_covered ?? 0;
    if (months < requirements.minMonthsPerBankAccount) {
      missing.push({
        type: 'releve_bancaire',
        reason: `Seulement ${months} mois sur ${requirements.minMonthsPerBankAccount} pour ${docs[0].metadata.bank}`,
        details: { account, bank: docs[0].metadata.bank, monthsProvided: months },
      });
    }
  }

  const completedItems = (1 + Object.keys(byAccount).length) - missing.length;
  const totalItems = 1 + Object.keys(byAccount).length;
  const score = Math.round((completedItems / totalItems) * 100);

  return { score, isComplete: missing.length === 0, missing };
}
```

---

## 6. Règles métier — Red Flag Detector

| Code | Condition | Sévérité |
|---|---|---|
| `DEBT_TO_EBITDA_HIGH` | `totalDebt / ebitda > 5` | high |
| `DEBT_TO_EBITDA_MEDIUM` | `totalDebt / ebitda` entre 3 et 5 | medium |
| `EBITDA_MARGIN_LOW` | `ebitda / revenue < 0.05` | high |
| `NEGATIVE_NET_INCOME` | `netIncome < 0` | medium |
| `REVENUE_DECLINING` | `revenue < revenuePreviousYear * 0.9` | medium |
| `OVERDRAFT_DAYS_HIGH` | `overdraftDaysLast12m > 30` | high |
| `REJECTED_PAYMENTS` | `rejectedPaymentsCount > 0` | medium |
| `LOW_CASH_POSITION` | `cashPosition < monthlyOutflowsAverage` | medium |
| `DSO_LONG` | `dso > 60` | medium (info pour factoring) |

---

## 7. Frontend — composition de l'écran cockpit

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Tous les dossiers                              [👤 Analyste]  │
│                                                                 │
│ Brasserie du Marais · SARL · Restaurant · SIREN 823456789       │
│ Prêt 35 000€ · 12 mois · 5.2%                                   │
├─────────────────────────────────────────────────────────────────┤
│ 📁 COMPLÉTUDE — 100% ✅                          [Voir détail]  │  ← progressive disclosure
├─────────────────────────────────────────────────────────────────┤
│ 🚨 ANOMALIES DÉTECTÉES (3)                          [Détailler] │  ← collapsible
│  • Dette/EBITDA = 11.2× (seuil critique > 5×)                   │
│  • Marge EBITDA = 2.9% (faible)                                 │
│  • Découverts : 75 jours sur 12 mois                            │
├─────────────────────────────────────────────────────────────────┤
│ 🎯 SCORE — 82 / 100 · LOW RISK 🟢                               │
│ Pourquoi :                                                      │
│  • Rentabilité opérationnelle correcte (14% marge EBITDA)       │
│  • Endettement absorbable (0.75 an d'EBITDA)                    │
│  • Trésorerie saine et flux bancaires sans anomalie             │
├─────────────────────────────────────────────────────────────────┤
│ 💼 SANTÉ FINANCIÈRE                              [Voir détail]  │
│  CA 2024 : 280k€ (+14% vs 2023)    EBITDA : 40k€ (14%)          │
│  Résultat net : 23k€               Trésorerie : 18.5k€          │
│  Dette : 30k€                      Dette/EBITDA : 0.75×         │
│  DSO : 10j                                                      │
├─────────────────────────────────────────────────────────────────┤
│ 🏦 FLUX BANCAIRES (12 mois)                                     │
│  Entrées moy : 24k€/mois           Sorties moy : 22.5k€/mois    │
│  Découverts : 5 jours              Rejets : 0                   │
├─────────────────────────────────────────────────────────────────┤
│ 📝 DÉCISION                                                     │
│  [ ✅ Approuver ]  [ ❓ Demander docs ]  [ ❌ Refuser ]         │
│  Justification (1 phrase suffit) : __________________________   │
└─────────────────────────────────────────────────────────────────┘
```

### Comportements de progressive disclosure

- Au chargement : sections **collapsed** par défaut sauf **Complétude** + **Anomalies** + **Décision**. La Complétude vient en tête : décider du gating documentaire prime sur l'analyse des risques (qui suppose des données complètes).
- Clic sur "Voir détail" : expansion inline.
- Si `completeness.isComplete = false` → bouton "Demander docs" mis en avant, modal s'ouvre avec email pré-rédigé.

---

## 8. Instrumentation (observabilité jour 1)

### Côté frontend (`lib/track.ts`)

```typescript
type EventType =
  | 'dossier.list.viewed'
  | 'dossier.opened'
  | 'cockpit.section.expanded'
  | 'relance.modal.opened'
  | 'relance.draft.generated'
  | 'relance.sent'
  | 'decision.made';

export function track(type: EventType, payload?: Record<string, unknown>) {
  const event = { ts: Date.now(), type, ...payload };
  console.log('[track]', event);
  fetch('/api/events', { method: 'POST', body: JSON.stringify(event) });
}
```

### Côté backend (`tracking.middleware.ts`)

Middleware NestJS qui log chaque request avec sa duration. Endpoint `GET /events` qui dump le tout en JSON (in-memory pour le POC).

### Cible démo

Au moins **5 events distincts** trackés. À la fin de la démo, on peut **télécharger un JSON** des events → métrique « temps moyen par dossier » calculable en post-traitement.

---

## 9. Choix techniques justifiés

| Choix | Justification |
|---|---|
| **Vite + React** | Démarrage frontend en 1 commande, dev server instantané |
| **Tailwind CSS** | Stack utilisateur (CLAUDE.md le précise), itération UI rapide |
| **NestJS** | Stack imposée par le test |
| **In-memory data** | Pas de DB nécessaire pour 4 dossiers — lecture directe des JSON via `fs` |
| **LLM mocké par défaut** | Garantit que le POC tourne sans clé API, branchement réel documenté en commentaire |
| **Pas d'auth** | Hors scope POC, sera mis en avant comme "OUT" dans le README |
| **Tests unitaires uniquement sur `CompletenessChecker`** | Signal de rigueur sans exploser le timebox |
| **Monorepo npm workspaces** (optionnel) | Démarrage simplifié `npm install && npm run dev` lance front + back |

---

## 10. Plan d'exécution 2-3h

| Bloc | Durée | Objectif |
|---|---|---|
| Setup repo + Nest + Vite + Tailwind | 20 min | Squelette qui tourne |
| `data/raw` + `data/augmented` (4 fichiers enrichis) | 15 min | Datasets prêts |
| `CompletenessChecker` + test unitaire | 25 min | Première feature solide + signal qualité |
| `RedFlagDetector` + `CockpitResponseDto` | 20 min | Endpoint roi opérationnel |
| Frontend : routing + `DossiersListPage` | 20 min | Liste + navigation |
| Frontend : `CockpitPage` + sections | 50 min | Le gros de l'écran |
| `RelanceModal` + mock LLM | 20 min | Email pré-rédigé démo-able |
| Instrumentation (track côté front, middleware back, endpoint events) | 15 min | Observability jour 1 |
| README + captures écran + brancher tout ensemble | 25 min | Polish & démarrage |
| **Total** | **~3h30** | Légèrement au-dessus, à ajuster en coupant les détails UI |

> ⚠️ **Si dépassement** : couper l'instrumentation backend (garder uniquement console.log côté front) et le test unitaire (en garder un seul).

---

## 11. README cible (squelette)

```markdown
# Karmen — POC Cockpit Analyste

## Démarrage en 30s
git clone … && cd test-karmen
npm install && npm run dev          ← lance back (3000) + front (5173)
ouvrir http://localhost:5173

## Stack
React/TS · Vite · Tailwind · NestJS · TypeScript · in-memory data

## Scope IN
[liste des features implémentées]

## Scope OUT (assumé)
- OCR liasses (Holofin/Dataleon en prod)
- Open Banking (Bridge/Powens en prod — déjà chez Karmen)
- Auth, RBAC, multi-tenant
- Moteur de scoring (existe chez Karmen)
- Persistance DB
- Tests E2E exhaustifs (1 test unitaire stratégique uniquement)

## Données
- data/raw/ : fichiers fournis intacts
- data/augmented/ : schéma enrichi (financialIndicators + bankFlows) — détail dans cadrage 1 page

## Métriques POC
- Détection complétude 100% sur les 2 dossiers incomplets (test unitaire)
- Red flags visibles sur Transport Leclerc
- ≥5 events instrumentés
- Démo < 5 min par dossier

## Captures
[captures écran de la liste + cockpit]
```
