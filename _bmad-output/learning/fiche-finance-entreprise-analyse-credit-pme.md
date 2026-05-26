# 📚 Fiche d'étude — Finance d'entreprise & analyse crédit PME

> Document pédagogique de référence — comprendre la **liasse fiscale**, les **acronymes financiers** et les **ratios d'analyse crédit** utilisés par un analyste chez une fintech type Karmen.
>
> **Auteur :** Carson (Elite Brainstorming Specialist) pour Max
> **Date :** 2026-05-26
> **Contexte :** préparation au test technique Karmen — découverte du domaine fintech/credit underwriting
> **Niveau visé :** néophyte → opérationnel pour parler à un analyste crédit sans passer pour un touriste

---

## 🧭 Comment utiliser cette fiche

- **Lecture séquentielle** : suis l'ordre — chaque section bâtit sur la précédente.
- **Exemple fil rouge** : on utilise la **Brasserie du Marais** (un des dossiers test Karmen, restaurant Paris 3ᵉ, 35 000€ de prêt demandé) avec des chiffres fictifs cohérents pour rendre tout tangible.
- **Sources en fin de document** : chaque chiffre/concept est sourcé.

---

## 📑 1. La liasse fiscale — qu'est-ce que c'est ?

### Définition simple

La **liasse fiscale** est le paquet de documents comptables et fiscaux qu'une entreprise française doit transmettre chaque année à l'administration fiscale (DGFiP) pour déclarer ses comptes. Le terme « liasse » vient du fait qu'historiquement c'était un paquet papier agrafé.

### Pourquoi c'est central en analyse crédit

C'est la **seule version officielle, signée par un expert-comptable**, des comptes de l'entreprise. Pas du déclaratif marketing — du chiffre **opposable au fisc**. C'est la base d'audit qu'un analyste crédit consulte avant toute décision de financement.

### Deux régimes possibles

| Régime | Pour qui | Formulaires principaux |
|---|---|---|
| **Régime simplifié** | PME/TPE en dessous des seuils (CA < 840k€ négoce, < 254k€ service) | **2033-A à 2033-G** |
| **Régime réel normal** | Entreprises au-dessus des seuils | **2050 à 2059** + **2065** (IS) |

> **Pour le test Karmen** : leurs clients sont des PME/TPE, on croisera les deux régimes. Les 4 dossiers test ne précisent pas le régime — on supposera le **régime réel normal** par défaut.

**Sources :**
- [Liasse fiscale 2050, 2051, 2033A — Compta-online](https://www.compta-online.com/quel-compte-pour-quelle-case-de-la-liasse-le-bilan-et-les-tableaux-2050-et-2051-ou-2033a-ao1177)
- [Formulaire 2050-LIASSE — impots.gouv.fr](https://www.impots.gouv.fr/formulaire/2050-liasse/liasse-fiscale-du-regime-reel-normal-en-matiere-de-bic-et-dis)
- [Liasse fiscale du régime réel normal — Service Public Entreprendre](https://entreprendre.service-public.gouv.fr/vosdroits/R18655)

---

## 📋 2. Anatomie de la liasse — les formulaires clés

| Formulaire | Nom | Contenu en clair | Ce que l'analyste y cherche |
|---|---|---|---|
| **2050** | Bilan — **Actif** | Tout ce que l'entreprise **possède** (immobilisations, stocks, créances, trésorerie) | Trésorerie disponible, créances clients (DSO), niveau de stock |
| **2051** | Bilan — **Passif** | Tout ce que l'entreprise **doit** (capitaux propres, dettes financières, dettes fournisseurs) | Endettement total, capitaux propres, structure dette CT/LT |
| **2052** | **Compte de Résultat** — partie 1 | Tout l'argent qui **rentre et sort** sur l'année d'exploitation | CA, achats, marges, EBE |
| **2053** | **Compte de Résultat** — partie 2 | Suite : résultat financier, exceptionnel, impôt, résultat net | Rentabilité finale |
| **2054-2055** | Immobilisations & amortissements | Détail des biens et leur usure comptable | Investissements récents |
| **2057** | Échéances des créances et dettes | Détail des délais de paiement | DPO et DSO précis |
| **2058-A** | Détermination du résultat fiscal | Réconciliation comptable/fiscal | Optimisations fiscales |
| **2059-A** | Plus/moins-values | Cessions d'actifs | Événements exceptionnels |
| **2065** | Déclaration d'IS | Impôt sur les sociétés | Pression fiscale |

**Taille totale :** ~10-15 pages pour une PME, davantage selon les annexes.

**Sources :**
- [Liasse fiscale 2050/2051/2033A — Compta-online](https://www.compta-online.com/quel-compte-pour-quelle-case-de-la-liasse-le-bilan-et-les-tableaux-2050-et-2051-ou-2033a-ao1177)
- [Guide pratique : comment lire sa liasse fiscale — CAPEB](https://www.capeb.fr/www/capeb/media//aube/document/bat-fiches-liasse-fiscale.pdf)
- [Automatiser la liasse fiscale (2050-2065) — Lido](https://www.lido.app/fr/liasse-fiscale)

---

## 🔤 3. Glossaire — Compte de Résultat (formulaires 2052/2053)

> **Fil rouge — Brasserie du Marais :** restaurant fictif Paris 3ᵉ, **CA annuel 280 000€**.

### L'escalier du résultat

> **Logique générale :** on part du chiffre d'affaires (top line) et on **enlève progressivement** chaque type de charge pour arriver au bénéfice final (bottom line). Chaque marche correspond à une catégorie de dépense.

| Niveau | Acronyme | Nom complet | Définition | Exemple Brasserie | Source dans liasse |
|---|---|---|---|---|---|
| 1 | **CA** | Chiffre d'Affaires | Total des ventes HT de l'année | **280 000€** | 2052, ligne FL |
| 2 | **Achats consommés** | — | Matières premières utilisées (food, alcool) | 95 000€ | 2052, lignes FS+FT |
| 3 | **Marge brute** | — | CA − Achats — ce qui reste avant tout le reste | 185 000€ | Calculé |
| 4 | **Charges externes** | — | Loyer, énergie, assurances, prestataires | 60 000€ | 2052, ligne FW |
| 5 | **Charges de personnel** | — | Salaires + cotisations sociales | 85 000€ | 2052, lignes FY+FZ |
| 6 | **EBE** | **Excédent Brut d'Exploitation** | Cash généré par l'activité **avant** amortissements et finance | **40 000€** | Calculé |
| 6bis | **EBITDA** | *Earnings Before Interest, Taxes, Depreciation, Amortization* | Version anglo-saxonne — quasi équivalent à l'EBE | ≈ 40 000€ | Calculé |
| 7 | **Amortissements** | — | Usure comptable des machines (la friteuse perd de la valeur chaque année) | 8 000€ | 2052, ligne GA |
| 8 | **Résultat d'exploitation** | — | EBE − amortissements − provisions. Performance pure du métier | 32 000€ | 2052, ligne GG |
| 9 | **Résultat financier** | — | Intérêts perçus − intérêts payés sur emprunts | -3 000€ | 2053, ligne GV |
| 10 | **Résultat exceptionnel** | — | Événements ponctuels (vente d'un local, sinistre) | 0€ | 2053, lignes HD-HE |
| 11 | **IS** | Impôt sur les Sociétés | Impôt sur le bénéfice | 6 000€ | 2053, ligne HK |
| 12 | **Résultat net** | — | **Le bénéfice final.** Ce qui reste vraiment | **23 000€** | 2053, ligne HN |

### Différence EBE vs EBITDA (subtilité importante)

- **EBE** (France) : terme comptable français, calculé sur la liasse via la formule officielle.
- **EBITDA** (anglo-saxon) : terme financier international.
- **En pratique** : EBE ≈ EBITDA pour la quasi-totalité des PME. Les écarts sont mineurs (traitement des subventions d'exploitation, redevances de crédit-bail).
- **Lequel utiliser ?** EBE quand tu parles à un comptable français, EBITDA quand tu parles à un investisseur ou un banquier qui regarde des deals internationaux.

**Sources :**
- [Indicateurs financiers TPE/PME — Oranova Conseil](https://oranova-conseil.fr/indicateurs_financiers_tpe_pme/)
- [Performance financière PME — Defacto](https://www.getdefacto.com/fr/article/performance-financiere-pme)
- [Quels indicateurs clés des états financiers — RCGT](https://www.rcgt.com/fr/conseils/avis-d-experts/quels-indicateurs-cles-etats-financiers/)

---

## 🏛️ 4. Glossaire — Bilan (formulaires 2050/2051)

### Principe fondamental

Le bilan est une **photo à un instant T** (généralement au 31/12), à la différence du compte de résultat qui est un **film sur 12 mois**.

**Règle d'or comptable :** **ACTIF = PASSIF.** Toujours. Si tu as 18k€ de cash, c'est qu'il y a forcément 18k€ de quelque chose qui l'a financé (capital, dette, fournisseur impayé…).

### ACTIF — ce que l'entreprise possède (formulaire 2050)

| Poste | Définition | Exemple Brasserie | Source |
|---|---|---|---|
| **Immobilisations** | Tout ce qui dure > 1 an (machines, fonds de commerce, dépôts de garantie, brevets) | 75 000€ | 2050, lignes AB-CN |
| **Stocks** | Marchandises en réserve, matières premières | 12 000€ | 2050, lignes BL-BT |
| **Créances clients** | Factures émises non encore encaissées | 8 000€ | 2050, ligne BX |
| **Disponibilités / Trésorerie** | Cash en banque + caisse | **18 500€** | 2050, ligne CD |
| **TOTAL ACTIF** | Somme | 113 500€ | 2050, ligne CO |

### PASSIF — ce que l'entreprise doit (formulaire 2051)

| Poste | Définition | Exemple Brasserie | Source |
|---|---|---|---|
| **Capitaux propres** | Argent appartenant aux actionnaires (capital + résultats accumulés non distribués) | 50 000€ | 2051, ligne DL |
| **Dettes financières** | Emprunts bancaires, leasings, crédit-bail | **30 000€** | 2051, lignes DU-DV |
| **Dettes fournisseurs** | Factures reçues non encore payées | 18 500€ | 2051, ligne DX |
| **Dettes fiscales et sociales** | TVA, charges sociales en attente | 15 000€ | 2051, ligne DY |
| **TOTAL PASSIF** | = Total Actif (par construction) | 113 500€ | 2051, ligne EE |

**Sources :**
- [Liasse fiscale : déclarations 2050, 2051 et 2033A — Compta-online](https://www.compta-online.com/quel-compte-pour-quelle-case-de-la-liasse-le-bilan-et-les-tableaux-2050-et-2051-ou-2033a-ao1177)
- [Lecture liasse fiscale — CAPEB](https://www.capeb.fr/www/capeb/media//aube/document/bat-fiches-liasse-fiscale.pdf)

---

## 🌊 5. Ratios « Cash & Cycle » — la santé du cycle d'exploitation

| Acronyme | Nom complet | Formule | Ce que ça mesure | Exemple Brasserie | Bon ou mauvais ? |
|---|---|---|---|---|---|
| **BFR** | Besoin en Fonds de Roulement | Stocks + Créances clients − Dettes fournisseurs | **L'argent immobilisé** dans le cycle quotidien | 12 000 + 8 000 − 18 500 = **1 500€** | Faible/négatif = excellent (les fournisseurs te financent) |
| **DSO** | Days Sales Outstanding | (Créances clients ÷ CA) × 365 | **Délai moyen** pour être payé par les clients | (8 000 ÷ 280 000) × 365 = **10 jours** | Court = excellent (resto = paiement immédiat) |
| **DPO** | Days Payable Outstanding | (Dettes fournisseurs ÷ Achats) × 365 | **Délai moyen** pour payer ses fournisseurs | (18 500 ÷ 95 000) × 365 = **71 jours** | Long = bon (financement gratuit) |
| **DIO** | Days Inventory Outstanding | (Stocks ÷ Achats) × 365 | Jours moyens de stock | (12 000 ÷ 95 000) × 365 = **46 jours** | Plus court = meilleure rotation |

### 🎯 Pourquoi le DSO est CRITIQUE pour Karmen Factor

> Plus le **DSO est long**, plus l'entreprise a besoin **d'affacturage** pour soulager sa trésorerie. **C'est littéralement le métier de Karmen Factor.** Un DSO > 60 jours est typiquement le signal qu'une boîte est candidate naturelle à l'affacturage.

**Sources :**
- [Indicateurs financiers TPE/PME — Oranova](https://oranova-conseil.fr/indicateurs_financiers_tpe_pme/)
- [Performance financière PME — Defacto](https://www.getdefacto.com/fr/article/performance-financiere-pme)
- [Pilotage financier PME — FinSight](https://finsight.zineinsight.com/pilotage-financier-pme)

---

## 📊 6. Ratios « Santé Crédit » — la trousse à outils de l'analyste

| Ratio | Formule | Mesure | Brasserie | Seuil d'alerte |
|---|---|---|---|---|
| **Dette / EBITDA** ⭐ | Dette financière ÷ EBITDA | **Combien d'années pour rembourser** toute la dette avec la rentabilité actuelle | 30k ÷ 40k = **0,75 an** | **> 3-5 ans = alerte** |
| **Autonomie financière** | Capitaux propres ÷ Total passif | Indépendance vs créanciers | 50k ÷ 113,5k = **44%** | < 20% = fragile |
| **Taux d'endettement** | Dettes ÷ Capitaux propres | Effet de levier | 30k ÷ 50k = **60%** | > 200% = risqué |
| **Marge d'EBITDA** | EBITDA ÷ CA | Rentabilité de l'activité | 40k ÷ 280k = **14%** | < 5% = faible |
| **Couverture des intérêts** | EBITDA ÷ Intérêts payés | Capacité à payer ses intérêts | 40k ÷ 3k = **13×** | < 2× = en difficulté |
| **ROA** | Résultat net ÷ Total actif | Return on Assets — efficacité globale | 23k ÷ 113,5k = **20%** | < 5% = peu efficace |
| **ROE** | Résultat net ÷ Capitaux propres | Return on Equity — rendement actionnaires | 23k ÷ 50k = **46%** | Varie selon secteur |

### ⭐ Le ratio reine : Dette / EBITDA

> Selon [WeShareBonds](https://www.wesharebonds.com/westudy/unite/utilisation-ratios-endettement), c'est **« le plus utilisé des ratios en analyse crédit »**. Toutes les banques et fintechs le calculent en premier réflexe.

**Interprétation rapide :**
- **< 1×** : excellent — la dette est absorbable très rapidement
- **1× à 3×** : sain — niveau normal pour une PME
- **3× à 5×** : à surveiller — la dette devient lourde
- **> 5×** : zone rouge — capacité de remboursement compromise

**Sources :**
- [Utilisation des ratios en analyse crédit — WeShareBonds](https://www.wesharebonds.com/westudy/unite/utilisation-ratios-endettement)
- [Analyse du risque de crédit — HighRadius](https://www.highradius.com/fr/Blog/analyse-risque-credit/)
- [27 KPIs financiers PME 2026 — Trezy](https://www.trezy.io/fr/blog/27-kpis-financiers-essentiels-pme-2026)
- [Analyse financière PME — Niobé Stratégie](https://niobestrategie.fr/analyse-financiere-pme/)

---

## 🧾 6bis. Spécificités affacturage — glossaire opérationnel

> **Pourquoi cette section ?** Karmen finance via **deux produits** : le prêt **et** l'affacturage. L'analyse d'un dossier affacturage mobilise un vocabulaire et des indicateurs **spécifiques** qu'un dossier prêt n'utilise pas. Cette section couvre les 8 termes minimaux pour parler à un analyste affacturage chez Karmen Factor.
>
> **Fil rouge hypothétique :** « BureauPro SAS », PME de fournitures de bureau B2B, CA 1,2 M€, demande de ligne d'affacturage 200 k€. Chiffres choisis pour illustrer chaque indicateur.

### Le principe en une phrase

L'affacturage = **céder ses factures clients à un factor** qui les finance par avance (typiquement 90% du TTC sous 48h) en échange d'une commission, et qui peut prendre en charge la relance et le recouvrement.
[Source : Agicap — Définition de l'affacturage](https://agicap.com/fr/article/qu-est-ce-que-laffacturage/), [BNP Paribas Factor — Lexique](https://factor.bnpparibas/fr/lexique-affacturage)

### Les 2 niveaux de risque (vs 1 seul pour le prêt)

**Ce qui change fondamentalement vs le prêt :** en affacturage, le factor évalue **deux risques** simultanément :
1. **Risque cédant** = la PME qui demande l'affacturage (analyse classique : santé financière, liasse fiscale).
2. **Risque débiteurs** = les **clients de la PME**, dont les factures sont cédées. Si un gros débiteur fait défaut, le factor perd.

> Une « *enquête débiteur* » est un préalable à tout contrat d'affacturage : on sonde la solvabilité d'un échantillon de clients de la PME. [Source : Affactassur](https://www.affactassur.com/affacturage/affacturage-concentration.html)

### Les 8 termes à maîtriser

| # | Terme | Définition opérationnelle | Indicateur / seuil | Exemple BureauPro |
|---|---|---|---|---|
| 1 | **Encours cédé** | Montant global des factures cédées au factor à date T (créances non échues + impayées) | À comparer au CA mensuel : un encours = 1 à 3 mois de CA est typique | 180 k€ (≈ 1,8 mois de CA) ✅ |
| 2 | **Balance âgée** | Tableau ventilant les créances par tranche d'ancienneté | Tranches standard : non échu / 0-30j / 31-60j / 61-90j / 91-180j / >180j | 78% non échu, 15% 0-30j, 5% 30-60j, 2% >90j ⚠️ |
| 3 | **Concentration client** | Part du CA réalisée avec le plus gros client (top 1) ou les top 3/5 | **Seuil standard : 30%** par client. Certains factors vont jusqu'à 50%, voire 100% si débiteur grand compte noté A | Top 1 = 22% (sous seuil) ✅ |
| 4 | **Taux de dilution** | % des factures cédées subissant un avoir, un escompte, un litige ou un impayé sur 12 mois | Si dilution moyenne = 5%, le factor applique typiquement une réserve de 8 à 10% | 6% (réserve à 10%) ⚠️ |
| 5 | **Fonds / retenue de garantie** | % du montant des créances cédées que le factor retient comme sécurité contre litiges/impayés | **Standard : 10%** (range 5-15%). Négociable à la baisse si débiteurs grands comptes solides | 10% retenu sur chaque facture |
| 6 | **Avec recours vs sans recours** | **Avec recours** : la PME rembourse le factor si le débiteur final ne paie pas. **Sans recours** : le factor assume (généralement couvert par assurance-crédit) | « Sans recours » = plus cher mais transfère le risque | À négocier au contrat |
| 7 | **Notifié vs non-notifié (« confidentiel »)** | **Notifié** : le débiteur sait qu'il doit payer le factor. **Non-notifié** : la PME continue de gérer ses encaissements, reverse au factor | Le confidentiel préserve la relation commerciale | Karmen Factor propose le **confidentiel** |
| 8 | **Commission d'affacturage** | % du montant TTC des factures cédées, rémunérant la gestion (relance, recouvrement) | Range marché : 0,2% à 2% du CA cédé selon volume + risque | À devis |

**Sources principales :**
- [Encours cédé — Affacturage.fr (définition)](https://www.affacturage.fr/definition/encours/)
- [Balance âgée — Hoopiz](https://www.hoopiz.fr/balance-agee-client/), [Legalstart](https://www.legalstart.fr/fiches-pratiques/comptabilite-entreprise/balance-agee/), [Lexrecouv](https://www.lexrecouv.com/balance-agee-gestion-encours/)
- [Concentration client (seuils) — Affactassur](https://www.affactassur.com/affacturage/affacturage-concentration.html), [Easyfacto](https://easyfacto.fr/definition/concentration/)
- [Dilution & réserve sur avoirs — Affacturage.org coût](https://www.affacturage.org/cout-affacturage.php), [QuelFactor — Avoirs](https://www.quelfactor.fr/comment-gerer-les-factures-davoir-en-affacturage/)
- [Fonds de garantie 10% standard — Affactureur.fr](https://www.affactureur.fr/fonds-garantie-affacturage.html), [Clarisse Groupe — Réduire la retenue](https://www.clarissegroupe.fr/post/affacturage-tout-comprendre-sur-la-retenue-de-garantie-et-comment-la-r%C3%A9duire)
- [Avec/sans recours — Defacto](https://www.getdefacto.com/fr/article/affacturage-avec-sans-recours), [Allianz Trade — Affacturage vs assurance-crédit](https://www.allianz-trade.fr/blog/affacturage-et-assurance-credit.html)
- [Karmen Factor — Affacturage confidentiel](https://www.karmen.io/affacturage)

### Ce que l'analyste affacturage regarde **en plus** du prêt

| Étape | Prêt | Affacturage (en + ou à la place) |
|---|---|---|
| Documents requis | 2 liasses + 12 mois relevés bancaires | + **balance âgée** récente + **échantillon de factures** cédées + souvent **liste des débiteurs** |
| Indicateurs centraux | Dette/EBITDA, marge EBITDA, trésorerie | **DSO**, **concentration top 1/3**, **dilution 12m**, **qualité débiteurs** |
| Red flags spécifiques | Découverts, dette/EBITDA > 5×, marge < 5% | **Top client > 30%**, **dilution > 8%**, **balance âgée > 90j > 5%**, débiteur en procédure |
| Source de notation | INFOGREFFE, NOTA-PME (cédant) | + **Coface / Allianz Trade / Ellisphere** sur les **débiteurs** |

### 🎯 Pourquoi c'est central pour le test Karmen

Karmen Factor est **explicitement positionné** sur l'affacturage confidentiel pour PME ([source](https://www.karmen.io/affacturage)). Sur les 4 dossiers test fournis, **1 est typé `factoring`** (Fleurs de Saison, profil atypique : DSO court mais besoin saisonnier B2B) et **3 sont typés `loan`** — dont **2 ont pourtant un profil naturel d'affacturage** (Studio Pixel DSO 62j, Transport Leclerc DSO 75j). Insight produit : **le type de produit est choisi par le client, pas déduit du DSO** — le cockpit doit s'adapter au type **demandé**. Un dossier affacturage met en avant la **balance âgée, la concentration client et le taux de dilution**, pas le ratio dette/EBITDA en gros.

> 📊 **Donnée marché :** l'affacturage a crû de +1,9% en France en 2025 (source [ASF — Statistiques affacturage 2025](https://asf-france.com/statistiques/lactivite-des-societes-daffacturage-en-2025/)).

---

## 🎬 7. Comment l'analyste lit tout ça dans la pratique

Étapes-types **dans cet ordre** lorsqu'il ouvre un dossier :

| # | Étape | Question posée | Outils |
|---|---|---|---|
| 1 | Trajectoire CA | Croît, stagne, décline ? | Comparaison N vs N-1 (pourquoi 2 liasses sont exigées) |
| 2 | Évolution EBITDA | La rentabilité suit-elle la croissance ? | Liasse 2052/2053 |
| 3 | Résultat net | Positif sur les 2 dernières années ? | Liasse 2053 |
| 4 | Trésorerie | Coussin suffisant ? | Liasse 2050 + Open Banking |
| 5 | Dette/EBITDA | < 3× ? | Calculé |
| 6 | BFR/DSO | Pas de tension cash anormale ? | Liasse + Open Banking |
| 7 | Flux bancaires réels | Découverts ? Rejets de prélèvement ? | **Open Banking** |
| 8 | Cohérence interne | CA déclaré ≈ flux observés ? | Croisement liasse × Open Banking |

> ⏱️ **Si chaque vérif prend 2 min de navigation entre modules, on est à 16 minutes** pour cette seule étape. **CQFD : le va-et-vient entre modules est le voleur de temps n°1.** C'est pourquoi un *Decision Cockpit* unifié (étape 3 de notre brainstorm Karmen) est le candidat POC le plus impactant.

---

## 🏦 8. D'où viennent les données en pratique chez Karmen

| Donnée | Source en prod | Service de marché |
|---|---|---|
| **CA, EBE, résultat net, dettes** | OCR de la liasse fiscale | [Holofin](https://holofin.ai/fr/solutions/extraction-liasse-fiscale/) (97%+ de précision), [Dataleon](https://www.dataleon.ai/en/technologies/ocr-api-tax-bundle), [Lido](https://www.lido.app/fr/liasse-fiscale) |
| **Flux mensuels, découverts, rejets** | Agrégation bancaire via PSD2 / Open Banking | **Bridge**, **Powens**, **Budget Insight** (Tink), Linxo |
| **Données légales (SIREN, statuts)** | API gouvernementales | INSEE Sirene, INFOGREFFE, NOTA-PME |
| **Liasse fiscale officielle** | API DGFiP | Compte officiel impots.gouv.fr |

### Confirmation : c'est le stack de Karmen

D'après [Karmen.io](https://www.karmen.io/) et l'[interview FinMag 2026](https://www.finmag.fr/blog/karmen-interview/) :

> *« Grâce à la directive européenne sur l'Open Banking, Karmen peut avoir une vision en lecture seule sur les transactions bancaires de l'entreprise au réel, utiliser les outils de facturation et de gestion de trésorerie pour avoir une vision 360° sur la santé financière et opérationnelle de l'entreprise. »*

**Sources :**
- [Karmen — Site officiel](https://www.karmen.io/)
- [Karmen 2026 : interview FinMag](https://www.finmag.fr/blog/karmen-interview/)
- [Karmen lève 9M€ — Planet Fintech](https://www.planet-fintech.com/La-fintech-Karmen-leve-9-M-pour-democratiser-le-financement-instantane-des-TPE-PME-francaises_a5776.html)

---

## 🏆 9. Récap minimum vital — les 8 acronymes à retenir

### Prêt (analyse classique)

| 🏆 | Acronyme | À retenir en une ligne |
|---|---|---|
| 1 | **CA** | Chiffre d'affaires — la taille de la boîte |
| 2 | **EBITDA / EBE** | Rentabilité opérationnelle — capacité à générer du cash |
| 3 | **Résultat net** | Bénéfice final — ce qui reste vraiment |
| 4 | **Dette / EBITDA** | Capacité de remboursement — **le** ratio reine en crédit |

### Affacturage (en plus / à la place)

| 🏆 | Acronyme | À retenir en une ligne |
|---|---|---|
| 5 | **DSO** | Délai de paiement client — long DSO = candidat affacturage |
| 6 | **Encours cédé** | Stock vivant de factures cédées au factor (= exposition) |
| 7 | **Balance âgée** | Ventilation des créances par tranche d'ancienneté — révèle le risque caché |
| 8 | **Concentration top 1** | % CA sur le plus gros client — seuil d'alerte 30% |

> Avec ces 8 dans la poche, tu peux parler à n'importe quel analyste crédit **ou affacturage** chez Karmen sans passer pour un touriste. 😎

---

## 📎 10. Sources consolidées

### Sur la liasse fiscale
- [Liasse fiscale 2050/2051/2033A — Compta-online](https://www.compta-online.com/quel-compte-pour-quelle-case-de-la-liasse-le-bilan-et-les-tableaux-2050-et-2051-ou-2033a-ao1177)
- [Formulaire 2050 — impots.gouv.fr](https://www.impots.gouv.fr/formulaire/2050-liasse/liasse-fiscale-du-regime-reel-normal-en-matiere-de-bic-et-dis)
- [Service Public Entreprendre — Liasse régime réel normal](https://entreprendre.service-public.gouv.fr/vosdroits/R18655)
- [Guide pratique de lecture — CAPEB](https://www.capeb.fr/www/capeb/media//aube/document/bat-fiches-liasse-fiscale.pdf)

### Sur les ratios d'analyse crédit
- [L'utilisation des ratios en analyse crédit — WeShareBonds](https://www.wesharebonds.com/westudy/unite/utilisation-ratios-endettement)
- [Analyse du risque de crédit — HighRadius](https://www.highradius.com/fr/Blog/analyse-risque-credit/)
- [La gestion du risque crédit par la méthode du scoring — HAL/Université](https://shs.hal.science/halshs-00607954/document)

### Sur les indicateurs financiers PME
- [Indicateurs financiers TPE/PME — Oranova Conseil](https://oranova-conseil.fr/indicateurs_financiers_tpe_pme/)
- [27 KPIs financiers essentiels PME 2026 — Trezy](https://www.trezy.io/fr/blog/27-kpis-financiers-essentiels-pme-2026)
- [Analyse financière PME — Guide complet 2026 — Niobé Stratégie](https://niobestrategie.fr/analyse-financiere-pme/)
- [Performance financière PME — Defacto](https://www.getdefacto.com/fr/article/performance-financiere-pme)
- [Pilotage financier PME — FinSight](https://finsight.zineinsight.com/pilotage-financier-pme)
- [Quels indicateurs clés des états financiers — RCGT](https://www.rcgt.com/fr/conseils/avis-d-experts/quels-indicateurs-cles-etats-financiers/)
- [Notation INFOGREFFE et NOTA-PME](https://www.nota-pme.com/Analyse-financiere-notation-scoring-evaluation-prevention-difficultes-financement-entreprises)

### Sur l'affacturage (vocabulaire & indicateurs spécifiques)
- [Agicap — L'affacturage : ce qu'il faut savoir](https://agicap.com/fr/article/qu-est-ce-que-laffacturage/)
- [BNP Paribas Factor — Lexique de l'affacturage](https://factor.bnpparibas/fr/lexique-affacturage)
- [Affacturage.fr — Encours](https://www.affacturage.fr/definition/encours/)
- [Hoopiz — Balance âgée client](https://www.hoopiz.fr/balance-agee-client/)
- [Legalstart — Balance âgée en comptabilité](https://www.legalstart.fr/fiches-pratiques/comptabilite-entreprise/balance-agee/)
- [Lexrecouv — Balance âgée : guide pratique](https://www.lexrecouv.com/balance-agee-gestion-encours/)
- [Affactassur — Seuils de concentration en affacturage](https://www.affactassur.com/affacturage/affacturage-concentration.html)
- [Easyfacto — Concentration](https://easyfacto.fr/definition/concentration/)
- [Affacturage.org — Coût et dilution](https://www.affacturage.org/cout-affacturage.php)
- [QuelFactor — Gérer les factures d'avoir en affacturage](https://www.quelfactor.fr/comment-gerer-les-factures-davoir-en-affacturage/)
- [Affactureur.fr — Fonds de garantie en affacturage](https://www.affactureur.fr/fonds-garantie-affacturage.html)
- [Clarisse Groupe — Comprendre et réduire la retenue de garantie](https://www.clarissegroupe.fr/post/affacturage-tout-comprendre-sur-la-retenue-de-garantie-et-comment-la-r%C3%A9duire)
- [Defacto — Affacturage avec ou sans recours](https://www.getdefacto.com/fr/article/affacturage-avec-sans-recours)
- [Allianz Trade — Affacturage et assurance-crédit](https://www.allianz-trade.fr/blog/affacturage-et-assurance-credit.html)
- [Karmen — Guide complet affacturage (produit confidentiel)](https://www.karmen.io/affacturage)
- [ASF — Statistiques affacturage 2025](https://asf-france.com/statistiques/lactivite-des-societes-daffacturage-en-2025/)

### Sur l'extraction automatique de liasse fiscale (services prod)
- [Holofin — Extraction liasse fiscale par IA](https://holofin.ai/fr/solutions/extraction-liasse-fiscale/)
- [Dataleon — API OCR Liasse fiscale 2033 et 2050](https://www.dataleon.ai/en/technologies/ocr-api-tax-bundle)
- [Lido — Automatiser la liasse fiscale 2050-2065](https://www.lido.app/fr/liasse-fiscale)

### Sur Karmen
- [Karmen — Site officiel](https://www.karmen.io/)
- [Karmen 2026 — Interview FinMag](https://www.finmag.fr/blog/karmen-interview/)
- [Karmen, la fintech qui bouscule le financement PME — L'Assurance en Mouvement](https://www.lassuranceenmouvement.com/2025/02/04/karmen-la-fintech-financement-des-pme/)
- [Karmen lève 9M€ — Planet Fintech](https://www.planet-fintech.com/La-fintech-Karmen-leve-9-M-pour-democratiser-le-financement-instantane-des-TPE-PME-francaises_a5776.html)
- [Avis Karmen — ConnectBanque](https://www.connectbanque.com/fr/avis/karmen-solution-financement-rbf)

---

> 📝 **Note méthodologique** : les chiffres de l'exemple « Brasserie du Marais » sont **fictifs mais cohérents** avec un restaurant parisien réaliste de cette taille — ils ne sont pas tirés d'une vraie liasse. Les références de lignes (FL, FS, BX…) correspondent aux codes officiels CERFA des formulaires 2050-2053 documentés par impots.gouv.fr.
