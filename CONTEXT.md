# Domain vocabulary

Stable terms used in code, types, and conversation. New terms land here when they first cross a module seam.

## Case

A financing request bundled with its company, documents, financial indicators, bank flows, and (when applicable) factoring indicators. Everything the analyst needs in one structure. See `AugmentedCase` in `backend/src/cases/types.ts`.

## Rule

A single named check on a `RuleInput`. Owns its `evaluate(input)` (status + display value), its `toRedFlags(evaluation, input)` (emissions when the threshold is crossed), and its descriptive metadata (label, threshold, rationale). Rules live in `RULES` inside `backend/src/rule-engine/rule-engine.ts`.

## RedFlagCategory

The *source* of a rule — `financial` (liasse-derived), `bank` (relevés-derived), `factoring` (factoring-only KPIs). Drives UI grouping in the diagnostics panel.

## Theme

A *view* over rules grouping them by the analytical question they answer about the case — currently `profitability`, `debt`, `cash`. Orthogonal to `RedFlagCategory`: a `financial`-category rule like `debt_to_ebitda` belongs to the `debt` theme; a `bank`-category rule like `overdraft_days` belongs to the `cash` theme.

Each rule that contributes to the 3-bullet synthesis carries a `theme` tag. Each emitted `RedFlag` inherits that tag and carries its own `explanation` sentence — the bullet text shown when this flag is the severest in its theme. Per-theme positive defaults (used when no flag fires in a theme) live in `THEMES.<theme>.whenAllGreen(input)`.

Factoring rules and `flows_balance` intentionally carry no `theme` — they show up in the diagnostic tiles but not in the synthesis bullets.

## Red flag

An emission from a rule that crossed its threshold. Carries severity, value, threshold, rationale, the inheriting rule's `category` and `theme`, and a per-emission `explanation` sentence.

## Cockpit

The composed read-model returned by `CockpitAggregator.getCockpit(id)`: case + completeness + red flags + score explanation + metric statuses + rules diagnostic + data coverage. The single payload the frontend consumes for the case page.
