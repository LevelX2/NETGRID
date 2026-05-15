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
| nakedAgendaInstalls | 6 | 6 | 0 |
| agendaFloodExposure | 0 | 0 | 0 |
| scoreWindowMissed | 0 | 0 | 0 |
| remoteOverbuild | 0 | 0 | 0 |
| economyStall | 43 | 43 | 0 |
| repeatedLowValueCentralRun | 6 | 6 | 0 |
| rigStall | 4 | 4 | 0 |
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

Die auffälligsten absoluten Zähler bleiben `economyStall` und `nakedAgendaInstalls`. Der nächste Tuning-Schritt sollte diese Fälle nicht pauschal über Gewichte korrigieren, sondern zuerst mit konkreten Action-Sequenzen oder fokussierten Seeds prüfen, ob die Tags echte Fehlentscheidungen oder bewusst akzeptierte Kurzfristzüge markieren.
