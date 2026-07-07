# Corp Scoring Remote Iterations: Passive Scoreline Metric Fix 2026-07-07

Status: accepted

## Scope

The change is benchmark hygiene only. It does not alter Corp runtime action scoring.

`passiveActionWithScoreLineAvailable` previously counted any skipped Corp action inside a broad terminal scoreline diagnostic window. In the strategy panel this inflated the metric with scoreline setup windows and agenda-install-only windows that were blocked by runner contest, credits, or central safety concerns.

## Evidence

Focused Pair G/H diagnostics before the fix:

| Pair | Old passive count | Concrete score/advance skips without blockers |
| --- | ---: | ---: |
| G Stealth Interface Starter vs Ivory Bastion | 216 | 0 |
| H Blink Pressure Rig vs Siren Fortress | 194 | 0 |

Dominant old clusters were `kind:none` setup windows and `kind:install` agenda-install windows, not missed `score_agenda` or final `advance_card` decisions.

Post-fix G/H recount with the same five seeds and `maxActions=480`:

| Pair | New passive count | Result |
| --- | ---: | --- |
| G | 7 | Runner 2 / Corp 1 / Limit 2 |
| H | 23 | Runner 1 / Corp 4 |

## Fix

The passive scoreline counter now requires one of:

- legal `score_agenda`;
- legal final `advance_card`;
- legal agenda install into a protected, low-contest, credit-sufficient remote without scoreline blockers.

The action-limit cluster classifier uses the same concrete-scoreline filter so setup windows no longer dominate `action_limit_corp_scoreline_stall`.

## Verification

Commands:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/score-window-counts.test.ts src/simulation/benchmark-reports.test.ts --maxWorkers=1 --testTimeout=120000
corepack pnpm --filter @netgrid/ai typecheck
```

Both passed.

## Decision

Keep this change. It removes misleading benchmark pressure before the next Corp runtime tuning step.
