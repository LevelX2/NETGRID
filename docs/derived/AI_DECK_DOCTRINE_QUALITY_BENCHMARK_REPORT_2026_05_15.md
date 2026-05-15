# AI Deck Doctrine Quality Benchmark Report

Stand: 2026-05-15

## Lauf

- Version: `ai-deck-doctrine-quality-v1`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Seeds: 6 Tuning-Seeds
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
| economyStall | 16 | 16 | 0 |
| repeatedLowValueCentralRun | 0 | 0 | 0 |
| rigStall | 0 | 0 | 0 |
| assetTrashNeglect | 0 | 0 | 0 |

## Safety Delta

| Metric | Delta |
| --- | ---: |
| illegalActionDelta | 0 |
| replayFailureDelta | 0 |
| timeoutRateDelta | 0 |
| fallbackRateDelta | 0 |

## Gate-Auswertung

- Accepted: yes
- Hard failures: none
- Warnings: none

## Interpretation

Der aktuelle Kandidat verletzt in diesem engen Tuning-Lauf keine harte Safety- oder Doctrine-Schwelle. Die Deltas bleiben neutral, weil Baseline und Kandidat in diesem lokalen Vergleich denselben aktuellen Bewertungsstand nutzen; die absoluten Zähler zeigen aber den Effekt der Tuning-Schritte.

Die nackten Agenda-Installationen fallen nach dem Scoring-Remote-Guard nicht mehr an. Nach dem Runner-Zentraldruck-Guard fallen auch `repeatedLowValueCentralRun` und `rigStall` in diesem Tuning-Lauf auf 0. Übrig bleibt `economyStall`, nun vor allem in laufenden Encounter-/Access-Folgen statt als neuer unvorbereiteter HQ/R&D-Start.
