# AI073 Selfplay Regression Matrix Review 2026-06-10

Status: abgeschlossen

Branch: `codex/ai073-ai080-selfplay-stabilization`

Baseline-Commit: `da507f72 fix(ai): evaluate run access payoff by access target`

Matrix-Artefakt: `docs/reviews/ai/ai073-selfplay-regression-matrix-a-d-5seed-2026-06-10.json`

## Einordnung

AI073 misst den aktuellen Arbeitsstand für die A-D-Selfplay-Deckpaare mit fünf Seeds je Pair. Vor dem Matrixlauf wurde ein bereits im Hauptworkspace vorhandener Runner-Run-Target-Diff in den Paket-Worktree übernommen, typkonsistent gemacht und separat committed. Die Baseline enthält deshalb die korrigierte Unterscheidung zwischen Laufziel und tatsächlichem Access-Ziel.

Der Lauf bleibt diagnostisch. Er ändert keine Runtime-Gewichte, keine LegalAction-Erzeugung und keine Engine-Verträge.

## Konfiguration

```text
Pairs: A, B, C, D
Seeds: ai-v143-tuning-001 bis ai-v143-tuning-005
maxActions: 160
maxFindings: 50
Trace-Runner: scripts/run-ai-selfplay-trace-matrix.ts
```

## Gesamtergebnis

| Metrik | AI073 |
| --- | ---: |
| Spiele | 20 |
| Entscheidungen | 2571 |
| Findings | 833 |
| Critical Findings | 0 |
| High Findings | 3 |
| Medium Findings | 581 |
| Low Findings | 249 |
| `illegalActions` | 0 |
| `replayFailures` | 0 |
| `actionLimitReached` | 11 |
| `allRedactionSafe` | true |
| `redactionSafe` | true |
| `averageGameLength` | 128.55 |
| `corpAgendaScores` | 14 |
| `runnerAgendaSteals` | 30 |
| `corpFlatlines` | 4 |
| `scoreWindowMissed` | 0 |
| `unsafeScoreChosen` | 6 |
| `passiveActionWithScoreLineAvailable` | 6 |

## Detector-Ergebnis

| Detector | AI073 |
| --- | ---: |
| `illegal_action` | 0 |
| `replay_failure` | 0 |
| `hidden_info_marker` | 0 |
| `no_legal_action_failure` | 0 |
| `action_limit_reached` | 11 |
| `repeated_no_progress_run` | 35 |
| `repeated_known_no_payoff_remote` | 0 |
| `repeated_low_value_archives` | 1 |
| `recovery_low_value_loop` | 98 |
| `bank_over_target_without_funding_need` | 7 |
| `risky_self_damage_action` | 0 |
| `blink_low_hand_buffer_run` | 0 |
| `duplicate_low_delta_install` | 2 |
| `overdraw_without_urgency` | 0 |
| `plan_step_action_mismatch` | 523 |
| `semantic_override_suspicious` | 413 |
| `corp_never_scores_long_game` | 3 |
| `runner_never_accesses_long_game` | 0 |

## Pair-Matrix

| Pair | Spiele | Entscheidungen | Action-Limit | No-Progress | Known No-Payoff Remote | Recovery Loop | Unsafe Score | Passive Scoreline | Corp Never Scores | Corp Scores | Runner Steals | Corp Flatlines |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 5 | 578 | 1 | 4 | 0 | 17 | 1 | 2 | 0 | 3 | 13 | 0 |
| B | 5 | 650 | 3 | 6 | 0 | 50 | 0 | 0 | 1 | 4 | 2 | 2 |
| C | 5 | 744 | 4 | 11 | 0 | 22 | 1 | 0 | 2 | 2 | 8 | 0 |
| D | 5 | 599 | 3 | 14 | 0 | 9 | 4 | 4 | 0 | 5 | 7 | 2 |

## Bewertung gegen Zielkorridor

Harte Safety-Werte sind grün: keine illegalen Actions, keine Replay-Fehler, keine Hidden-Info-Marker, keine Critical Findings und Redaction-Safety durchgehend true.

`repeated_known_no_payoff_remote` steht in AI073 bereits bei 0. AI075 bleibt trotzdem relevant, weil die Vorgabe einen Guard gegen künftiges `contest_remote`-Doctrine-Überstimmen verlangt.

Die aktiven Folgeziele bleiben:

- `recovery_low_value_loop`: 98, Ziel höchstens 88.
- `repeated_no_progress_run`: 35, Ziel höchstens 33.
- `unsafeScoreChosen`: 6, Ziel unter 6, ideal höchstens 3.
- `actionLimitReached`: 11, Ziel höchstens 8.
- `passiveActionWithScoreLineAvailable`: 6, nicht weiter verschlechtern.
- `corpAgendaScores`: 14, nicht unter 13 ohne dokumentierten Safety-Gewinn.

## Verifikation

```text
corepack pnpm --filter @netgrid/ai typecheck
Ergebnis: grün

corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts
Ergebnis: grün, 6 Tests

git diff --check
Ergebnis: grün
```

## Folgepakete

AI074 sollte primär Pair B und die übergreifende `recovery_low_value_loop`-Last prüfen. AI076 und AI078 müssen besonders Pair D beachten, weil dort `unsafeScoreChosen` und passive Scoreline-Befunde konzentriert sind. AI079 sollte Action-Limit-Cluster pro Pair ausweisen; die Baseline zeigt die höchste Action-Limit-Dichte in Pair C und D.

