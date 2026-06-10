# AI079 Action-Limit Root-Cause Reducer Review

Datum: 2026-06-10

## Ergebnis

AI079 ist als Diagnostic-only-Paket umgesetzt. `runAiSelfplayTraceMining` liefert jetzt `aggregate.actionLimitClusters`, und der Matrix-Runner spiegelt die Cluster in `diagnostics.actionLimitClusters`. Jedes Action-Limit-Spiel wird genau einem dominanten Cluster zugeordnet, sodass die Summe der Cluster `actionLimitReached` entspricht.

## Cluster

- `action_limit_runner_repeated_no_progress_run`
- `action_limit_runner_remote_contest_blocked`
- `action_limit_corp_scoreline_stall`
- `action_limit_setup_economy_loop`
- `action_limit_low_value_repeat`
- `action_limit_mixed_or_unknown`

## A-D-x5 Trace-Mining

JSON: `docs/reviews/ai/ai079-action-limit-root-cause-reducer-a-d-5seed-2026-06-10.json`

| Metric | Wert |
| --- | ---: |
| games | 20 |
| decisions | 2571 |
| findings | 829 |
| criticalFindings | 0 |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitReached | 11 |
| allRedactionSafe | 1 |
| repeated_known_no_payoff_remote | 0 |
| repeated_no_progress_run | 35 |
| recovery_low_value_loop | 2 |
| unsafeScoreChosen | 6 |
| passiveActionWithScoreLineAvailable | 6 |
| corpAgendaScores | 14 |

| Cluster | Matches |
| --- | ---: |
| `action_limit_low_value_repeat` | 8 |
| `action_limit_mixed_or_unknown` | 3 |
| `action_limit_runner_repeated_no_progress_run` | 0 |
| `action_limit_runner_remote_contest_blocked` | 0 |
| `action_limit_corp_scoreline_stall` | 0 |
| `action_limit_setup_economy_loop` | 0 |

| Pair | ActionLimit | LowValueRepeat | Mixed |
| --- | ---: | ---: | ---: |
| A | 1 | 1 | 0 |
| B | 3 | 3 | 0 |
| C | 4 | 3 | 1 |
| D | 3 | 1 | 2 |

## Fix-Entscheidung

Kein Runtime-Fix in AI079. Der dominante Cluster ist zwar `low_value_repeat`, aber die betroffenen Endfenster mischen Gain-/Draw-/Ability-/Install- und Run-Step-Sequenzen. Ein generischer Penalty auf wiederholte No-Progress-Aktionen wuerde legitime Run-Fortsetzung, Break-Subroutinen und notwendige Economy-Fenster treffen. Damit ist die Ursache fuer eine sichere Einzelfix-Klasse noch nicht klar genug.

Der naechste belastbare Fix sollte aus einem engeren Subcluster kommen, z. B. explizit wiederholte Gain-Credit-Loops ohne Funding-Need oder wiederholte Recovery-/Ability-Loops ohne Coverage-/Funding-Ziel. Die neue Diagnostik liefert dafuer die notwendige Grundlage.

## Testnachweis

- `corepack pnpm --filter @netgrid/ai typecheck`: PASS
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "late-game|action limit|progress pressure"`: PASS, 1 Test
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts`: PASS, 8 Tests
- `git diff --check`: PASS
