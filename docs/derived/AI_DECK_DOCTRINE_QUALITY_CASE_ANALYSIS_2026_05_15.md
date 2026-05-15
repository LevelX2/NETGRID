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
| economyStall | 34 | 3 |
| repeatedLowValueCentralRun | 8 | 3 |
| rigStall | 8 | 3 |
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
| ai-v143-tuning-001 | 11 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |
| ai-v143-tuning-001 | 14 | runner | access_card | runner.access.open_card | none | economy_stall |
| ai-v143-tuning-001 | 15 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |

### repeatedLowValueCentralRun

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| ai-v143-tuning-001 | 15 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |
| ai-v143-tuning-002 | 25 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall, rig_stall |
| ai-v143-tuning-002 | 29 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall, rig_stall |

### rigStall

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| ai-v143-tuning-002 | 10 | runner | start_run | runner.plan.pressure_rnd | rd | rig_stall |
| ai-v143-tuning-002 | 21 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall, rig_stall |
| ai-v143-tuning-002 | 25 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall, rig_stall |

### assetTrashNeglect

Keine Beispiele im analysierten Lauf.

## Interpretation

- `nakedAgendaInstalls` fällt nach dem Scoring-Remote-Guard nicht mehr an.
- `economyStall` wurde präzisiert: reaktive `decline_rez`- und Fallback-Fenster werden nicht mehr als Stall gezählt. Übrig bleiben Runner-Aktionen mit niedrigem Creditstand.
- `repeatedLowValueCentralRun` bündelt in den Beispielen HQ-Druck bei zugleich niedrigem Economy-Zustand; hier sollte zuerst geprüft werden, ob der Runner-Druck wirklich niedrigwertig ist oder ob die Metrik die Boardlage zu grob bewertet.
- `rigStall` liegt jetzt auf zentralen Runs ohne sichtbares Rig, besonders HQ/R&D-Druck.

## Nächster Umsetzungsschritt

Der nächste Tuning-Schritt sollte jetzt Runner-Zentraldruck ohne Rig enger bewerten:

1. `pressure_hq` und `pressure_rnd` sollten bei 0 sichtbaren Breakern und niedrigen Credits stärker gegen `build_rig`, `recover_economy` oder `draw_for_answers` abgewogen werden.
2. Die Metrik sollte anschließend prüfen, ob `rigStall` und `repeatedLowValueCentralRun` sinken, ohne Remote-Contest gegen echte Score-Drohungen zu schwächen.
