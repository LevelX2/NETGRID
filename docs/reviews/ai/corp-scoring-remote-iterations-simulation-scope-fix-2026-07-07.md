# Corp Scoring Remote Iterations: Simulation Scope Fix 2026-07-07

Status: accepted

## Problem

The strategy-panel benchmark was order-dependent. Pair G Seed `ai-v143-tuning-001` produced different results depending on whether it was run alone or after other deck pairs in the same matrix process.

Observed before the fix:

- Full 20-game panel: Pair G Seed001 ended as `action_limit_reached`, Runner 3 AP / Corp 5 AP at 480 actions.
- G-only matrix run: Pair G Seed001 ended as Runner win, Runner 8 AP / Corp 0 AP at 100 actions.

Root cause:

- Simulation `createGame` did not receive a unique `matchId`, so simulated games defaulted to `local-demo-match`.
- Simulation `decisionId` was `${seed}:${index}:${side}`.
- TacticalPlanMemory and StrategicIntentMemory use the first `decisionId` segment as memory scope, so different deck pairs with the same seed shared runtime memory.

## Fix

- `simulateAiGame` now resets TacticalPlan/StrategicIntent memory at the start of each simulated game.
- Simulated games now use a deterministic deck-specific simulation scope from seed, runner deck id and corp deck id.
- Simulation `decisionId` now starts with that scope instead of the bare seed.
- `AiSimulationConfig` accepts an optional `matchId` for explicit simulation callers.
- Regression test verifies that Pair G with the same seed is identical whether run in isolation or after another deck pair.

## Verification

Commands:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts --maxWorkers=1 --testTimeout=120000
corepack pnpm --filter @netgrid/ai typecheck
```

Both passed.

Post-fix G-only verification:

- `docs/reviews/ai/corp-scoring-remote-iterations-pair-g-seed-001-isolated-after-scope-fix-2026-07-07.json`
- Result: Runner win, Runner 8 AP / Corp 0 AP at 100 actions.

Post-fix 20-game strategy panel:

- `docs/reviews/ai/corp-scoring-remote-iterations-strategy-panel-after-scope-fix-20-2026-07-07.json`
- Result: Runner 12 / Corp 7 / Limit 1.
- No illegal actions, replay failures, hidden-info findings, critical findings or high findings.

Post-fix latest-match 30-game benchmark:

- `docs/reviews/ai/corp-scoring-remote-iterations-after-scope-fix-30-2026-07-07.json`
- Result: Runner 8 / Corp 22, average Runner AP 4.100, average Corp AP 3.433.
- No action limits, replay failures or games with errors.

## Decision

Keep this fix. It may make Corp results look worse in the strategy panel because previous results were partially inflated by stale memory, but the benchmark must be isolated before any further tuning is meaningful.
