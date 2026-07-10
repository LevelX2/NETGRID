# Current Plan Model Quality Baseline

Datum: 2026-07-09

Quelle:

- lokaler, nicht versionierter Vollbestand:
  `data/local/current-plan-model-strategy-panel-5x480-2026-07-09.json`
- `docs/reviews/ai/current-plan-model-strategy-panel-5x480-2026-07-09.md`

Konfiguration:

- Profile: `current_candidate` gegen `current_candidate`
- Slots: `strategy_panel_fast_advance_chrome_rush`, `strategy_panel_net_damage_black_ice`, `strategy_panel_hybrid_score_punish_cheap_bag`
- Seeds: `ai-v143-tuning-001` bis `ai-v143-tuning-005`
- Spiele: 15
- Max Actions: 480
- Gesamtaktionen: 3283

## Zweck

Diese Baseline misst nicht isoliert die Spielstärke einer Seite. Sie bewertet den aktuellen Selfplay-Stand als Spielqualitäts- und Regressionstest: Werden bekannte schlechte Muster seltener, entstehen weniger Stalls, werden Score-Fenster genutzt und vermeidet die KI bekannte No-Value- oder No-Access-Aktionen?

Die Gewichtung ist eine erste pragmatische Diagnoseformel. Sie ist absichtlich klein und transparent gehalten, damit spätere Läufe vergleichbar bleiben und die Gewichtung bei Bedarf bewusst angepasst werden kann.

## Quality-Index v0

Gewichtete Auffälligkeitspunkte pro 100 Aktionen. Niedriger ist besser.

| Slot                | Spiele | Aktionen | Quality-Index / 100 Aktionen | Harte Fehler | Action-Limits | Known-bad Runs | Missed Score Windows | No-Progress Repeats | Runner Pressure Skips | Corp Underbuilt/Central-Overice | Corp Central-Overice | Unnötige Corp-Economy vor Score |
| ------------------- | -----: | -------: | ---------------------------: | -----------: | ------------: | -------------: | -------------------: | ------------------: | --------------------: | ------------------------------: | -------------------: | ------------------------------: |
| Fast Advance        |      5 |     1609 |                        44.83 |            0 |             2 |              0 |                    0 |                  82 |                   622 |                             157 |                  296 |                             189 |
| Net Damage          |      5 |      520 |                        18.69 |            0 |             0 |              0 |                    0 |                  19 |                    95 |                              12 |                   12 |                              18 |
| Hybrid Score Punish |      5 |     1154 |                        24.31 |            0 |             1 |              0 |                    0 |                  49 |                   199 |                               6 |                   97 |                             147 |
| Gesamt              |     15 |     3283 |                        33.48 |            0 |             3 |              0 |                    0 |                 150 |                   916 |                             175 |                  405 |                             354 |

## Gewichtung v0

| Signal                                                       | Gewicht |
| ------------------------------------------------------------ | ------: |
| Harte Fehler: illegale Aktion, Replay-Failure, Timeout       |    12.0 |
| Action-Limit-Spiel                                           |     8.0 |
| Known-bad Run: bekannte unbreakable/unpayable/no-value Pfade |    10.0 |
| Verpasstes legales Score-Fenster                             |    10.0 |
| Strategic no-progress repeat                                 |     1.5 |
| Runner setup/pressure skip window                            |     0.5 |
| Runner search/recovery ohne Anschlussinstallation            |     2.0 |
| Corp remote underbuilt while centrals over-iced              |    0.75 |
| Corp central over-iced without pressure                      |    0.25 |
| Corp economy before score window, soweit nicht notwendig     |     0.4 |

## Rohbefund

- Harte technische Fehler sind sauber: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.
- Score-Actions werden nicht ignoriert: `scoreActionTakeRate = 1.0` in allen drei Slots, `missedScoreWindows = 0`.
- Die grobe Run-Safety der Runner-KI ist aktuell sauber: keine Runs gegen bekannte unbreakable oder unpayable Paths.
- Das größte Qualitätsproblem ist nicht Regel-/Legalitätsversagen, sondern strategischer Leerlauf und Konversion:
  - Fast Advance hat den schlechtesten Quality-Index, vor allem durch Action-Limits, Runner-Pressure-Skips und Corp-Remote-Unterbau bei gleichzeitigem Central-Overice.
  - Hybrid ist besser als Fast Advance, aber immer noch durch Action-Limit und unnötige Economy-/Central-Schutz-Fenster belastet.
  - Net Damage ist im Panel deutlich sauberer, auch weil Spiele kurz enden und weniger Long-game-Stall entsteht.

## Interpretation

Diese Baseline ist als Startpunkt für künftige Qualitätsvergleiche brauchbar, aber noch keine finale Metrik für Spielstärke.

Wichtig ist die Trennung:

- `hard` und `knownBadRuns` sind echte Regression-Signale.
- `missedScoreWindows` ist ein starkes Corp-Qualitätssignal.
- `runnerPressureSkips`, `corpCentralOverIcedWithoutPressure` und `corpRemoteScoringUnderbuiltWhileCentralsOverIced` sind Diagnosefenster. Sie zeigen Verdachtsmuster, sind aber nicht jede für sich zwingend ein einzelner schlechter Zug.

Für zukünftige Läufe sollte dieser Quality-Index zusammen mit Winrate, Agenda-Punkten, Action-Limit-Rate und durchschnittlicher Spieldauer betrachtet werden. Eine Verbesserung ist besonders belastbar, wenn harte Fehler null bleiben, der Quality-Index sinkt und Action-Limits sowie No-Progress-Ketten abnehmen, ohne dass Scores/Steals künstlich einbrechen.
