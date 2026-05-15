# AI Deck Doctrine Selfplay Soak Report

Stand: 2026-05-15

## Lauf

- League-Version: `1.4.3`
- Seeds: 9 gesamt, 6 Tuning-Seeds plus 3 Holdout-Seeds
- Max Actions je Spiel: 80
- Decks: `demo_runner_008` gegen `demo_corp_008`
- Profile: 7 Benchmark-Profile
- Redaction: Report enthält nur aggregierte Metriken und keine privaten Kartendaten.

## Profile Summary

| Profile | Games | Illegal | Replay Fail | Timeouts | Fallback | Runner WR | Corp WR | Limit | Avg Actions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| random_legal_bot | 9 | 0 | 0 | 0 | 0 | 0.333 | 0 | 0.667 | 72.222 |
| basic_corp_ai | 9 | 0 | 0 | 0 | 0.018 | 0.111 | 0 | 0.889 | 75.889 |
| basic_runner_ai | 9 | 0 | 0 | 0 | 0 | 0.222 | 0 | 0.778 | 72.222 |
| plan_corp_v1_4_0 | 9 | 0 | 0 | 0 | 0.001 | 0 | 0 | 1 | 80 |
| plan_runner_v1_4_1 | 9 | 0 | 0 | 0 | 0.011 | 0 | 0 | 1 | 80 |
| belief_ai_v1_4_2 | 9 | 0 | 0 | 0 | 0.015 | 0 | 0 | 1 | 80 |
| current_candidate | 9 | 0 | 0 | 0 | 0.019 | 0 | 0 | 1 | 80 |

## Current Candidate Doctrine Metrics

| Metric | Count |
| --- | ---: |
| nakedAgendaInstalls | 0 |
| agendaFloodExposure | 0 |
| scoreWindowMissed | 0 |
| remoteOverbuild | 0 |
| economyStall | 0 |
| repeatedLowValueCentralRun | 0 |
| rigStall | 0 |
| assetTrashNeglect | 0 |

## Doctrine Comparison

| Profile | Naked Agenda | Agenda Flood | Economy Stall | Repeat Central | Rig Stall | Asset Neglect |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| random_legal_bot | 11 | 0 | 50 | 2 | 27 | 4 |
| basic_corp_ai | 20 | 0 | 48 | 3 | 5 | 7 |
| basic_runner_ai | 12 | 0 | 37 | 22 | 0 | 0 |
| plan_corp_v1_4_0 | 0 | 0 | 49 | 43 | 0 | 0 |
| plan_runner_v1_4_1 | 16 | 0 | 10 | 5 | 0 | 0 |
| belief_ai_v1_4_2 | 0 | 0 | 0 | 0 | 0 | 0 |
| current_candidate | 0 | 0 | 0 | 0 | 0 | 0 |

## Interpretation

Der längere Selfplay-/Soak-Lauf bestätigt den Holdout-Stand für `current_candidate` auch mit aktivem Runner-Mulligan und Early-Turn-Doctrine: keine IllegalActions, keine Replay-Fehler, keine Timeouts und keine Doctrine-Fehlerklassen. Gegenüber `belief_ai_v1_4_2` bleibt die Doctrine-Seite stabil; das Fallback-Niveau ist minimal höher (`0.019` statt `0.015`) und deutlich niedriger als vor der expliziten `decline_trash`-Bewertung.

Alle Spiele von `current_candidate` erreichen in diesem 80-Action-Lauf das Action-Limit. Das ist kein Safety-Fehler, zeigt aber, dass der nächste fachlich sinnvolle Ausbau nicht weitere Mikro-Gewichtung auf denselben Seeds ist, sondern Spielprogression nach der frühen Aufbauphase: Matchabschluss-/Scoring-Dynamik und bessere Corp-Score-Abschlussfenster.
