# Match 802F – rote KI-Regressionsevidenz

## Quelle

- Match: `match_802f73f6ccd2d6fe`
- KI-Seite: Runner, Hard
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Capture: 2026-07-17, ausschließlich lesend

## Spielgleiche Checkpoints

| Checkpoint | Decision / StateVersion | Warm-up | Erwartung | Unveränderter Stand |
| --- | --- | --- | --- | --- |
| `cp-802f-01-schematics-no-title-search-d17` | D17 / SV29 | strict, 16 Entscheidungen, 0 Drifts | Schematics bleibt installierbar, aber ohne `runner_goal_fit_setup_search` | `behavior_regression` |
| `cp-802f-03-remote-fund-before-score-threat-probe-d13` | D13 / SV23 | strict, 12 Entscheidungen, 0 Drifts | Basis-Credit statt Remote-Run | `behavior_regression` |

Die Library-Search-Entscheidung D89 wurde nicht rebased: Ihr striktes Warm-up
bricht bereits bei D48 ab (`expected runner.gain_credit`, tatsächlich
`install Rent-I-Con`). Der historische Befund bleibt deshalb als direkte
Source-Role-Regressionstest abgedeckt, nicht als scheinbar spielgleicher
Checkpoint.

## Rote Tests vor dem Fix

```text
runnerSourceCardAnswerRole > does not infer deck search from a generic card title
  expected 'search' to be undefined

cp-802f-01 ...
  behavior_regression: Schematics trägt weiterhin runner_goal_fit_setup_search

cp-802f-03 ...
  behavior_regression: Runner wählt weiterhin runner.start_run.remote_1
```

Damit sind beide Fehlergruppen auf dem unveränderten Code reproduziert. Der
Remote-Fix soll nur den `scoreThreat`-Probe mit eigener
`gain_credits_first`-Empfehlung finanzieren; allgemeine Prüfruns bleiben eine
explizite Gegenprobe.
