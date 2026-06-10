# AI078 Doctrine Runtime Weight Clamp and Gate Review

Datum: 2026-06-10

## Ergebnis

AI078 ist umgesetzt. `deck_doctrine_runtime_weight` nutzt jetzt consumer-spezifische Clamps und wird bei positiven Gewichten erst nach Legal-/Side-/Kosten-/Reachability- und Spezial-Gates erzeugt. Unterdrueckte Gewichte erscheinen nur als `deck_doctrine_runtime_weight_suppressed` mit Gate-Evidence, nicht mehr als positives Runtime-Gewicht.

## Consumer-Clamps

| Consumer | Plan | Raw-Clamp | Value-Clamp |
| --- | --- | ---: | ---: |
| `corp_score_now` | `score_now` | +/-24 | +/-240 |
| `corp_score_next_turn` | `score_next_turn` | +/-18 | +/-180 |
| `corp_build_scoring_remote` | `build_scoring_remote` | +/-18 | +/-180 |
| `runner_pressure_rnd` | `pressure_rnd` | +/-12 | +/-120 |
| `runner_pressure_hq` | `pressure_hq` | +/-12 | +/-120 |
| `runner_contest_remote` | `contest_remote` | +/-9 | +/-90 |

Der Reason-String enthaelt `plan`, `raw`, `bounded`, `consumer`, `clamp` und maximal drei Doctrine-Tags.

## Gates

- LegalAction- und Side-Abgleich vor positivem Weight.
- Kosten-Gate ueber sichtbare Aktionskosten gegen aktuelle Credits.
- Runner-Run-Reachability-Gate ueber vorhandene Run-Target-Evaluation.
- `known_no_payoff`/low-value Remote blockiert positives `contest_remote`.
- `unsafe_score` blockiert positives `score_now`.
- Wiederholter zentraler Run ohne Fortschritt blockiert positives `pressure_hq`/`pressure_rnd`.
- Low-value-Recovery-Kontext ohne Funding-Need blockiert positive Runner-Run-Doctrine-Overrides.

## A-D-x5 Trace-Mining

JSON: `docs/reviews/ai/ai078-doctrine-runtime-weight-clamp-and-gate-a-d-5seed-2026-06-10.json`

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
| hidden-info markers | 0 |
| repeated_known_no_payoff_remote | 0 |
| repeated_no_progress_run | 35 |
| recovery_low_value_loop | 2 |
| unsafeScoreChosen | 6 |
| passiveActionWithScoreLineAvailable | 6 |
| corp_never_scores_long_game | 3 |
| corpAgendaScores | 14 |

| Pair | Findings | ActionLimit | RepeatedNoProgress | KnownNoPayoff | Recovery | UnsafeScore | PassiveScoreline | CorpScores |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 189 | 1 | 4 | 0 | 0 | 1 | 2 | 3 |
| B | 232 | 3 | 6 | 0 | 1 | 0 | 0 | 4 |
| C | 247 | 4 | 11 | 0 | 1 | 1 | 0 | 2 |
| D | 161 | 3 | 14 | 0 | 0 | 4 | 4 | 5 |

## Bewertung

Safety bleibt gruen. Die Clamp-/Gate-Aenderung reduziert die Gesamtfindings leicht von 833/829-Vorstand auf 829 und haelt `repeated_known_no_payoff_remote` bei 0. `unsafeScoreChosen` bleibt bei 6; die verbliebenen Funde sind nach der Gate-Aenderung nicht durch positives `score_now`-Doctrine-Gewicht erklaert und bleiben Material fuer AI079/AI080 oder ein spaeteres Scoreline-spezifisches Paket.

## Testnachweis

- `corepack pnpm --filter @netgrid/ai typecheck`: PASS
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "doctrine|clamp|suppresses doctrine"`: PASS, 21 Tests
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts`: PASS, 7 Tests
- `git diff --check`: PASS
