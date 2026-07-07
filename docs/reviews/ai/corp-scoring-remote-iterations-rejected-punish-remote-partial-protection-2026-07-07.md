# Rejected Candidate: Punish Remote Partial Protection

Status: rejected_no_effect

## Hypothesis

The strategy-panel regression after `18200d06f` might come from treating all non-stopping tag/damage/trace ICE as unusable score-remote protection. A narrow candidate allowed such ICE to count as concrete remote protection only when:

- the Corp strategic intent was punish-primary;
- the ICE had visible tax/damage/tag/trace potential;
- the ICE was not position-dependent;
- the Runner steal would not be game-ending.

The existing non-punish Hunter regression remained protected by a focused test.

## Validation

Focused checks while the candidate was active:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-board-triage.test.ts --maxWorkers=1 --testTimeout=30000
corepack pnpm --filter @netgrid/ai typecheck
```

Both passed.

Latest-match 30-game benchmark:

- Baseline `remote-protection-access-stop`: Runner 8 / Corp 22, avg Runner AP 4.133, avg Corp AP 3.533.
- Candidate `punish-remote-partial-protection`: Runner 8 / Corp 22, avg Runner AP 4.133, avg Corp AP 3.533.
- No seed changed.

Strategy-panel 20-game benchmark:

- Branch baseline: Runner 11 / Corp 7 / Limit 2, avg Runner AP 3.55, avg Corp AP 3.90.
- Candidate: Runner 11 / Corp 7 / Limit 2, avg Runner AP 3.55, avg Corp AP 3.90.
- Aggregate diagnostics were identical.

Artifacts:

- `docs/reviews/ai/corp-scoring-remote-iterations-punish-remote-partial-protection-30-2026-07-07.json`
- `docs/reviews/ai/corp-scoring-remote-iterations-punish-remote-partial-protection-30-2026-07-07.md`
- `docs/reviews/ai/corp-scoring-remote-iterations-punish-remote-partial-protection-panel-20-2026-07-07.json`

## Decision

Rejected and reverted. The idea is logically plausible, but the tested deck panels did not exercise it and it did not move any decision. Keep the existing hard access-stop remote protection rule until a concrete game trace shows this exact missing behavior.
