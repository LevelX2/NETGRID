# Corp Scoring Remote Iterations: Strategy-Gated Offtarget ICE Review

Datum: 2026-07-07

## Befund

Im Hybrid-Slot `strategy_panel_hybrid_score_punish_cheap_bag` wurde in Seed
`ai-v143-tuning-005` eine aktive Score-Remote-Linie ausgebremst: Bei
`protect_score_remote` und Ziel `remote_1` konnte off-target Central-ICE trotz
`corp_board_triage_mismatch` durch lokale ICE-Placement-Boni gewinnen.

Eine breite Erhoehung des `protect_score_remote`-Mismatchs wurde verworfen. Sie
reduzierte zwar Central-Over-Ice im Hybrid-Slot, verschlechterte aber den
Fast-Advance-Slot und wuerde auch nicht-scoreline-primaere Korp-Decks zu stark
auf Remote-Schutz ziehen.

## Uebernommene Aenderung

Der harte Mismatch gilt nur fuer eine enge Lage:

- Triage `protect_score_remote`
- Severity `high` oder `critical`
- Aktion installiert ICE
- Aktionsserver ist nicht das Triage-Ziel
- die produktive Korp-Strategie will Remote-Score-Entwicklung

Alle anderen high/critical Mismatch-Faelle behalten den bestehenden Wert.

## Benchmark-Evidence

Jeweils 5 Seeds, `maxActions=480`, Profil `current_candidate`.

| Slot | Ergebnis | Agenda-Punkte Runner/Corp | Corp Scores | Runner Steals | Action-Limit | Auffaelligkeit |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `strategy_panel_hybrid_score_punish_cheap_bag` | 5/5 Corp-Agenda-Siege | 16 / 37 | 12 | 7 | 0 | `corpCentralOverIcedWithoutPressure` 32 statt 190; `corpRemoteScoringUnderbuiltWhileCentralsOverIced` 0 statt 7; `averageActions` 188.6 statt 250. |
| `strategy_panel_fast_advance_chrome_rush` | 5/5 Corp-Agenda-Siege | 6 / 35 | 23 | 3 | 0 | Unveraendert gegen die engere Vorvariante; keine Fast-Advance-Regression. |
| `strategy_panel_net_damage_black_ice` | 3 Flatlines, 1 Runner-Deckout, 1 Action-Limit | 13 / 3 | 2 | 8 | 0.2 | Unveraendert gegen die engere Vorvariante, aber klarer separater Restbefund fuer Net-Damage-/Punish-Plan-Stabilitaet. |

## Bewertung

Die Aenderung ist als begrenzter Hybrid-Scoring-Remote-Fix akzeptierbar: Sie
reduziert das belegte Central-Over-Ice-Fehlmuster deutlich, ohne Fast-Advance zu
verschlechtern. Der Net-Damage-Slot bleibt auffaellig, wird aber durch diese
enge Offtarget-ICE-Regel nicht zusaetzlich verschlechtert und muss separat
analysiert werden.
