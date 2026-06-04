# AI056 Shadow Metrics and Quality Gates

Date: 2026-06-04
Primary agent: `release-implementation-agent`
Branch: `codex/ai051-ai060-controlled-shadow-mode`
Status: `done`

## Scope

AI056 defines Shadow Mode metrics, hard gates and gate-failure policy. It does
not enable runtime behavior and does not make cutover decisions.

## Hard Gates

All hard safety gates require zero failures.

| Gate | Value | Required | Status |
| --- | --- | --- | --- |
| `illegalSemanticDecisionCount` | 0 | 0 | pass |
| `hiddenInfoViolationCount` | 0 | 0 | pass |
| `runtimeEffectCount` | 0 | 0 | pass |
| `actualDecisionOverrideCount` | 0 | 0 | pass |
| `nonEngineLegalAssumptionCount` | 0 | 0 | pass |
| `determinismFailureCount` | 0 | 0 | pass |

## Quality Metrics

| Metric | Value |
| --- | --- |
| `semanticDecisionAvailableRate` | 0.2424 |
| `semanticBlockedByGapRate` | 0.6667 |
| `sourceResolvedRate` | not measured; synthetic corpus |
| `abilityResolvedRate` | not measured; synthetic corpus |
| `targetContextAvailableRate` | not measured; synthetic corpus |
| `cardSemanticJoinedRate` | not measured; synthetic corpus |
| `sameActionRate` | 0.2424 |
| `sameActionTypeRate` | 0 |
| `acceptableDifferenceRate` | 0.1951 |
| `humanReviewRate` | 0.8049 |
| `semanticImprovementCandidateRate` | 0 |
| `legacyBetterCandidateRate` | 0 |

## Quality Gates

| Gate | Threshold | Current | Status | Policy |
| --- | --- | --- | --- | --- |
| initial semantic decision availability | `>= 0.8` | 0.2424 | `fail_quality_gap` | carry to AI060 |
| future semantic decision availability | `>= 0.95` | 0.2424 | `fail_quality_gap` | carry to AI060 |
| human-review rate documented | documented | 0.8049 | pass | no hard threshold initially |

The availability quality gates are not safety blockers in AI056. They are
explicit readiness gaps for AI060.

## Failure Policy

- Hard safety gate failure: `block_process`.
- Quality gate failure: `carry_to_readiness_review`.
- Human-review rate: `document_only_initially`.

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
| `node scripts/check-ai056-shadow-metrics-and-quality-gates.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test -- controlled-shadow-mode.test.ts` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `node scripts/check-ai055-deviation-taxonomy-and-triage.mjs` | passed |
| `git diff --check` | passed |

## Gate Result

AI056 is complete. Hard gates and initial thresholds are documented, gate-failure
policy exists, hard safety gates are green, and the current quality gap is marked
for readiness review without runtime effect.
