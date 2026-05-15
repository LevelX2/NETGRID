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
| economyStall | 30 | 3 |
| repeatedLowValueCentralRun | 6 | 3 |
| rigStall | 0 | 0 |
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
| ai-v143-tuning-001 | 14 | runner | access_card | runner.access.open_card | none | economy_stall |
| ai-v143-tuning-001 | 15 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |

### repeatedLowValueCentralRun

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
| ai-v143-tuning-001 | 15 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |
| ai-v143-tuning-002 | 26 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |
| ai-v143-tuning-002 | 30 | runner | start_run | runner.plan.pressure_hq | hq | economy_stall |

### rigStall

| Seed | Action | Side | Type | Reason | Server | Tags |
| --- | ---: | --- | --- | --- | --- | --- |
Keine Beispiele im analysierten Lauf.

### assetTrashNeglect

Keine Beispiele im analysierten Lauf.

## Interpretation

- `nakedAgendaInstalls` ist ein echter Kandidat für den nächsten KI-Fix: Die Beispiele sind Corp-Installationen in `new_remote` mit `corp.plan.score_next_turn`.
- `economyStall` wurde präzisiert: reaktive `decline_rez`- und Fallback-Fenster werden nicht mehr als Stall gezählt. Übrig bleiben Runner-Aktionen mit niedrigem Creditstand.
- `repeatedLowValueCentralRun` bündelt in den Beispielen HQ-Druck bei zugleich niedrigem Economy-Zustand; hier sollte zuerst geprüft werden, ob der Runner-Druck wirklich niedrigwertig ist oder ob die Metrik die Boardlage zu grob bewertet.
- `rigStall` fällt nach Präzisierung nicht mehr an, weil sichtbarer Remote-Contest nicht pauschal als Rig-Stall gilt.

## Nächster Umsetzungsschritt

Vor dem Gewichtungs-Tuning sollte jetzt ein enger KI-Fix für nackte Agenda-Installs folgen:

1. `corp.plan.score_next_turn` darf Agenden nicht in `new_remote` installieren, wenn kein vorhandener Schutzpfad besteht.
2. Economy-/Central-Run-Tags sollten danach weiter beobachtet werden, aber nicht zuerst über Gewichte korrigiert werden.
