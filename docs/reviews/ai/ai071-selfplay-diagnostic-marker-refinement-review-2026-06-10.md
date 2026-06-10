# AI071 Selfplay-Diagnosemarker Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI071`
Branch: `codex/ai068-ai072-selfplay-quality`

## Ziel

Die Beobachtungsmarker `plan_step_action_mismatch` und `semantic_override_suspicious` sollen legitime Semantic-Runtime-Abweichungen besser von echten Verdachtsfällen trennen. Primäre Spielstärke- und Safety-Metriken bleiben unverändert führend.

## Umsetzung

- `semantic_override_suspicious` feuert nicht mehr bei bekannten, erklärten Overrides:
  - Tactical-Plan-Mapping wurde wegen Score-Gap bewusst überstimmt.
  - Same-server-Repeat-Run-Penalty erklärt eine Nicht-Run-Alternative.
  - bekannte Sicherheits-/Survival-/Reserve-/Loan- oder Sacrifice-Guards erklären die Abweichung.
  - reaktive Micro-Actions wie Choice, Access, Steal, Trash, Break, Pump, Continue oder Jack-out sind nicht pauschal suspicious.
- `plan_step_action_mismatch` akzeptiert bekannte Erklärungen ebenfalls, insbesondere den AI069-Repeat-Run-Guard.
- Ein synthetischer Detector-Test stellt sicher, dass erklärte Overrides nicht gezählt werden und unerklärte Planabweichungen weiter beide Marker bekommen.

## A-D-Messlauf

Vergleich zum Stand nach AI070:

| Metric | Nach AI070 | Nach AI071 |
| --- | ---: | ---: |
| games | 20 | 20 |
| illegalActions | 0 | 0 |
| replayFailures | 0 | 0 |
| allRedactionSafe | 1 | 1 |
| criticalFindings | 0 | 0 |
| corp_never_scores_long_game | 3 | 3 |
| actionLimitReached | 11 | 11 |
| repeated_no_progress_run | 33 | 33 |
| recovery_low_value_loop | 88 | 88 |
| plan_step_action_mismatch | 559 | 528 |
| semantic_override_suspicious | 615 | 436 |
| scoreWindowMissed | 0 | 0 |
| unsafeScoreChosen | 6 | 6 |

Pair-Auszug nach AI071:

| Pair | plan_step_action_mismatch | semantic_override_suspicious |
| --- | ---: | ---: |
| A | 143 | 72 |
| B | 166 | 116 |
| C | 143 | 149 |
| D | 76 | 99 |

## Bewertung

AI071 macht die lauten Beobachtungsmarker trennschärfer, ohne Selfplay-Verhalten zu verändern. `semantic_override_suspicious` sinkt deutlich von 615 auf 436, weil erklärte Semantic-Runtime-Abweichungen nicht mehr als Suspicion gezählt werden. `plan_step_action_mismatch` sinkt moderat von 559 auf 528.

## Verification

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "keeps explained semantic overrides out of suspicious selfplay findings|runs and formats a small selfplay trace-mining smoke"`: grün.
- `git diff --check`: grün.
- A-D-Trace-Mining-Lauf: ausgeführt, primäre Metriken unverändert, Safety grün.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Erweiterung.
- Die Änderung betrifft nur Diagnosemarker, nicht die Auswahl legaler Aktionen.
