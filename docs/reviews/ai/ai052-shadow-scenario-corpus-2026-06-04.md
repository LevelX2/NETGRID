# AI052 Shadow Scenario Corpus

Date: 2026-06-04
Primary agent: `release-implementation-agent`
Branch: `codex/ai051-ai060-controlled-shadow-mode`
Status: `done`

## Scope

AI052 defines the repeatable controlled-shadow fixture corpus for later semantic
shadow decisions, comparisons, metrics and regression tests.

No scenario is counted as runtime-backed in this step. The corpus is intentionally
`synthetic_legal_actions` until later steps choose which fixtures can be
materialized safely. This keeps the process conservative and avoids guessed
semantics.

## Corpus

Fixture reference:

- `data/scenarios/ai052-shadow-scenario-corpus-2026-06-04.json`

Summary:

| Metric | Value |
| --- | --- |
| Scenario count | 33 |
| Runner scenarios | 16 |
| Corp scenarios | 17 |
| Advanced scenarios | 7 |
| Allowed shadow scenarios | 33 |
| Runtime-backed scenarios | 0 |
| Synthetic LegalAction scenarios | 33 |

Required families are present:

- Runner basics, install/setup, central pressure, remote contest, access,
  tag removal, survival, jack-out/continue and break-subroutine decisions.
- Corp basics, install/rez/advance/score, remote scoring, central defense,
  trace/tag punish, damage kill, ambush/bait and operation-play decisions.
- Advanced trace, X-value, multi-target, source-target counter, hidden-info and
  multi-ability unresolved cases.

## Known Gaps

Known gaps are documented, not guessed:

- `target_context_unavailable`
- `ability_unresolved`
- `card_semantics_unavailable`
- `cost_unknown`
- `hidden_info_blocked`

## Hidden-Info Boundary

Every fixture carries an explicit `hiddenInfoBoundary`. The default boundary is:

- No full `GameState`.
- No opponent hidden hand, deck, HQ, R&D, grip or stack contents.

Individual hidden-info fixtures add stricter boundaries for unrezzed ICE,
Runner-hidden resources and Runner-unknown remote contents.

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
| `node scripts/check-ai052-shadow-scenario-corpus.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test -- controlled-shadow-mode.test.ts` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `node scripts/check-ai051-shadow-mode-trace-contract.mjs` | passed |
| `git diff --check` | passed |

## Gate Result

AI052 is complete. Runner, Corp and advanced scenarios are present; LegalAction
types, TacticalGoals, HiddenInfoBoundary and KnownGaps are documented; no
runtime effect or productive consumer was introduced.
