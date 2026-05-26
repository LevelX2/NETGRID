# AI Local Pair 2 ActionLimit und Remote-Portfolio-Diagnose

Datum: 2026-05-24

## Kurzfazit

Die leichte ActionLimit-Verschlechterung nach dem Remote-Portfolio-/HQ-Density-Slice ist kein breiter Suite-Regressionsbruch. Sie konzentriert sich im aktuellen 160er Lauf fast vollständig auf `local_realistic_pair_2`. Dort ist sie aber ein echtes Stagnationssignal: `finalStrategicWindowNoProgressActions` steigt von `88` auf `129`, `sameStrategicPlanRepeatedWithoutProgress` von `129` auf `153` und `endgameLowValueRepeatActions` von `22` auf `44`.

Die Änderung ist zugleich ein plausibler Tradeoff: Corp-Scores steigen global und in Local Pair 2, Runner-Steals sinken, Remote-Proliferation und HQ-Flood-Risiko sinken deutlich. Für eine Default-Aktivierung bleibt Local Pair 2 aber ein Warnsignal, weil weniger planloser Remote-Bau dort nicht in terminalen Score-/Punish-Druck konvertiert.

Es wurde keine Strategie geändert. `corpRemoteIceConsolidationTaken = 0` wirkt nach dieser Diagnose eher wie eine zu enge Taken-Definition nach dem neuen Portfolio-Gate als wie ein eindeutiger Strategiebug.

## Konfiguration

- Suite: Match-Progression-Deck-Suite mit 8 runnable Slots.
- Profile: `belief_ai_v1_4_2` gegen `current_candidate`.
- Seeds: `ai-v143-tuning-001` bis `006`, `ai-v143-holdout-001` bis `003`.
- `maxActions: 160`.
- Real-Scene-Paare bleiben `holdout_only`.
- Keine neuen Decks, keine AI-Hints, keine Strategieänderung.

## Globale ActionLimit-Tradeoff-Analyse

| Slot              | ActionLimit Baseline -> Candidate | Corp Scores | Runner Steals | Befund                                                     |
| ----------------- | --------------------------------: | ----------: | ------------: | ---------------------------------------------------------- |
| Smoke             |                  `0.667 -> 0.667` |   `7 -> 10` |    `14 -> 13` | Stagnation stabil, Corp-Score besser.                      |
| Snapshot Rig      |                  `0.222 -> 0.222` |  `10 -> 11` |    `24 -> 20` | Keine ActionLimit-Verschlechterung, weniger Runner-Steals. |
| Snapshot Pressure |                  `0.333 -> 0.333` |  `10 -> 13` |    `27 -> 22` | Keine ActionLimit-Verschlechterung, mehr Corp-Scores.      |
| Snapshot Holdout  |                  `0.556 -> 0.556` |    `9 -> 8` |    `19 -> 18` | Weiter schwach, aber nicht schlechter bei ActionLimit.     |
| Local Pair 1      |                  `0.111 -> 0.111` |    `5 -> 4` |      `7 -> 9` | ActionLimit stabil, Corp-Score etwas schwächer.            |
| Local Pair 2      |                  `0.444 -> 0.667` |    `1 -> 4` |    `26 -> 20` | Einziger klarer ActionLimit-Regressionsslot.               |
| Real Scene Pair 1 |                  `0.444 -> 0.444` |    `8 -> 9` |    `14 -> 14` | Holdout stabil, leicht besser für Corp.                    |
| Real Scene Pair 2 |                  `1.000 -> 0.889` |    `7 -> 6` |      `7 -> 8` | ActionLimit verbessert, aber weiter sehr zäh.              |

Aggregiert ist die Verschlechterung kein Safety- oder IllegalAction-Problem. `illegalActions`, `replayFailures` und `timeoutRate` bleiben 0. Die Suite zeigt eher einen strategischen Tradeoff: Die Corp spielt sauberer und weniger horizontal, erzeugt aber in einem R&D-/Tag-Punish-Matchup nicht zuverlässig ein terminales Punish- oder Score-Ende.

## Local Pair 2 Diagnose

Slot:

- `local_realistic_pair_2`
- Runner: `R&D Interface Dig`
- Corp: `Shadoe Tag & Bag`
- Rolle: Runner R&D-/Interface-Druck gegen Corp Tag-/Punish-Druck.

Kernmetriken:

| Metrik                                     | Baseline | Candidate | Bewertung                   |
| ------------------------------------------ | -------: | --------: | --------------------------- |
| ActionLimitRate                            |  `0.444` |   `0.667` | schlechter                  |
| `finalStrategicWindowNoProgressActions`    |     `88` |     `129` | echter Stall                |
| runner final no-progress                   |     `39` |      `59` | Runner-Anteil steigt        |
| corp final no-progress                     |     `49` |      `70` | Corp-Anteil steigt stärker  |
| `endgameSetupOrEconomyActions`             |     `56` |      `85` | mehr Setup/Economy          |
| `endgameProtectionActions`                 |     `10` |      `19` | mehr Schutzfenster          |
| `endgameLowValueRepeatActions`             |     `22` |      `44` | Repeat-Stall verdoppelt     |
| `sameStrategicPlanRepeatedWithoutProgress` |    `129` |     `153` | höher                       |
| Corp Scores                                |      `1` |       `4` | besser                      |
| Runner Steals                              |     `26` |      `20` | niedriger                   |
| Score/Steal per Match                      |  `3.000` |   `2.667` | weniger terminale Aktivität |

Die Stagnation ist beidseitig, leicht Corp-lastig. Candidate blockt Runner-Steals besser und scored häufiger, aber beide Seiten verbringen mehr Endgame-Fenster in Economy, Setup, Protection und wiederholten Lines ohne Abschluss.

### Remote Portfolio

| Metrik                                   | Baseline | Candidate | Bewertung                 |
| ---------------------------------------- | -------: | --------: | ------------------------- |
| `corpNewRemoteCreated`                   |      `9` |       `8` | kaum verändert            |
| `corpNewRemoteCreatedWithoutPayloadPlan` |      `4` |       `5` | leicht schlechter         |
| `corpEmptyRemoteStayedUnusedTurns`       |      `4` |       `5` | leicht schlechter         |
| `corpRemoteConversionRate`               |  `0.556` |   `0.375` | schlechter                |
| `corpRemotePortfolioOverExpanded`        |      `0` |       `0` | kein Überexpansionssignal |
| `corpRemoteIceConsolidationOpportunity`  |      `4` |       `2` | seltener                  |
| `corpRemoteIceConsolidationTaken`        |      `1` |       `0` | siehe Metrikprüfung       |

Local Pair 2 leidet nicht an massiver neuer Remote-Proliferation. Das Problem ist subtiler: weniger Runner-Steals und bessere Corp-Scores zeigen, dass Schutz funktioniert, aber die verbliebenen Remote-/Tag-Punish-Linien konvertieren nicht zuverlässig in Matchende. Candidate hat in einzelnen ActionLimit-Traces weiter leere oder nicht konvertierte Remote-Pläne, aber nicht genug, um den gesamten Stall als Remote-Portfolio-Bug zu erklären.

### HQ Density und Draw-Dilution

| Metrik                                  | Baseline | Candidate | Bewertung          |
| --------------------------------------- | -------: | --------: | ------------------ |
| `corpHqAgendaDensity`                   |  `0.111` |   `0.125` | ungefähr stabil    |
| `corpHqAgendaFloodRisk`                 |     `42` |      `27` | besser             |
| `runnerHqAccessThreat`                  |    `178` |      `71` | deutlich niedriger |
| `corpDrawChosenToDiluteAgendaFlood`     |     `28` |       `0` | stark reduziert    |
| `corpDrawSkippedBecauseAgendaFloodRisk` |     `11` |       `1` | reduziert          |
| `corpHqProtectionChosenOverDilution`    |     `17` |       `3` | reduziert          |

Die Unterdrückung von Draw-Dilution ist sichtbar. Sie ist aber nicht offensichtlich falsch, weil HQ-Flood-Risiko und HQ-Zugriffsrisiko gleichzeitig sinken. Offen bleibt, ob die Corp dadurch in Local Pair 2 zu selten Tag-/Punish- oder Scorekarten findet. Die aktuellen Metriken beweisen diesen kausalen Zusammenhang nicht.

## Repro-Traces

### Local Pair 2, Candidate, `ai-v143-tuning-003`

- Final: Runner 2, Corp 0.
- ActionLimit: ja, 160 Actions.
- Dominante Seite: beidseitig mit starker Runner-Run-Schleife in der letzten Sequenz.
- Auffälliger Endzustand: letzter HQ-Density-Snapshot `HQ cards = 8`, `known agendas = 4`, `density = 0.571`, Runner-HQ-Threat `true`.
- Letzte strategische Sequenz: Corp zieht dreimal und endet den Zug; danach wiederholt der Runner vier R&D-/Run-Sequenzen mit `start_run`/`continue_run`, die Corp lehnt mehrfach Rez ab.
- Interpretation: kein reiner Corp-Remote-Portfolio-Fehler. Das Match steckt in einem späten Zentraldruck-/HQ-Flood-Kontext, aber ohne Score, Steal oder Punish-Abschluss. Draw wurde hier tatsächlich genutzt, aber nicht terminal.

### Local Pair 2, Candidate, `ai-v143-tuning-006`

- Final: Runner 2, Corp 2.
- ActionLimit: ja, 160 Actions.
- Letzte Sequenz: Runner stiehlt, Corp installiert und advanced, Runner contestet/läuft, Corp scored später einmal und resolved eine Folgefähigkeit.
- Auffällig: Candidate scored hier, läuft aber trotzdem ins Limit.
- Interpretation: Corp-Score-Conversion ist nicht tot. Der Stall entsteht nach Fortschritt, weil keine Seite die nächsten Punkte oder eine Punish-Linie abschließt.

### Local Pair 2, Candidate, `ai-v143-holdout-003`

- Final: Runner 6, Corp 3.
- ActionLimit: ja, 160 Actions.
- Letzte Sequenz: Corp advanced mehrfach, scored, nutzt zweimal `activated_card_ability`, endet aber bei Runner 6 / Corp 3 im Limit.
- Interpretation: Scored-Agenda-Ability-Fix ist aktiv; das Problem ist nicht Political-Overthrow-artige Basic-Credit-Verdrängung. Es fehlt die letzte Terminalkonversion nach bereits vorhandener Score-/Punish-Aktivität.

### Vergleich: Local Pair 2, Baseline, `ai-v143-tuning-003`

- Final: Runner 7, Corp 0.
- ActionLimit: nein, 107 Actions.
- Letzte Sequenz: Corp installiert/advanced, Runner läuft, stiehlt, läuft erneut und stiehlt.
- Interpretation: Baseline beendet diesen Seed nicht durch bessere Corp-Linie, sondern durch erfolgreiche Runner-Steals. Candidate verhindert solche Steals häufiger, erzeugt aber nicht immer genug eigene Terminalität als Ersatz.

## Remote-Ice-Consolidation-Metrikprüfung

`corpRemoteIceConsolidationTaken` fällt in der Suite von `51` auf `0`, obwohl der fokussierte Fixture-Fall für bestehende-Remote-Verstärkung greift.

Die Diagnose spricht gegen einen klaren Metrik- oder Strategiebug:

- Die Opportunitäten sinken suiteweit deutlich, z. B. Local Pair 2 `4 -> 2`, Smoke `60 -> 36`, Real Scene Pair 1 `23 -> 6`.
- Die neue Logik vermeidet viele neue Remote-Planfenster früher. Dadurch gelangt die Entscheidung seltener in den engen Zweig "neuen Remote öffnen versus bestehende Remote verstärken".
- `Taken` scheint nur eine explizite Konsolidierungsaktion in genau diesem Portfolio-Konfliktfenster zu zählen. Wenn der neue Remote gar nicht mehr als plausibler Plan entsteht oder Score/HQ-Schutz/Economy stattdessen gewählt wird, bleibt `Taken` 0, obwohl die Portfolio-Disziplin wirken kann.
- Der Fixture-Fall bleibt nützlich, ist aber nicht repräsentativ für die Suiteverteilung nach dem Gate.

Empfohlene Metrikschärfung für einen späteren Diagnose-Slice:

- `corpRemoteIceConsolidationOpportunity`
- `corpRemoteIceConsolidationTaken`
- `corpRemoteIceConsolidationSuppressedBecauseNoScorePath`
- `corpRemoteIceConsolidationNotNeededBecauseRemotePlanAvoided`
- `corpRemoteIceConsolidationSkippedForHqProtection`
- `corpRemoteIceConsolidationSkippedForScorePath`

Aktueller Befund: `0` ist ein Warnsignal und eine zu enge Interpretationsbasis, aber kein ausreichender Grund für eine Strategieänderung.

## Slotübergreifende Muster

Stabil verbessert oder unverändert:

- Safety bleibt sauber.
- Cheap-Remote-Safety bleibt erhalten.
- Scored-Agenda-Ability-Fix bleibt erhalten.
- Remote-Proliferation sinkt in fast allen Slots.
- HQ-Flood-Risiko sinkt in fast allen Slots.
- Corp-Scores steigen in Smoke, Snapshot Rig, Snapshot Pressure, Local Pair 2 und Real Scene Pair 1.

Problematisch:

- Local Pair 2 erzeugt echten neuen Endgame-Stall.
- Snapshot Holdout bleibt schwach für Candidate-Corp-Scores, verschlechtert aber ActionLimit nicht.
- Real Scene Pair 2 bleibt zäh, verbessert aber ActionLimit.
- Local Pair 1 verliert etwas Corp-Score, ohne ActionLimit-Regress.

## Empfehlung

Kein Fix in diesem Schritt.

Ein enger Fix-Slice ist erst gerechtfertigt, wenn ein generisches Muster aus Local Pair 2 reproduzierbar isoliert ist. Der beste nächste Diagnose-/Fix-Korridor wäre nicht "mehr Draw" oder "mehr Remote", sondern:

1. **Tag/Punish Terminal Conversion Diagnose** für Corp-Decks mit sichtbarer Tag-/Trace-/Punish-Line: Prüfen, ob legale Punish-Fenster existieren und nicht genommen werden.
2. **Post-Safety Terminality Review**: Wenn Runner-Steals sinken und Corp-Scores steigen, aber ActionLimit steigt, erfassen, welche Seite nach dem letzten Score/Steal den Abschluss verhindert.
3. **Remote-Consolidation-Metriksplit**: erst Metrik aufteilen, dann entscheiden, ob bestehende Remotes wirklich zu selten aktiv verstärkt werden.

Release Review ist vertretbar, wenn die bessere Safety-, Remote-Portfolio- und Score-Aktivität als Tradeoff akzeptiert wird. Für Default-Qualität bleibt Local Pair 2 jedoch ein offener Blocker.
