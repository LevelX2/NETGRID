# AI058 Shadow Evaluation Batch Report

Date: 2026-06-04
Primary agent: `release-implementation-agent`
Branch: `codex/ai051-ai060-controlled-shadow-mode`
Status: `done`

## Scope

AI058 runs the AI057 diagnostic harness across the AI052 fixture corpus and
summarizes comparison, triage, hard gates, gaps and followups.

The harness is enabled only inside this diagnostic batch builder. It has no
productive runtime consumer and every `actualDecision` remains equal to the
synthetic legacy reference.

## Batch Summary

| Metric | Value |
| --- | --- |
| Scenario count | 33 |
| Decision points | 33 |
| Hard gate failures | 0 |
| Known bad decisions | 0 |
| Actual-decision overrides | 0 |
| Runtime effects | 0 |
| `same_action` comparisons | 8 |
| `semantic_blocked` comparisons | 25 |
| Human-review items | 33 |

## Top Semantic Gaps

| Gap | Count |
| --- | --- |
| `target_context_unavailable` | 13 |
| `card_semantics_unavailable` | 7 |
| `ability_unresolved` | 6 |
| `cost_unknown` | 4 |
| `hidden_info_blocked` | 3 |

## Recommended Followups

- Project side-safe TargetContext for target-sensitive LegalActions.
- Bind multi-ability card LegalActions to explicit side-safe ability ids.
- Add side-safe card semantic profiles before treating card-sourced strategy as available.
- Normalize cost and timing evidence for X-value, trace and access trash decisions.
- Keep hidden-info boundary fixtures blocked and review only their visibility policy.

## No-Effect Confirmation

| Flag | Value |
| --- | --- |
| `actualDecisionOverride` | `false` |
| `productiveScoring` | `false` |
| `plannerWeightChange` | `false` |
| `engineMutation` | `false` |
| `legalityGeneration` | `false` |
| `publicPayloadChange` | `false` |
| `hiddenInfoLeak` | `false` |
| `featureFlagCutover` | `false` |

## Verification

| Command | Result |
| --- | --- |
| `node scripts/check-ai058-shadow-evaluation-batch-report.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test -- controlled-shadow-mode.test.ts` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `node scripts/check-ai057-runtime-shadow-harness.mjs` | passed |
| `git diff --check` | passed |

## Gate Result

AI058 is complete. All fixtures run, the report is complete, hard gate errors
are zero, and there is no runtime effect.
