# Corp Scoring Remote Iterations: After Main Sync Panel

Status: evidence

## Context

The Corp scoring remote iteration worktree was synced with `main` after the own-deck-snapshot runtime requirement and related server fixes landed there. This panel records whether that merge changed the current strategy-panel smoke baseline.

## Command

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --no-default-pairs --pair-file docs/reviews/ai/ai108-alternate-deck-pairs-2026-06-12.json --out docs/reviews/ai/corp-scoring-remote-iterations-after-main-sync-panel-20-2026-07-07.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005 --max-actions 480 --max-findings 80
```

The run took roughly nine minutes and completed with a redaction-safe result.

## Result

| Metric | Before main sync | After main sync |
| --- | ---: | ---: |
| Games | 20 | 20 |
| Wins | Runner 11 / Corp 7 / Limit 2 | Runner 11 / Corp 7 / Limit 2 |
| Average actions | 215.45 | 215.45 |
| Corp agenda scores | 30 | 30 |
| Runner agenda steals | 28 | 28 |
| Unsafe score chosen | 0 | 0 |
| Passive scoreline diagnostics | 22 | 22 |
| Recovery low-value loop findings | 311 | 247 |
| Repeated no-progress run findings | 133 | 133 |
| Plan-step mismatches | 459 | 459 |

## Per Pair

| Pair | Label | Wins | Corp scores | Runner steals | Notes |
| --- | --- | --- | ---: | ---: | --- |
| E | Event Pressure vs Tag Ops Control | Runner 5 | 3 | 10 | Weakest Corp slot; remains the clearest tag-punish/scoring-pressure holdout problem. |
| F | Starter Pressure vs Starter Score Grid | Runner 3 / Corp 2 | 8 | 4 | Stable starter scoreline signal. |
| G | Stealth Interface Starter vs Ivory Bastion | Runner 2 / Corp 1 / Limit 2 | 7 | 10 | Still produces unresolved long-game/action-limit outcomes. |
| H | Blink Pressure Rig vs Siren Fortress | Corp 4 / Runner 1 | 12 | 4 | Current strongest Corp scoring-remote slot. |

## Decision

Keep the merged `main` state as the new iteration base. The merge did not move the headline 20-game outcome, but it reduced recovery-loop diagnostics and keeps the newer deck-snapshot runtime contract in the benchmark path.
