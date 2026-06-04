# AI051 Shadow Mode Trace Contract

Date: 2026-06-04
Primary agent: `release-implementation-agent`
Branch: `codex/ai051-ai060-controlled-shadow-mode`
Status: `done`

## Scope

AI051 defines a stable developer-only trace contract for controlled shadow mode.
The trace can place the legacy decision and the semantic shadow decision next to
each other, but it does not execute the semantic decision.

Core rule:

```text
legacyDecision = chooseLegacyAiAction(input)
semanticShadowDecision = chooseSemanticAiActionShadow(input)
actualDecision = legacyDecision
writeDeveloperOnlyShadowTrace(legacyDecision, semanticShadowDecision)
```

`actualDecision` remains the legacy decision. In plain contract form:
actualDecision remains the legacy decision. The semantic shadow decision is
diagnostic only.

## Implemented Contract

Code contract:

- `packages/ai/src/controlled-shadow-mode.ts`
- `ShadowDecisionTrace`
- `LegacyDecisionTrace`
- `SemanticShadowDecisionTrace`
- `LegalActionTraceSummary`
- `ActionSemanticCandidateSummary`
- `TacticalGoalTrace`
- `DeckDoctrineReadinessTrace`
- `ShadowHardGateSummary`
- `LegacySemanticComparisonTrace`
- `buildShadowModeTraceContractReport()`

Trace invariants:

- `visibilityScope: "developer_only"`
- `noRuntimeEffect: true`
- `legacyDecision.source: "legacy_ai"`
- `legacyDecision.selectedFromLegalActions: true`
- `semanticShadowDecision.noRuntimeEffect: true`
- `actualDecisionContract: "actualDecision_equals_legacyDecision"`
- hard-gate counters for illegal semantic decisions, hidden-info violations,
  runtime effects, actual-decision overrides and non-engine-legal assumptions
  are part of the contract.

## Forbidden Consumers

The trace contract explicitly names these consumers as forbidden:

- `applyAction`
- `PlayerAction`
- `PublicEvent`
- `PlayerView`
- WebSocket payload
- Reconnect payload
- Undo preview
- Replay payload
- Client error
- Planner weights
- Productive feature flag

No runtime file imports `controlled-shadow-mode`.

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
| `node scripts/check-ai051-shadow-mode-trace-contract.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test -- controlled-shadow-mode.test.ts` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `node scripts/check-ai047-shadow-scoring-fixture-design.mjs` | passed |
| `node scripts/check-ai048-shadow-only-action-ranking-report.mjs` | passed |
| `node scripts/check-ai049-legacy-vs-semantic-comparison-harness.mjs` | passed |
| `node scripts/check-ai050-hard-gate-rollback-readiness-review.mjs` | passed |
| `git diff --check` | passed |

## Gate Result

AI051 is complete. The trace schema exists, is developer-only, has no runtime
effect, introduces no productive import and contains no hidden-info projection
surface.
