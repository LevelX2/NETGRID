# AI Behavior Baseline v1

Status: gezielter Zwischenlauf; Seed 03 behoben, Seed 05 noch rot
Git head: 51eaec030
Generated: 2026-07-14T19:38:07.979Z

## Contract

- Slots: strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-05
- Games: 2
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:1

| Metric | Value |
| --- | ---: |
| illegalActions | 0 |
| replayFailures | 0 |
| actionLimitGames | 1 |
| fallbackActions | 0 |
| timeoutActions | 0 |
| runtimeErrors | 0 |
| hiddenInfoFindings | 0 |
| noLegalActionFailures | 0 |
| redactionSafe | yes |

## Behavioural metrics

| Metric | Value |
| --- | ---: |
| Missed score window rate | 0.000 |
| Advanced remote contest skip rate | n/a |
| Plan conversion rate | 0.700 |
| Strategic no-progress repeats / 100 decisions | 2.762 |
| Clearly dominated plan choices / 100 decisions | 0 |
| Trace findings / 100 decisions | 1.453 |

## Deck slots

| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish | 2 | 688 | 0.000 | n/a | 0.700 | 2.762 | 0 | 1 |

## Outcome context

- Runner agenda points: 7
- Corp agenda points: 5
- Runner steals: 2
- Corp scores: 2
- Score or steal actions: 4
- Average actions: 344
- Average turns: 45.5

## Comparison

Vergleichsbasis ist der analysierte Lauf auf `4dfe4b80a` aus
`ai-behavior-baseline-v1-seeds-03-05-deep-dive-2026-07-14.md`.

| Seed | Vorher | Zwischenlauf `51eaec030` | Bewertung |
| --- | --- | --- | --- |
| 03 | Action Limit nach 480 Aktionen, Runner 4 : Korp 3 | reguläres Spielende nach 208 Aktionen, Runner 7 : Korp 0 | Die Broker-/Basic-Credit-Schleife konvertiert jetzt in Runs und Spielende. |
| 05 | Action Limit nach 480 Aktionen, Runner 0 : Korp 5 | weiterhin Action Limit nach 480 Aktionen, Runner 0 : Korp 5 | Deutlich mehr Entwicklung und Druck, aber eine späte Newsgroup-Schleife bleibt. |

Seed 05 verbessert sich qualitativ von 107 auf 68 Runner-Aktivierungen und
erzeugt nun 18 Draws, 13 Installationen, 20 Events, 5 Runs und 4 Accesses.
Die Korp baut und scored statt der früheren Netwatch-Dauerschleife. Ab dem
eingefrorenen State 451 wählt der Runner bei 18 Credits und vollem
Vier-Klick-Zug dennoch erneut viermal Newsgroup Filter, obwohl Tycho Mem Chip,
ein zweiter Blink sowie der legale Run-Lock-Abbau Entwicklungspfade eröffnen.

Dieser Restfehler ist vor der nächsten Produktionsänderung als spielgleicher
Correctness-Checkpoint
`baseline-seed05-post-remediation-newsgroup-loop` gesichert. Der rote Vertrag
verbietet nicht die Karte generell, sondern nur ihre erneute Auswahl in genau
diesem vollständigen Spielzustand mit ausreichenden Credits und legaler
Pressure-Entwicklung.

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.
