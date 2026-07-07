# Corp Scoring Remote Iterations: Strategy Panel Smoke 2026-07-07

Status: evidence_baseline

## Scope

Small strategy-panel smoke for the active `codex/corp-scoring-remote-iterations` branch after `18200d06f fix(ai): require concrete score-remote protection`.

Command shape:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --no-default-pairs --pair-file docs/reviews/ai/ai108-alternate-deck-pairs-2026-06-12.json --out <out> --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005 --max-actions 480 --max-findings 50
```

Artifacts:

- Branch: `docs/reviews/ai/corp-scoring-remote-iterations-strategy-panel-smoke-20-2026-07-07.json`
- Main comparison: `docs/reviews/ai/corp-scoring-remote-iterations-strategy-panel-main-smoke-20-2026-07-07.json`

## Overall Result

| Metric | Main | Branch |
| --- | ---: | ---: |
| Games | 20 | 20 |
| Wins | Runner 11 / Corp 7 / Limit 2 | Runner 11 / Corp 7 / Limit 2 |
| Avg Runner AP | 2.95 | 3.55 |
| Avg Corp AP | 3.95 | 3.90 |
| Avg actions | 223.2 | 238.3 |
| Corp agenda scores | 31 | 32 |
| Runner agenda steals | 25 | 29 |
| Passive scoreline diagnostics | 587 | 670 |
| Repeated no-progress runs | 124 | 151 |
| Recovery low-value loop findings | 292 | 337 |
| Plan step mismatches | 471 | 524 |

No illegal actions, replay failures, hidden-info findings, or critical/high findings appeared in either run.

## Per-Pair Result

| Pair | Strategy | Main | Branch | Read |
| --- | --- | --- | --- | --- |
| E | Event Pressure vs Tag Ops Control | Runner 5 / Corp 0 | Runner 5 / Corp 0 | Unchanged result, branch longer and noisier. |
| F | Starter Pressure vs Starter Score Grid | Runner 4 / Corp 1 | Runner 3 / Corp 2 | Branch improves one seed and reduces passive scoreline diagnostics. |
| G | Stealth Interface Starter vs Ivory Bastion | Runner 1 / Corp 2 / Limit 2 | Runner 2 / Corp 1 / Limit 2 | Branch worsens; one Corp win becomes a limit, one limit becomes Runner win. |
| H | Blink Pressure Rig vs Siren Fortress | Runner 1 / Corp 4 | Runner 1 / Corp 4 | Same wins, but Runner AP and steals increase on branch. |

## Interpretation

The accepted score-remote protection fix remains supported by the single-deck 30-game baseline, but this panel does not yet prove that it is globally merge-ready. It improves pair F, but hurts pair G and makes pair H more steal-prone despite unchanged wins.

The likely lesson is not to remove the access-stop requirement again globally. The evidence points toward a strategy-dependent gap: some non-ETR or access-punish ICE may be meaningful in punish/control decks, but treating all such ICE as durable scoring protection would reintroduce the original unsafe-agenda problem.

Next candidate should therefore be narrow and side-safe:

- keep hard access-stop as the default concrete scoring-remote protection;
- only consider non-stopping access-punish as partial protection when the deck/runtime strategy has a concrete punish payoff and the action does not create a free agenda gift;
- test against both the original latest-match benchmark and this strategy panel before merge.

## Decision

Do not merge `18200d06f` to `main` solely on the single-deck benchmark. Keep it in the worktree while the next candidate is tested against the strategy panel.
