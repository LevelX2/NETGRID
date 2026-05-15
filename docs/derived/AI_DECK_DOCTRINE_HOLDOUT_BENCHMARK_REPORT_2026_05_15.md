# AI Deck Doctrine Holdout Benchmark Report

Stand: 2026-05-15

## Lauf

- Version: `ai-deck-doctrine-quality-v1`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Seeds: 9 gesamt, inklusive Holdout-Seeds
- Max Actions je Spiel: 40
- Decks: `demo_runner_008` gegen `demo_corp_008`
- Gate: PASS

## Doctrine Delta

| Metric | Baseline | Candidate | Delta |
| --- | ---: | ---: | ---: |
| nakedAgendaInstalls | 0 | 0 | 0 |
| agendaFloodExposure | 0 | 0 | 0 |
| scoreWindowMissed | 0 | 0 | 0 |
| remoteOverbuild | 0 | 0 | 0 |
| economyStall | 0 | 0 | 0 |
| repeatedLowValueCentralRun | 0 | 0 | 0 |
| rigStall | 0 | 0 | 0 |
| assetTrashNeglect | 0 | 0 | 0 |

## Safety Delta

| Metric | Delta |
| --- | ---: |
| illegalActionDelta | 0 |
| replayFailureDelta | 0 |
| timeoutRateDelta | 0 |
| fallbackRateDelta | 0.005 |

## Gate-Auswertung

- Accepted: yes
- Hard failures: none
- Warnings: none

## Fallanalyse

| Metric | Count | Examples |
| --- | ---: | ---: |
| nakedAgendaInstalls | 0 | 0 |
| agendaFloodExposure | 0 | 0 |
| scoreWindowMissed | 0 | 0 |
| remoteOverbuild | 0 | 0 |
| economyStall | 0 | 0 |
| repeatedLowValueCentralRun | 0 | 0 |
| rigStall | 0 | 0 |
| assetTrashNeglect | 0 | 0 |

## Interpretation

Der Holdout-Lauf bestätigt den engen Tuning-Stand auf zusätzlicher Seed-Abdeckung: keine Doctrine-Fehlerklasse tritt im Candidate-Lauf auf, und das Gate bleibt trotz kleinem Fallback-Rate-Delta innerhalb der Schwelle.

Die Metrik wurde dabei präzisiert: `recover_economy` zählt nicht als `economyStall`, reaktive Corp-Fenster zählen nicht als `agendaFloodExposure`, und zentrale Schutzpläne `protect_hq`/`protect_rnd` gelten nicht als Agenda-Flood-Exposure, weil sie die HQ/R&D-Angriffsfläche mindern.

Der Runner-Mulligan ist in diesem Holdout-Lauf ebenfalls aktiv und bleibt neutral gegenüber den Gate-Schwellen: keine IllegalActions, Replay-Fehler, Timeouts oder neuen Doctrine-Zähler im Candidate-Lauf.

Nächster sinnvoller Schritt ist nach dem längeren Selfplay-/Soak-Lauf die archetypspezifische Early-Turn-Planung statt weiterer Gewichtungsoptimierung auf derselben Seed-Menge.
