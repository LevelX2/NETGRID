# AI059 Shadow Regression Fixtures

Date: 2026-06-04
Primary agent: `release-implementation-agent`
Branch: `codex/ai051-ai060-controlled-shadow-mode`
Status: `done`

## Scope

AI059 derives deterministic regression fixtures from AI058. These fixtures are
diagnostic-only and do not require semantic output to copy Legacy.

Fixture file:

- `data/scenarios/ai059-shadow-regression-fixtures-2026-06-04.json`

## Fixture Types

| Type | Active | Note |
| --- | --- | --- |
| `golden_same_as_legacy` | yes | Same synthetic LegalAction reference stays stable. |
| `golden_semantic_improvement` | no | AI058 produced no `topPotentialImprovements`; no improvement semantics fabricated. |
| `golden_semantic_blocked_by_gap` | yes | Required gaps block semantic selection. |
| `golden_hidden_info_guard` | yes | Hidden-info boundary stays blocked by gate. |
| `golden_illegal_action_guard` | yes | Selected semantic action, when present, must be fixture-legal. |
| `golden_target_context_required` | yes | TargetContext gap remains blocked. |
| `golden_ability_resolution_required` | yes | Ability binding gap remains blocked. |
| `golden_cost_known_required` | yes | Cost gap remains blocked. |

## Summary

| Metric | Value |
| --- | --- |
| Fixtures | 8 |
| Active fixtures | 7 |
| Inactive fixtures | 1 |
| Deterministic output | yes |
| Productive use | false |
| Runtime consumers | 0 |

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
| `node scripts/check-ai059-shadow-regression-fixtures.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test -- controlled-shadow-mode.test.ts` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `node scripts/check-ai058-shadow-evaluation-batch-report.mjs` | passed |
| `git diff --check` | passed |

## Gate Result

AI059 is complete. Known-bad and guard cases are reproducible where present;
hidden-info, illegal-action and required-gap guards are stable; output is
deterministic and diagnostic-only.
