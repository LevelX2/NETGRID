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

## Nachtrag: Chicago-Branch-Fix und bereinigter Chunk

Der `ERR_INVALID_TARGET` aus Seed `ai-v143-tuning-002` wurde auf `Chicago Branch` zurueckgefuehrt: Die Engine bot die aktivierte Faehigkeit an, obwohl kein installiertes advancebares Corp-Ziel vorhanden war. Beim Anwenden oeffnete der Advancement-Distribution-Pfad dann ohne Zieloption und brach ab. Das war ein LegalAction-Angebotsfehler, keine reine KI-Gewichtung.

Umgesetzt wurde ein generischer LegalAction-Guard fuer aktivierte `distribute_advancement_counters`-Faehigkeiten mit Ziel `installed_advanceable_cards`: ohne vorhandenes installiertes advancebares Corp-Ziel wird die Aktion nicht angeboten. Zusaetzlich gibt der AI-Simulator bei `applyAction`-Fehlern jetzt side-safe Action-Typ, Timing, Choice-Keys und die oeffentliche Engine-Meldung aus.

Bereinigter Wiederholungslauf:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-match-progression-suite.ts `
  --out-json $env:TEMP\netgrid-strategy-panel-5x480-post-chicago-fix-2026-07-07.json `
  --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005 `
  --max-actions 480 `
  --baseline-profile current_candidate `
  --candidate-profile current_candidate `
  --comparison-profiles current_candidate `
  --slot-ids strategy_panel_fast_advance_chrome_rush,strategy_panel_net_damage_black_ice,strategy_panel_hybrid_score_punish_cheap_bag
```

Laufzeit: 746.8 Sekunden fuer 3 Slots * 5 Seeds * 2 Profile = 30 simulierte Spiele.

Bereinigte Ergebnisuebersicht `current_candidate`:

| Slot | Corp-Archetyp | Seeds | Gewinner | Agenda-Punkte Runner/Corp | Corp Scores | Runner Steals | Action-Limit | IllegalActions | Auffaelligkeiten |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `strategy_panel_fast_advance_chrome_rush` | `fast_advance` | 5 | Corp 5 per Agenda | 6 / 35 | 23 | 3 | 0 | 0 | Scoring sauber abgeschlossen; `corpCentralOverIcedWithoutPressure` steigt im bereinigten Vollspiel auf 84, `corpRemoteScoringUnderbuiltWhileCentralsOverIced` nur 1. |
| `strategy_panel_net_damage_black_ice` | `net_damage` | 5 | Corp 5 per Flatline | 10 / 2 | 1 | 6 | 0 | 0 | Damage-Plan bleibt stark; `corpRemoteScoringUnderbuiltWhileCentralsOverIced` 96 und `corpCentralOverIcedWithoutPressure` 67 bleiben als nicht-scoreline-optimale Muster sichtbar. |
| `strategy_panel_hybrid_score_punish_cheap_bag` | `hybrid_score_punish` | 5 | Corp 5 per Agenda | 20 / 37 | 13 | 8 | 0 | 0 | Seed 002 und 004 gehen jetzt zu Ende; `corpCentralOverIcedWithoutPressure` 280, `corpExtraCentralIceChosenOverAdvanceOrScore` 2 bleiben die wichtigste Folgediagnose. |

Bereinigte Seed-Details:

- Fast Advance: alle 5 Seeds enden ohne Fehler mit Corp-Agenda-Sieg; Seed `ai-v143-tuning-002` endet jetzt bei 0/7 AP nach 289 Actions statt `ERR_INVALID_TARGET`.
- Net Damage: alle 5 Seeds enden ohne Fehler mit Corp-Flatline-Sieg.
- Hybrid Score Punish: alle 5 Seeds enden ohne Fehler mit Corp-Agenda-Sieg; Seed `ai-v143-tuning-002` endet jetzt bei 6/7 AP nach 349 Actions statt `ERR_INVALID_TARGET`.

## Bewertung fuer weitere Arbeit

- Der neue Slot-Filter ist notwendig: Der grosse Benchmark muss chunked/per Slot laufen, sonst sind Iterationen zu langsam und schlecht kontrollierbar.
- Die Strategie-Panel-Baseline bestaetigt, dass Fast-Advance und Hybrid grundsaetzlich scoren koennen, aber die Central-Over-Ice-Metriken bleiben auffaellig hoch.
- Der `ERR_INVALID_TARGET` aus Seed `ai-v143-tuning-002` ist behoben; weitere Gewichtsaenderungen sollten auf dem bereinigten Post-Fix-Chunk aufsetzen.
- Der Net-Damage-Slot darf nicht als Argument fuer bessere Scoreline-KI gelesen werden; die Siege kommen hier ueber Flatline.
- Naechster belegter Optimierungspunkt bleibt Central-ICE-Uebergewicht gegenueber Score-Remote-/Scoreline-Fortsetzung, besonders im Hybrid-Slot.

## Nachtrag: Active-Remote-Advance-Isolation

Hypothese: Die Korp soll eine aktive, unkontestierte Remote-Agenda weiter advancen duerfen, wenn das Scoring-Window selbst `recommendedNextStep:advance` meldet und der Runner vor dem Score weder sichtbar contesten noch Access erreichen kann. In diesem engen Fall darf der Reserve-Floor die Advance-Aktion nicht weiterhin pauschal als `corp_active_remote_agenda_underfunded_advance` wegdruecken.

Gegenhypothese verworfen: HQ-Agenda-Risiko nicht mehr als `hq_pressure` mitzuzahlen wirkte lokal plausibel, verschlechterte aber den Net-Damage-Slot stark. In der isolierten Central-only-Variante kippte `strategy_panel_net_damage_black_ice` Seed `ai-v143-tuning-001` von Corp-Flatline zu Runner-Sieg per `corp_deck_empty`, Seed `ai-v143-tuning-003` lief ins Action-Limit. Diese Variante wird deshalb nicht uebernommen.

Isolierter 5-Seed-/480-Actions-Beleglauf fuer die Active-Advance-Variante:

| Slot | Ergebnis gegen bereinigte Baseline | Agenda-Punkte Runner/Corp | Corp Scores | Runner Steals | Action-Limit | Auffaelligkeiten |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `strategy_panel_fast_advance_chrome_rush` | weiter 5/5 Corp-Agenda-Siege, leicht schneller | 6 / 35 | 23 | 3 | 0 | `averageActions` 222.8 statt 224.8; keine IllegalActions. |
| `strategy_panel_net_damage_black_ice` | unveraendert 5/5 Corp-Flatline-Siege | 10 / 2 | 1 | 6 | 0 | Damage-Slot bleibt stabil; keine Verschlechterung durch Scoreline-Relaxation. |
| `strategy_panel_hybrid_score_punish_cheap_bag` | weiter 5/5 Corp-Agenda-Siege, deutlich weniger Central-over-ice | 20 / 37 | 13 | 8 | 0 | `averageActions` 247.6 statt 285.4; `corpCentralOverIcedWithoutPressure` 189 statt 280; `corpExtraCentralIceChosenOverAdvanceOrScore` 0 statt 2. |

Bewertung: Die Active-Advance-Variante ist als kleine, belegte Verbesserung uebernehmbar. Sie veraendert keine LegalAction-Erzeugung, keine Engine-Regeln und keine Hidden-Info-Grenzen; sie nutzt nur bereits vorhandene Scoring-Window-Evidence strenger fuer die Corp-Scorewertung.
