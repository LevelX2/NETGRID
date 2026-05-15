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
| economyStall | 16 | 3 |
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
| ai-v143-tuning-001 | 22 | runner | pump_breaker | runner.encounter.pump_breaker | none | economy_stall |
| ai-v143-tuning-001 | 23 | runner | continue_run | runner.plan.safe_probe_run | none | economy_stall |
| ai-v143-tuning-004 | 27 | runner | pump_breaker | runner.encounter.pump_breaker | none | economy_stall |

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
- `economyStall` bleibt als nächster Restbereich bestehen, liegt in den Beispielen aber nicht mehr auf neuen unvorbereiteten HQ/R&D-Starts, sondern auf Encounter-/Access-Folgeaktionen bei niedrigem Creditstand.

## Nächster Umsetzungsschritt

Der nächste Tuning-Schritt sollte jetzt `economyStall` genauer trennen:

1. Neue aktive Starts bei niedrigem Creditstand sollten weiterhin gegen Economy/Draw/Rig-Aufbau abgewogen werden.
2. Laufende Run-Folgeaktionen wie Pump, Continue, Access oder Steal sollten separat bewertet werden, damit die Metrik nicht erfolgreiche oder bereits verpflichtete Run-Linien als Planungsfehler zählt.
