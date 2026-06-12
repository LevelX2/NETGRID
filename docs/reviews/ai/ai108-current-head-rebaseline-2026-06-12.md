# AI108 Current Head Rebaseline

Datum: 2026-06-12

## Ziel

AI108 vermisst den aktuellen Integrationsstand nach AI107 erneut mit dem Standardkorpus A-D-x5. Die Ergebnisanalyse erwartete eine Rebaseline nach `c77ddb1e`; lokal war `main` beim Prozessstart bereits weiter und stand auf `192a1cc6` mit dem Alternate-Deck-Benchmark-Commit.

Der Trace wurde auf dem Paketbranch nach dem Prozessartefakt-Commit ausgeführt. Das JSON trägt daher `gitHead = d8b623a4`. Dieser Stand enthält keine Runtime-Änderung gegenüber `192a1cc6`.

## Git-Kontext

- Lokaler `main` beim Worktree-Start: `192a1cc6`
- `origin/main` beim Worktree-Start: `c77ddb1e`
- Paketbranch-Trace-Head: `d8b623a4`

Push ist nicht Teil dieses Prozesses.

## Nachweis

Trace:

- `docs/reviews/ai/ai108-current-head-a-d-5seed-2026-06-12.json`

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- A-D-x5-Trace
- `git diff --check`

## Ergebnis

| Metrik | AI107 | AI108 |
| --- | ---: | ---: |
| Spiele | 20 | 20 |
| Entscheidungen | 2498 | 2498 |
| Illegale Actions | 0 | 0 |
| Replay-Fehler | 0 | 0 |
| Redaction safe | true | true |
| `actionLimitReached` | 9 | 9 |
| `repeated_no_progress_run` | 31 | 31 |
| `scoreWindowMissed` | 0 | 0 |
| `unsafeScoreChosen` | 3 | 3 |
| `passiveActionWithScoreLineAvailable` | 4 | 4 |
| Corp-Scores | 12 | 12 |
| Runner-Steals | 33 | 33 |
| Corp-Flatlines | 5 | 5 |

Action-Limit-Subcluster:

| Subcluster | AI108 |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 4 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 |
| `corp_late_gain_credit_no_safe_alternative` | 1 |
| `late_draw_without_coverage_or_hand_goal` | 1 |
| `run_microstep_required` | 1 |
| `break_pump_required` | 1 |
| `mixed_unknown` | 0 |
| `continue_without_progress` | 0 |

## Schlussfolgerung

Der AI107-Gatewert `actionLimitReached <= 9` bleibt auf dem aktuellen lokalen Integrationsstand stabil. Die späteren Tooling-/Alternate-Benchmark-Commits verändern den A-D-x5-Korpus nicht. AI109 bis AI112 können daher die bekannten Restklassen aus AI107/AI108 weiterverwenden.
