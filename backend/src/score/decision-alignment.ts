import type { RiskBucket } from '../cases/types';

/** The only two verdicts that require judgment synthesis (cf. AI approve/reject menu). */
export type DecisionDirection = 'approve' | 'reject';

/**
 * Where the analyst's chosen decision stands relative to Karmen's risk score (`risk_bucket`).
 * - `aligned`        : the direction agrees with the diagnostic → the LLM may dress up the bullets.
 * - `judgment-zone`  : moderate-risk zone, both directions are defensible → the LLM lays out the pros/cons without deciding.
 * - `divergent`      : the direction contradicts the diagnostic → the LLM does NOT plead, it flags the tension.
 */
export type Alignment = 'aligned' | 'judgment-zone' | 'divergent';

/**
 * Deterministic decision boundary — computed BEFORE any LLM call.
 *
 * This is the "AI is never decisional" guardrail: judgment stays with the analyst
 * (who picks the direction) and with the algorithm (which says whether that direction
 * is supported). The LLM is a mere executor and branches its behaviour on the
 * `Alignment` returned here.
 *
 * `risk_bucket` is the single carrier of expectation for this boundary — a deliberate
 * separation of authority. The bucket is Karmen's own scoring verdict (it ships exogenous in
 * the case data, `data/raw`); the red flags are this RuleEngine's independent diagnostic,
 * partly computed on simulated inputs (e.g. the factoring KPIs). Letting flag severity drive
 * the boundary would let a hand-built — and, for factoring, simulated — flag overrule the
 * institution's risk classification, which is backwards: it flips a legitimately `medium` case
 * (e.g. Fleurs de Saison) to `divergent` and suppresses the balanced draft exactly where the
 * analyst needs it most. Red flags inform the prose, not the boundary. See docs/adr/0001.
 * - `low`    → the case supports approval; rejecting it contradicts the diagnostic.
 * - `high`   → the case supports rejection; approving it contradicts the diagnostic.
 * - `medium` → the judgment zone: both directions are defensible, the analyst arbitrates.
 */
export function decisionAlignment(
  direction: DecisionDirection,
  riskBucket: RiskBucket,
): Alignment {
  if (riskBucket === 'medium') return 'judgment-zone';
  const expected: DecisionDirection =
    riskBucket === 'low' ? 'approve' : 'reject';
  return direction === expected ? 'aligned' : 'divergent';
}
