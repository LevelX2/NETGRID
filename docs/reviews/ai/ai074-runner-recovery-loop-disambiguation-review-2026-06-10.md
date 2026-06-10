# AI074 Runner Recovery Loop Disambiguation Review 2026-06-10

Status: abgeschlossen

Branch: `codex/ai073-ai080-selfplay-stabilization`

Vergleichsbasis: `docs/reviews/ai/ai073-selfplay-regression-matrix-a-d-5seed-2026-06-10.json`

AI074-Matrix: `docs/reviews/ai/ai074-runner-recovery-loop-disambiguation-a-d-5seed-2026-06-10.json`

## Ziel

AI074 sollte `recovery_low_value_loop` reduzieren, ohne echte Recovery bei Funding-, Coverage-, Search- oder Draw-Need zu verbieten. Die Änderung bleibt in AI-Runtime und Trace-Mining; Engine, LegalActions, Replay, StateHash und Hidden-Info-Grenzen bleiben unverändert.

## Umsetzung

Geändert wurden:

- `packages/ai/src/index.ts`
  - neue Runtime-Komponente `runner_low_value_recovery_repeat`;
  - greift nur bei Runner-Recovery-Ability, sichtbarer Recovery-Wiederholung in öffentlichen Events und ohne aktive Funding-Need;
  - bleibt aus bei `runnerHandFundingTarget`, konkretem Bank-/Hand-Funding, bekannter unfinanzierbarer Run-Lage oder Emergency-Low-Credits.
- `packages/ai/src/simulation/selfplay-trace-mining.ts`
  - `recovery_low_value_loop` erhält Recovery-Kontextkategorien;
  - echte `funding_need_recovery`, `coverage_recovery` und `search_or_draw_recovery` werden nicht mehr als Low-Value-Loop gezählt;
  - Low-Value-Wiederholungen behalten den Detector und erhalten Facts wie `recovery_loop_category:low_value_repeat_no_funding_need`.
- Tests:
  - Runtime-Malus für wiederholte Low-Value-Recovery ohne Funding-Need.
  - Kein Runtime-Malus bei echter Funding-Need.
  - Detector zählt Low-Value-Recovery weiter, zählt Funding-Recovery aber nicht als Low-Value.

## Ergebnis

| Metrik | AI073 | AI074 |
| --- | ---: | ---: |
| `recovery_low_value_loop` | 98 | 2 |
| `repeated_no_progress_run` | 35 | 35 |
| `repeated_known_no_payoff_remote` | 0 | 0 |
| `actionLimitReached` | 11 | 11 |
| `unsafeScoreChosen` | 6 | 6 |
| `passiveActionWithScoreLineAvailable` | 6 | 6 |
| `corpAgendaScores` | 14 | 14 |
| `runnerAgendaSteals` | 30 | 30 |
| `corpFlatlines` | 4 | 4 |
| `illegalActions` | 0 | 0 |
| `replayFailures` | 0 | 0 |
| `criticalFindings` | 0 | 0 |
| `allRedactionSafe` | true | true |

## Pair-Verteilung

| Pair | `recovery_low_value_loop` | `repeated_no_progress_run` | `actionLimitReached` |
| --- | ---: | ---: | ---: |
| A | 0 | 4 | 1 |
| B | 1 | 6 | 3 |
| C | 1 | 11 | 4 |
| D | 0 | 14 | 3 |

## Bewertung

Der große Rückgang von 98 auf 2 ist keine pauschale Detector-Abschwächung, sondern eine reproduzierbare False-Classification-Korrektur: Der AI073/AI074-Zwischenlauf zeigte viele Recovery-Top-Findings mit `recovery_loop_category:funding_need_recovery`. Diese Entscheidungen erfüllen nicht den Begriff `low_value_loop`, weil Funding-Need weiterhin sichtbar war.

Die neue Runtime-Komponente ist testgedeckt, verändert den A-D-Korpus aber nicht sichtbar. Das ist akzeptabel: Der Korpus wurde primär durch Detector-Fehlklassifikation belastet, während echte Low-Value-Repeats nur noch in Pair B und C auftreten.

Die Safety-Werte bleiben unverändert grün. AI074 erreicht das Qualitätsziel `recovery_low_value_loop <= 88` deutlich und liegt unter AI073.

## Verifikation

```text
corepack pnpm --filter @netgrid/ai typecheck
Ergebnis: grün

corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "low-value recovery|funding need"
Ergebnis: grün, 3 Tests

corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "recovery loop"
Ergebnis: grün, 1 Test

git diff --check
Ergebnis: grün

A-D x 5 Trace-Matrix
Ergebnis: grün, harte Safety-Metriken unverändert 0/true
```

## Folgehinweise

AI075 bleibt relevant, obwohl `repeated_known_no_payoff_remote` bereits 0 ist: Der requested Guard gegen `contest_remote`-Doctrine soll Regressionen verhindern. AI079 sollte sich nicht mehr auf Recovery als dominante Action-Limit-Ursache stützen; nach AI074 bleiben `repeated_no_progress_run` und action-limit-spezifische Cluster wichtiger.

