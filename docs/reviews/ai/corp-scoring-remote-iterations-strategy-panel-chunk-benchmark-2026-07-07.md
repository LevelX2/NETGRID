# Corp Scoring Remote Iterations: Strategy Panel Chunk Benchmark

Datum: 2026-07-07

## Anlass

Der ungefilterte 5-Seed-/480-Actions-Lauf der gesamten Match-Progression-Suite ist fuer den aktuellen Arbeitszyklus zu gross: 11 runnable Slots mal 5 Seeds mal 2 Profile laufen ohne Zwischenoutput deutlich laenger als 15 Minuten. Fuer reproduzierbare Iterationen wurde deshalb ein Slot-Filter fuer `run-ai-match-progression-suite.ts` ergaenzt.

## Befehl

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-match-progression-suite.ts `
  --out-json $env:TEMP\netgrid-strategy-panel-5x480-2026-07-07.json `
  --out-md $env:TEMP\netgrid-strategy-panel-5x480-2026-07-07.md `
  --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005 `
  --max-actions 480 `
  --comparison-profiles belief_ai_v1_4_2,current_candidate `
  --slot-ids strategy_panel_fast_advance_chrome_rush,strategy_panel_net_damage_black_ice,strategy_panel_hybrid_score_punish_cheap_bag
```

Laufzeit: 703.95 Sekunden fuer 3 Slots * 5 Seeds * 2 Profile = 30 simulierte Spiele.

## Methodischer Befund

`belief_ai_v1_4_2` und `current_candidate` zeigen in diesem Stand identische Ergebnisse. Das ist erwartbar, weil beide Simulation-Modi aktuell auf `chooseAiAction` und dieselben Runtime-Profil-IDs mappen. Der Slot-Panel-Lauf ist damit als aktuelle Baseline und als Vorher-/Nachher-Artefakt nutzbar, aber nicht als echter In-Process-Differenzvergleich zwischen zwei eingefrorenen KI-Staenden.

Folge fuer weitere Iterationen: Fuer belastbare Verbesserungsvergleiche entweder vor einer Aenderung diesen gefilterten Chunk sichern und nach der Aenderung erneut laufen lassen, oder einen wirklich eingefrorenen Vergleichsmodus verdrahten.

## Ergebnisuebersicht current_candidate

| Slot | Corp-Archetyp | Seeds | Gewinner | Agenda-Punkte Runner/Corp | Corp Scores | Runner Steals | Action-Limit | Auffaelligkeiten |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| `strategy_panel_fast_advance_chrome_rush` | `fast_advance` | 5 | Corp 4, Action-Limit 1 | 6 / 31 | 20 | 3 | 0.2 | Starkes Scoring, aber 32x `corpCentralOverIcedWithoutPressure`, 2 Archives-ICE, 1 `ERR_INVALID_TARGET`. |
| `strategy_panel_net_damage_black_ice` | `net_damage` | 5 | Corp 5 per Flatline | 10 / 2 | 1 | 6 | 0 | Sehr wirksamer Damage-Plan, aber 96x `corpRemoteScoringUnderbuiltWhileCentralsOverIced` und 67x `corpCentralOverIcedWithoutPressure`; fuer reine Scoring-Analyse nur bedingt repraesentativ. |
| `strategy_panel_hybrid_score_punish_cheap_bag` | `hybrid_score_punish` | 5 | Corp 4, Action-Limit 1 | 20 / 36 | 12 | 8 | 0.2 | Gute Corp-Punkte, aber 260x `corpCentralOverIcedWithoutPressure`, 3 Archives-ICE, 2x `corpExtraCentralIceChosenOverAdvanceOrScore`, 1 `ERR_INVALID_TARGET`. |

## Seed-Details

Fast Advance:

- `ai-v143-tuning-001`: Corp gewinnt per Agenda, 5/7 AP, 244 Actions.
- `ai-v143-tuning-002`: Action-Limit, 0/3 AP, 195 Actions, `ERR_INVALID_TARGET`.
- `ai-v143-tuning-003`: Corp gewinnt per Agenda, 1/7 AP, 224 Actions.
- `ai-v143-tuning-004`: Corp gewinnt per Agenda, 0/7 AP, 249 Actions.
- `ai-v143-tuning-005`: Corp gewinnt per Agenda, 0/7 AP, 118 Actions.

Net Damage:

- Alle 5 Seeds gewinnt die Corp per Flatline.
- Agenda-Punkte bleiben niedrig; dieser Slot misst primaer Damage-/Punish-Faehigkeit, nicht saubere Scoreline.

Hybrid Score Punish:

- `ai-v143-tuning-002`: Action-Limit, 6/6 AP, 312 Actions, `ERR_INVALID_TARGET`.
- Die uebrigen 4 Seeds gewinnt die Corp per Agenda.

## Bewertung fuer weitere Arbeit

- Der neue Slot-Filter ist notwendig: Der grosse Benchmark muss chunked/per Slot laufen, sonst sind Iterationen zu langsam und schlecht kontrollierbar.
- Die Strategie-Panel-Baseline bestaetigt, dass Fast-Advance und Hybrid grundsaetzlich scoren koennen, aber die Central-Over-Ice-Metriken bleiben auffaellig hoch.
- Vor weiteren Gewichtsaenderungen sollte der `ERR_INVALID_TARGET` aus Seed `ai-v143-tuning-002` gesondert untersucht werden, weil illegale/ungueltige Zielaktionen Benchmark-Ergebnisse verfaelschen koennen.
- Der Net-Damage-Slot darf nicht als Argument fuer bessere Scoreline-KI gelesen werden; die Siege kommen hier ueber Flatline.
