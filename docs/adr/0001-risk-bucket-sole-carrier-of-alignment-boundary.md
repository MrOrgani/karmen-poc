---
status: accepted
---

# `risk_bucket` is the sole carrier of the decision-alignment boundary

## Context

The AI justification spike (`backend/src/decisions`) only drafts prose once a deterministic
guardrail, `decisionAlignment(direction, riskBucket)`, has classified the analyst's chosen
direction as `aligned`, `judgment-zone`, or `divergent`. That classification gates the LLM:
aligned → it dresses up the diagnostic bullets; judgment-zone → it lays out one pro and one
caution without deciding; divergent → the LLM is short-circuited and a deterministic warning is
returned instead. The boundary therefore decides *whether and how* the AI speaks — it does not
decide the credit outcome, which the analyst still records separately.

Two independent risk signals exist in the system: `score.risk_bucket`, which is **Karmen's own
scoring verdict and ships exogenous in the case data** (`data/raw`), and the **red flags**, which
this repo's `RuleEngine` computes independently from financial/bank/factoring metrics — the
factoring KPIs being **simulated** for the demo (only Fleurs de Saison carries them).

## Decision

The alignment boundary reads **`risk_bucket` only**. Red-flag severity does **not** feed the
boundary; red flags inform the *prose* of the justification (and remain visible to the analyst in
the diagnostic tiles), but never the classification.

## Considered options

- **Rejected — let a high-severity red flag force `divergent`.** This lets a hand-built, and for
  factoring *simulated*, flag overrule the institution's own risk classification — backwards. It
  also flips a legitimately `medium` case to `divergent`: on Fleurs de Saison (Karmen score =
  `medium`, judgment zone) the factoring flag `CONCENTRATION_TOP_CLIENT` would have suppressed the
  balanced pro/caution draft exactly where the analyst most needs it.
- **Accepted — bucket as single carrier, red flags confined to prose.**

## Consequences

- The boundary inherits the calibration of Karmen's upstream scoring model: a miscalibrated bucket
  (a grave risk that fails to move the bucket) would not be caught here. This is an accepted
  dependency on the existing scoring engine, which is out of scope for this POC.
- The guardrail is a pure, unit-tested function (`decision-alignment.spec.ts`) computed before any
  LLM call — the "AI is never decisional" property holds by construction.
