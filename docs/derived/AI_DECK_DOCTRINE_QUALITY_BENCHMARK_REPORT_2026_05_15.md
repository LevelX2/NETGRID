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
| economyStall | 34 | 34 | 0 |
| repeatedLowValueCentralRun | 8 | 8 | 0 |
| rigStall | 8 | 8 | 0 |
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

Der aktuelle Kandidat verletzt in diesem engen Tuning-Lauf keine harte Safety- oder Doctrine-Schwelle. Die Deltas sind in dieser Matrix noch neutral; der Benchmark ist damit als Guard aktiv, aber noch kein Beleg für bessere Gewichtungen.

Die nackten Agenda-Installationen fallen nach dem Scoring-Remote-Guard nicht mehr an. Die auffälligsten absoluten Zähler liegen jetzt auf Runner-Seite: `economyStall`, `repeatedLowValueCentralRun` und `rigStall`. Der nächste Tuning-Schritt sollte daher prüfen, ob zentrale Runs ohne Rig und mit niedrigen Credits zu aggressiv bewertet werden.
