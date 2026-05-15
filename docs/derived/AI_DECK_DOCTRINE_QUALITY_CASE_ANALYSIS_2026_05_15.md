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
| nakedAgendaInstalls | 6 | 3 |
| agendaFloodExposure | 0 | 0 |
| scoreWindowMissed | 0 | 0 |
| remoteOverbuild | 0 | 0 |
| economyStall | 43 | 3 |
| repeatedLowValueCentralRun | 6 | 3 |
| rigStall | 4 | 3 |
| assetTrashNeglect | 0 | 0 |

## Examples

### nakedAgendaInstalls

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| ai-v143-tuning-002 | 5 | corp | install_card | corp.plan.score_next_turn | new_remote | naked_agenda_install |
| ai-v143-tuning-003 | 4 | corp | install_card | corp.plan.score_next_turn | new_remote | naked_agenda_install |
| ai-v143-tuning-004 | 5 | corp | install_card | corp.plan.score_next_turn | new_remote | naked_agenda_install |

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
| ai-v143-tuning-001 | 12 | corp | decline_rez | fallback.first_legal_action | none | economy_stall, fallback |
| ai-v143-tuning-001 | 13 | corp | decline_rez | fallback.first_legal_action | none | economy_stall, fallback |

### repeatedLowValueCentralRun

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| ai-v143-tuning-001 | 15 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |
| ai-v143-tuning-002 | 26 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |
| ai-v143-tuning-002 | 30 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |

### rigStall

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| ai-v143-tuning-002 | 7 | runner | start_run | runner.plan.contest_remote | remote_1 | rig_stall |
| ai-v143-tuning-003 | 7 | runner | start_run | runner.plan.contest_remote | remote_1 | rig_stall |
| ai-v143-tuning-004 | 7 | runner | start_run | runner.plan.contest_remote | remote_1 | rig_stall |

### assetTrashNeglect

Keine Beispiele im analysierten Lauf.

## Interpretation

- `nakedAgendaInstalls` ist ein echter Kandidat für den nächsten KI-Fix: Die Beispiele sind Corp-Installationen in `new_remote` mit `corp.plan.score_next_turn`.
- `economyStall` enthält mindestens teilweise zu grobe Tags: `decline_rez` während eines Run-Fensters wird als Stall gezählt, obwohl es eine reaktive Entscheidung sein kann.
- `repeatedLowValueCentralRun` bündelt in den Beispielen HQ-Druck bei zugleich niedrigem Economy-Zustand; hier sollte zuerst geprüft werden, ob der Runner-Druck wirklich niedrigwertig ist oder ob die Metrik die Boardlage zu grob bewertet.
- `rigStall` zeigt frühe Remote-Contest-Runs ohne sichtbares Rig. Das kann ein echter Fehler oder ein berechtigter Contest gegen sichtbaren Score-Druck sein; die nächste Präzisierung sollte Corp-Scoringdruck und Run-Erreichbarkeit einbeziehen.

## Nächster Umsetzungsschritt

Vor dem Gewichtungs-Tuning sollten zwei Metriken präzisiert werden:

1. `economyStall`: Reaktive Fenster wie `decline_rez` und Pflicht-/Fallback-Situationen getrennt zählen.
2. `nakedAgendaInstalls`: Zwischen ungeschütztem nacktem Install und geplantem Score-Next-Turn mit plausibler Schutz-/Scorelinie unterscheiden.
