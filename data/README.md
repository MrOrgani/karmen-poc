# Données — POC Karmen

## Structure

```
data/
├── raw/         ← Fichiers fournis intacts par Karmen (4 dossiers de financement)
└── augmented/   ← Fichiers enrichis pour le POC (schéma raw + indicateurs financiers)
```

## Pourquoi cette séparation ?

**Transparence** : on ne touche jamais aux données sources. Le POC consomme `augmented/`, mais le diff entre `raw/` et `augmented/` montre exactement ce qui a été simulé et pourquoi.

## Enrichissement appliqué

Deux sous-objets ajoutés à chaque dossier :

### `financialIndicators` — extrait OCR de la liasse fiscale (simulé)
- `revenue` (€) — Chiffre d'affaires N
- `revenuePreviousYear` (€) — CA N-1 (issu de la 2ᵉ liasse exigée par Karmen)
- `ebitda` (€) — Excédent Brut d'Exploitation
- `netIncome` (€) — Résultat net
- `totalDebt` (€) — Dette financière totale
- `cashPosition` (€) — Trésorerie disponible
- `dso` (jours) — Days Sales Outstanding

> En production, ces données proviennent d'un OCR de la liasse fiscale via des services type [Holofin](https://holofin.ai/fr/solutions/extraction-liasse-fiscale/) ou [Dataleon](https://www.dataleon.ai/en/technologies/ocr-api-tax-bundle) (97%+ de précision).

### `bankFlows` — agrégat Open Banking (simulé)
- `monthlyInflowsAverage` (€/mois)
- `monthlyOutflowsAverage` (€/mois)
- `overdraftDaysLast12m` — Nombre de jours en découvert sur 12 mois
- `rejectedPaymentsCount` — Nombre de rejets de paiement

> Karmen consomme déjà l'Open Banking (PSD2) via des agrégateurs type Bridge / Powens — c'est documenté publiquement sur leur site et dans leurs interviews fintech.

## Cohérence des chiffres avec `risk_bucket`

| Dossier | risk_bucket | Dette/EBITDA | Marge EBITDA | Découverts 12m | Signal |
|---|---|---|---|---|---|
| Brasserie du Marais | low (82) | 0.75× | 14.3% | 5j | 🟢 Profil sain |
| Fleurs de Saison | medium (67) | 1.25× | 12.6% | 15j | 🟡 Tendu mais viable, saisonnier |
| Studio Pixel | medium (58) | 3.13× | 6.7% | 45j | 🟠 CA en déclin, tréso fragile |
| Transport Leclerc | high (34) | 11.2× | 2.9% | 75j | 🔴 Surendettement, marge dangereuse |

## Référence pédagogique

Pour comprendre chaque indicateur : `_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md`
