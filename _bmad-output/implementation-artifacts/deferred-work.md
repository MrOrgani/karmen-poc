# Deferred Work

## From spec-backend-cockpit-api review (2026-05-27)

- **Runtime validation of `data/augmented/*.json`** — currently cast with `as AugmentedDossier`, no zod/class-validator. Reasonable for the POC (4 known fixtures) but should be hardened before prod.
- **Configurable data path** — `DossiersRepository.resolveDataDir` walks 5 parent levels; replace with env var (`KARMEN_DATA_DIR`) when packaging for deployment.
- **Auth / CORS allowlist** — explicitly out-of-POC-scope, but the production cockpit must enforce both before exposing financial data.
- **Duplicate liasse-year detection** — current rule counts liasses without checking distinct years; a dossier with two copies of the 2024 liasse passes. Add a `distinct(year)` check.

## Deferred from: code review (2026-05-27)

- **I/O Matrix fr-001 Brasserie `redFlags=[]` inatteignable** — la fixture Brasserie déclenche `LOW_CASH_POSITION` (cash 18500 < outflows 22500). Trois options déjà documentées dans la review : (a) durcir le seuil à `< 0.5×` outflows, (b) re-négocier la ligne matrix, (c) ne rien faire. **Décision : defer post-démo Grégoire** — spec légèrement bavarde mais code fonctionnel sur les 4 dossiers.

- DEBT_TO_EBITDA boundary at exactly `5×` is silently MEDIUM (HIGH is `> 5`). Document or harmonize.
- `LOW_CASH_POSITION` uses strict `<` ; an exact match (cash = 1 month outflows) doesn't fire. Decide whether `<=` is more honest.
- `readdir` in repository accepts any `*.json` — add a filename allowlist or schema check.
- When multiple bank accounts are all incomplete, `completedItems` is clamped to 0, hiding "1 bad / N bad" differentiation.
- `revenuePreviousYear === 0` (startup or new entity) silently skips `REVENUE_DECLINING`. Add a `NEW_COMPANY` flag.
- Boundary equality cases: `revenue = 0.9 × prev` exact, `overdraftDays = 30` exact, `dso = 60` exact — current rules use strict comparisons. Either align with label semantics (`>=`) or document.
- `monthlyOutflowsAverage <= 0` would false-positive `LOW_CASH_POSITION` if data is corrupted.
- Empty `data/augmented` directory → backend boots with 0 dossiers, no operator signal. Add an assertion.
- `DossiersController.list` recomputes completeness on every call — fine for 4 fixtures, memoize when scale grows.
- `RULES` table in `completeness.engine` has loan == factoring (`{2, 12}`); divergence ports (AR aging, top-client concentration) listed out-of-scope in PRD §Out of Scope.
- `EBITDA` very small but `> 0` produces extreme `debt/EBITDA` ratios that may surface as labels without an explicit flag — consider a "fragile EBITDA" rule.
- `docs[0].metadata.bank` is taken when grouping by account — silently hides inconsistencies if 2 docs of the same account claim different banks.
- Controller does its own `DossierSummary` mapping with a direct `CompletenessEngine` call. Move to aggregator for consistency once the aggregator interface stabilises.
- Completeness score formula slightly drifts from Architecture §5 (`completedItems = total - missing.length` rather than counting actual checks). Reconcile when the score is used for ranking.
