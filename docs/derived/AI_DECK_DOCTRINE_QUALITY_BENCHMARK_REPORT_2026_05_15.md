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
| fallbackRateDelta | 0 |

## Gate-Auswertung

- Accepted: yes
- Hard failures: none
- Warnings: none

## Interpretation

Der aktuelle Kandidat verletzt in diesem engen Tuning-Lauf keine harte Safety- oder Doctrine-Schwelle. Die Deltas bleiben neutral, weil Baseline und Kandidat in diesem lokalen Vergleich denselben aktuellen Bewertungsstand nutzen; die absoluten Zähler zeigen aber den Effekt der Tuning-Schritte.

Die nackten Agenda-Installationen fallen nach dem Scoring-Remote-Guard nicht mehr an. Nach dem Runner-Zentraldruck-Guard fallen auch `repeatedLowValueCentralRun` und `rigStall` in diesem Tuning-Lauf auf 0. Nach der Economy-Stall-Trennung zählen laufende Run-Folgeaktionen wie Pump, Break, Continue, Access und Steal nicht mehr als Planungsfehler.

Nach dem Remote-Contest-Pacing fallen die schwachen `contest_remote`-Schleifen bei niedriger Creditreserve aus dem Restbild heraus.

Nach dem letzten Low-Reserve-Pacing fallen auch die verbleibenden Economy-Stall-Restfälle aus dem engen Tuning-Lauf heraus: Runner-Zentraldruck durch sichtbares ICE bei 1 Credit und redundante Corp-Zentral-ICE-Protection bei 1 Credit werden nun gegen Economy-Erholung abgewogen.

Nach der Runner-Mulligan-Erweiterung bleibt der enge 6-Seed-/40-Action-Lauf stabil: der Runner beantwortet Setup-Mulligans anhand von Breaker-Zugang, Economy, Setup, Druckoptionen und Doktrin, ohne neue Doctrine-Fehlerklassen oder Safety-Deltas zu erzeugen.

Alle Doctrine-Fehlerklassen stehen in diesem 6-Seed-/40-Action-Lauf bei 0. Das ist ein enger Tuning-Nachweis, kein Ersatz für Holdout-/Selfplay-Auswertung.
