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
| economyStall | 6 | 3 |
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

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| ai-v143-tuning-005 | 22 | runner | start_run | runner.plan.contest_remote | remote_1 | economy_stall |
| ai-v143-tuning-005 | 25 | runner | start_run | runner.plan.contest_remote | remote_1 | economy_stall |
| ai-v143-tuning-005 | 28 | runner | start_run | runner.plan.contest_remote | remote_1 | economy_stall |

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
- Der Rest liegt jetzt auf neuen `contest_remote`-Starts bei niedriger Creditreserve.

## Nächster Umsetzungsschritt

Der nächste Tuning-Schritt sollte jetzt Remote-Contest-Pacing genauer bewerten:

1. `contest_remote` sollte bei niedriger Creditreserve nur dann vor Economy/Draw/Rig-Aufbau liegen, wenn die sichtbare Remote-Drohung hoch genug ist.
2. Wiederholter Remote-Contest auf denselben sichtbaren Remote sollte eine Frische- oder Wiederholungsbremse bekommen, damit der Runner nicht in einer Credit-armen Remote-Schleife bleibt.
