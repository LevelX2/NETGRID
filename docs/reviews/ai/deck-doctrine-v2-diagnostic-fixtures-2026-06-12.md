# DeckDoctrine v2 Diagnostic Fixtures 2026-06-12

Status: diagnostic-only, no runtime consumer, no planner weights, no action selection.

## Real Snapshot Matrix

The DeckDoctrine v2 fixture test now uses real project deck snapshots from `data/decks/deck-snapshots-0.8.json` instead of relying only on synthetic diagnostic decks.

| Snapshot                                              | Side   | Purpose                                 |
| ----------------------------------------------------- | ------ | --------------------------------------- |
| `demo_runner_008_snapshot_v0_8`                       | runner | V0.8 demo Runner deck baseline          |
| `demo_corp_008_snapshot_v0_8`                         | corp   | V0.8 demo Corp deck baseline            |
| `onr_origin_runner_ai_snapshot_v1`                    | runner | Originalset Runner AI deck              |
| `onr_origin_corp_ai_snapshot_v1`                      | corp   | Originalset Corp AI deck                |
| `proteus_runner_hq_virus_derez_snapshot_v2026_05_25`  | runner | Proteus Runner pressure/control deck    |
| `proteus_corp_region_fast_score_snapshot_v2026_05_25` | corp   | Proteus Corp remote/region scoring deck |

## Assertions

- Every listed snapshot resolves to a non-`unknown_snapshot` DeckDoctrine v2 diagnostic.
- Runner and Corp sides are both represented.
- At least one real snapshot remains `partial`, so the diagnostic does not over-promote incomplete evidence.
- `anchorless` remains `NeutralDoctrine` and must have zero strategy anchors.
- Non-anchorless diagnostics must have real strategy anchors.
- Diagnostics stay `diagnostic_only` with `productiveUseAllowed=false`.
- Serialized diagnostics are checked for hidden-info/runtime markers such as `cardInstances`, private payloads, tokens, `stateHash`, `deckHash` and `legalActions`.

Verification:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/deck-doctrine-strategy.test.ts`
