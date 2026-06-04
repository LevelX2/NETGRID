# AI054 Legacy-vs-Semantic Comparison Report

Date: 2026-06-04
Primary agent: `release-implementation-agent`
Branch: `codex/ai051-ai060-controlled-shadow-mode`
Status: `done`

## Scope

AI054 compares the AI053 semantic shadow decision with a legacy reference for
every AI052 fixture. Because AI052 is still a synthetic LegalAction corpus, the
legacy reference is explicitly marked as
`synthetic_fixture_legal_action_order`. It is a deterministic comparison anchor,
not a claim that Legacy is strategically correct.

No comparison result is executed. `actualDecision` remains the legacy decision.

## Result

| Metric | Value |
| --- | --- |
| Comparisons | 33 |
| `same_action` | 8 |
| `same_action_type` | 0 |
| `different_but_plausible` | 0 |
| `semantic_blocked` | 25 |
| `comparison_unavailable` | 0 |
| Hard gate errors | 0 |
| Hidden-info-based semantic decisions | 0 |
| Unreachable semantic decisions | 0 |
| Non-engine-legal semantic decisions | 0 |

## Delta Categories

The comparison maps blocked semantic decisions to controlled categories:

- `semantic_blocked_by_target_context`
- `semantic_blocked_by_ability_gap`
- `semantic_blocked_by_cost_gap`
- `semantic_lacks_card_semantics`
- `semantic_avoids_hidden_info`
- `same_exact_action`

Uncertain comparison evidence remains explicitly tied to the synthetic legacy
reference source.

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
| `node scripts/check-ai054-legacy-vs-semantic-comparison-report.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test -- controlled-shadow-mode.test.ts` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `node scripts/check-ai053-semantic-shadow-decision-v0.mjs` | passed |
| `git diff --check` | passed |

## Gate Result

AI054 is complete. Every fixture produces a comparison, all deviations are
categorized, and illegal, hidden-info-based, unreachable or non-engine-legal
semantic decisions remain at zero.
