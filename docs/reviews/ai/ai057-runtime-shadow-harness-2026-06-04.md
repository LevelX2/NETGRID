# AI057 Runtime Shadow Harness, disabled by default

Date: 2026-06-04
Primary agent: `release-implementation-agent`
Branch: `codex/ai051-ai060-controlled-shadow-mode`
Status: `done`

## Scope

AI057 adds a diagnostic harness wrapper that can calculate semantic shadow data
only when explicitly enabled in a test/diagnostic call. The default config is
off.

No productive AI, server, engine, player-view, public-event, WebSocket,
Reconnect, Undo, Replay or client-error path imports the harness.

## Config Contract

```json
{
  "semanticAiShadowModeEnabled": false,
  "diagnosticsOnly": true,
  "visibilityScope": "developer_only",
  "productiveCutoverAllowed": false,
  "publicPayloadChangesAllowed": false
}
```

## Actual Decision Contract

The harness result always returns:

```text
actualDecision === legacyDecision
```

When diagnostics are disabled, no semantic shadow decision or trace is produced.
When diagnostics are explicitly enabled, the semantic shadow decision and trace
remain developer-only and `actualDecision` is still the exact legacy decision
object.

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
| `node scripts/check-ai057-runtime-shadow-harness.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test -- controlled-shadow-mode.test.ts` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `node scripts/check-ai056-shadow-metrics-and-quality-gates.mjs` | passed |
| `git diff --check` | passed |

## Gate Result

AI057 is complete. The flag defaults to false; enabled diagnostics preserve
`actualDecision === legacyDecision`; the harness is not imported by productive
runtime files; no public payload changes exist; the semantic shadow decision is
never an executed action.
