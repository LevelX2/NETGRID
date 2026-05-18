# AI Deck Doctrine Quality Case Analysis

Stand: 2026-05-15

## Lauf

- Quelle: Candidate-Seite aus `runDoctrineQualityBenchmark`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Seeds: 6 Tuning-Seeds
- Max Actions je Spiel: 40
- Decks: `demo_runner_008` gegen `demo_corp_008`
- Max Beispiele pro Metrik: 3
- Redaction safe: yes

## Totals

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

## Examples

### nakedAgendaInstalls

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
Keine Beispiele im analysierten Lauf.

### agendaFloodExposure

Keine Beispiele im analysierten Lauf.

### scoreWindowMissed

Keine Beispiele im analysierten Lauf.

### remoteOverbuild

Keine Beispiele im analysierten Lauf.

### economyStall

Keine Beispiele im analysierten Lauf.

### repeatedLowValueCentralRun

Keine Beispiele im analysierten Lauf.

### rigStall

Keine Beispiele im analysierten Lauf.

### assetTrashNeglect

Keine Beispiele im analysierten Lauf.

## Interpretation

- `nakedAgendaInstalls` fällt nach dem Scoring-Remote-Guard nicht mehr an.
- `repeatedLowValueCentralRun` fällt nach dem Recent-Central-Pressure-Guard auf 0.
- `rigStall` fällt nach dem Underprepared-Central-Pressure-Guard auf 0.
- `economyStall` zählt laufende Run-Folgeaktionen wie Pump, Break, Continue, Access und Steal nicht mehr als Planungsfehler.
- Schwache `contest_remote`-Schleifen bei niedriger Creditreserve fallen nach dem Remote-Contest-Pacing aus dem Restbild heraus.
- Runner-Zentraldruck durch sichtbares ICE bei 1 Credit und redundante Corp-Zentral-ICE-Protection bei 1 Credit werden nun gegen Economy-Erholung abgewogen.
- Im engen Tuning-Lauf bleiben keine Doctrine-Fehlerbeispiele übrig.

## Nächster Umsetzungsschritt

Der nächste Tuning-Schritt sollte nicht weiter auf denselben sechs Seeds optimieren, sondern die Robustheit prüfen:

1. Holdout-Seeds und längere Selfplay-Läufe gegen die neuen Pacing-Regeln prüfen.
2. Erst bei stabilen Holdout-Werten Runner-Mulligan und archetypspezifische Early-Turn-Planung angehen.
