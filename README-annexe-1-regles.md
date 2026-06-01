# Annexe 1 — Le `RuleEngine` : pourquoi _ces_ 10 règles, et ce qu'on ajouterait

> Complément au [README](README.md). Lecture isolée possible.

---

## Pourquoi _ces_ 10 règles ?

Le `RuleEngine` n'invente rien : il code le **socle commun d'analyse crédit PME** issu de la [fiche finance](_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md). Quatre angles d'analyse, déclinés en 10 indicateurs :

| Angle d'analyse                | Question implicite                                         | Règles                                                                      |
| ------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Solvabilité / endettement**  | L'entreprise est-elle déjà trop endettée pour rembourser ? | `DEBT_TO_EBITDA_HIGH` (>5×), `DEBT_TO_EBITDA_MEDIUM` (3-5×)                 |
| **Rentabilité opérationnelle** | Le métier dégage-t-il assez de cash pour servir la dette ? | `EBITDA_NEGATIVE_OR_ZERO`, `EBITDA_MARGIN_LOW` (<5%), `NEGATIVE_NET_INCOME` |
| **Dynamique commerciale**      | L'activité progresse ou régresse ?                         | `REVENUE_DECLINING` (-10% N/N-1), `DSO_LONG` (>60j)                         |
| **Comportement bancaire**      | Les flux réels confirment-ils la santé déclarée ?          | `OVERDRAFT_DAYS_HIGH` (>30j), `REJECTED_PAYMENTS`, `LOW_CASH_POSITION`      |

Chacune répond à une question qu'un analyste pose **de toute façon**, prêt ou factoring. La première question d'un dossier crédit, c'est _« cette PME tient debout ? »_, pas _« quel produit on lui vend ? »_.

---

## Différenciation prêt / factoring — ce qui est livré

Le `RuleEngine` lit `financing_request.type` et applique 2 mécanismes :

**(a) Pondération variable du `DSO_LONG`** :

- **Prêt** : `severity: 'medium'` — informatif, le DSO long pèse sur le BFR mais pas directement sur le remboursement.
- **Factoring** : `severity: 'high'` — les créances financées seront lentes à recouvrer → durée d'immobilisation des fonds Karmen + pression directe sur la rentabilité de l'opération.

**(b) 3 règles `category: 'factoring'`** activées _uniquement_ si `type === 'factoring'` :

| Code                       | Condition                       | Sévérité | Pourquoi                                                                     |
| -------------------------- | ------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `CONCENTRATION_TOP_CLIENT` | top 1 client > 30 % du CA       | high     | Si le top client défaille, la majorité des créances financées s'effondre     |
| `AGED_RECEIVABLES_HIGH`    | créances > 60 j > 20 % du total | high     | Balance âgée dégradée → créances lentes ou douteuses, rentabilité compromise |
| `DILUTION_RATE_HIGH`       | avoirs émis / CA > 5 %          | medium   | Contestations clients fréquentes → érosion de la valeur recouvrable          |

Sur un dossier prêt, les 3 tuiles factoring sont **absentes du diagnostic** (pas affichées "unknown" — purement filtrées). Sur _Fleurs de Saison_ (seul dossier factoring), elles apparaissent dans une 3e section "Qualité créances (affacturage)" sous les sections financière et bancaire.

Couvert dans `backend/src/rule-engine/rule-engine.spec.ts` (19 assertions, dont la différenciation prêt/factoring) : pondération DSO loan/factoring, déclenchement des 3 règles, absence sur les dossiers prêt, comportement `unknown` si `factoringIndicators` absent.

---

## Pourquoi pas _tous_ les indicateurs factoring possibles ?

Le cadrage référence 3 leviers d'analyse affacturage. On en livre **3 de plus** sous forme de roadmap (cf. ci-dessous). Choix d'arbitrage :

1. **Différence additive, pas substitutive** : Grégoire l'a validé en kickoff (« faible différenciation, mêmes étapes + quelques indicateurs _en plus_ pour le factoring »). Les règles factoring **complètent** le socle commun, elles ne le remplacent pas.
2. **Limites de données** : `data/raw/` ne contient ni balance âgée, ni concentration, ni dilution. Les 3 indicateurs livrés sont **simulés** dans `data/augmented/fleurs-de-saison.json` de façon cohérente avec un fleuriste B2B (top client à 38 % = clientèle hôtellerie/événementiel typique, 24 % de créances > 60 j cohérent avec un DSO réel à 68 j, dilution 4,2 % normale pour la profession). L'enrichissement est documenté en architecture §3.

---

## Règles complémentaires à ajouter (roadmap)

**Factoring** (3 règles supplémentaires en J3+) :

| Code                       | Condition                                 | Sévérité | Pourquoi                                         |
| -------------------------- | ----------------------------------------- | -------- | ------------------------------------------------ |
| `CONCENTRATION_TOP_5`      | top 5 clients > 60 % du CA                | medium   | Diversification du portefeuille créances         |
| `DEBTOR_PAYMENT_INCIDENTS` | ≥ 1 incident sur top débiteurs 12 mois    | high     | Signal direct de risque sur les flux à financer  |
| `SECTOR_CONCENTRATION`     | tous les top clients dans le même secteur | medium   | Corrélation des défauts en cas de choc sectoriel |

**Prêt** (catégorie `loan`, à créer) :

| Code                           | Condition                                            | Sévérité | Pourquoi                                                                  |
| ------------------------------ | ---------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `DSCR_LOW`                     | EBITDA / annuités < 1.2                              | high     | Capacité à servir la dette annuellement — le ratio prêteur par excellence |
| `LOAN_TO_USEFUL_LIFE_MISMATCH` | durée prêt vs durée d'usage > 2 ans d'écart          | medium   | Financer du BFR sur 7 ans ou de l'équipement sur 6 mois = aberrant        |
| `GUARANTEES_COVERAGE_LOW`      | garanties / nantissements / caution < 30% du montant | medium   | Récupération en cas de défaut                                             |

**Pondération variable additionnelle (existant à retoucher en J3+)** :

- `REVENUE_DECLINING` : à élever en `high` pour factoring si combiné à `CONCENTRATION_TOP_CLIENT` (un client qui s'érode dans une base concentrée = double peine).

---

## Pour creuser

- Implémentation : [`backend/src/rule-engine/rule-engine.ts`](backend/src/rule-engine/rule-engine.ts)
- Architecture & contrats : [`_bmad-output/architecture-poc-karmen.md`](_bmad-output/architecture-poc-karmen.md) §2bis
- Référentiel finance : [`_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md`](_bmad-output/learning/fiche-finance-entreprise-analyse-credit-pme.md)
