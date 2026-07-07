# Corp Scoring Remote Iterations: Forced Scoreline Funding Floor 2026-07-07

Status: accepted

## Problem

Pair G Seed `ai-v143-tuning-001` showed a concrete forced-scoreline conflict after the simulation scope fix:

- The Corp had an active/emergency scoreline in `remote_1`.
- The scoring-window evidence said `recommended_next_step:gain_credit`.
- The remote rez-floor evidence required funding, but `dynamicProtectionReserve` was `0`.
- Triage therefore emitted `force_scoreline_clock` with `requiredRezFloor:0`.
- `gain_credit` received a hard triage mismatch, while an underfunded `advance_card` stayed aligned and won despite a negative total score.

This is a logical scoring bug: a critical scoreline clock must not suppress the funding action that makes the scoreline defensible when the same evidence says the remote rez floor is unmet.

## Fix

- Forced scoreline triage now derives `requiredRezFloor` from positive dynamic reserve first, then from blocked remote rez-floor evidence including the action cost.
- Underfunded concrete scoreline pushes become mismatches when legal economy exists.
- Economy actions can match a forced scoreline clock, including emergency HQ-flood conversion, when they fund the unmet remote floor.

## Verification

Focused tests:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts -t "funds an emergency HQ-flood scoreline" --maxWorkers=1 --testTimeout=120000
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-board-triage.test.ts src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=120000
```

Both passed.

Behavior check:

- Pair G Seed `ai-v143-tuning-001` no longer chooses `install agenda + advance` at 1 credit in the observed forced-scoreline floor conflict.
- It now chooses funding actions at the critical point. The game still ends as Runner win, so this is a local correctness fix rather than a solved match.

Benchmarks:

- Strategy panel 20 after fix: `docs/reviews/ai/corp-scoring-remote-iterations-forced-scoreline-funding-floor-panel-20-2026-07-07.json`
  - unchanged win split vs scope-fix baseline: Runner 12 / Corp 7 / Limit 1.
  - Corp scores 30, Runner steals 31, unsafeScoreChosen 1.
- Latest-match 30 after fix: `docs/reviews/ai/corp-scoring-remote-iterations-forced-scoreline-funding-floor-30-2026-07-07.json`
  - unchanged win split vs scope-fix baseline: Runner 8 / Corp 22.
  - average Runner AP 4.067 vs 4.100 baseline, average Corp AP unchanged at 3.433.
  - no action limits, replay failures or games with errors.

## Decision

Keep the fix. It does not move the aggregate benchmark, but it removes a verified internal contradiction without measurable regression.
