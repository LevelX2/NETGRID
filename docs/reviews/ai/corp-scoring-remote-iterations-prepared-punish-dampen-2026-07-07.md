# Corp Scoring Remote Iterations: Prepared Punish Dampen

Status: accepted

## Problem

`corp_punish_primary_speculative_scoreline_dampen` applied to every non-immediate scoreline root install for punish-primary Corp decks. That was too broad when a score remote was already prepared and the concrete scoring-window assessment said the remote was safe, funded and not contestable before the next score.

The observed H/Seed002 case showed prepared `remote_1` agenda installs repeatedly losing to passive economy or central installs because the scoreline root received the generic `-1800` punish-primary dampen despite also receiving `corp_existing_score_remote_pipeline`.

## Fix

The dampen is now skipped only for a narrow prepared-score-remote commitment:

- action is a scoreline root install into the already prepared remote;
- current Corp credits meet the prepared remote reserve floor;
- Board triage is not high/critical `protect_hq` or `protect_rd`;
- scoring window is `durable` or `temporary_safe`;
- Runner cannot contest/reach access before the score;
- steal severity is normal/none and not near-win by points after steal;
- relevant ICE/full path is affordable, with no dynamic-protection weakness.

Broader drafts were rejected during tuning. In particular, skipping the dampen without the near-win guard regressed Pair H from the stored 4 Corp / 1 Runner baseline to 3 Corp / 2 Runner, because Seed001 became a Runner win.

## Evidence

Focused regression tests:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=120000
```

Result: 1 file / 85 tests passed.

Typecheck and diff hygiene:

```powershell
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Result: both passed.

Strategy-panel smoke:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --no-default-pairs --pair-file docs/reviews/ai/ai108-alternate-deck-pairs-2026-06-12.json --out docs/reviews/ai/corp-scoring-remote-iterations-prepared-punish-dampen-panel-20-2026-07-07.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005 --max-actions 480 --max-findings 80
```

Stored baseline: `docs/reviews/ai/corp-scoring-remote-iterations-strategy-panel-after-scope-fix-20-2026-07-07.json`

| Metric | Baseline | Candidate |
| --- | ---: | ---: |
| Games | 20 | 20 |
| Wins | Runner 12 / Corp 7 / Limit 1 | Runner 11 / Corp 7 / Limit 2 |
| Average actions | 219.25 | 215.45 |
| Corp agenda scores | 30 | 30 |
| Runner agenda steals | 31 | 28 |
| Unsafe score chosen | 1 | 0 |
| Passive scoreline diagnostics | 607 | 22 |
| Recovery low-value loop findings | 337 | 311 |
| Plan step mismatches | 482 | 459 |

Pair H moved from Runner 1 / Corp 4 with 11 Corp scores, 5 Runner steals and 1 unsafe score to Runner 1 / Corp 4 with 12 Corp scores, 4 Runner steals and 0 unsafe scores.

## Decision

Keep this narrow fix. It preserves the H win baseline, improves scoreline diagnostics and avoids the earlier broad-candidate regression.
