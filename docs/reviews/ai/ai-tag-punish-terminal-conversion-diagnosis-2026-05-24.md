# AI Tag/Punish Terminal Conversion Diagnose

Datum: 2026-05-24

## Kurzfazit

Local Pair 2 ist mit fehlender Tag/Punish-Terminalkonversion verbunden, aber die aktuelle Evidenz zeigt eher ein Timing- und Messproblem als einen klaren "Punish legal, aber nicht genommen"-Bug.

Die Corp erzeugt Tag-/Trace-Fenster. In Local Pair 2 liegen bei Candidate 22 Corp-Trace-Bids und 22 Runner-Trace-Bids vor; der Runner entfernt 19 Tags. Aus den Action-Traces ist kein ausgewählter Scorched-/Urban-/Punitive-Punish zu sehen. Die gewählten Corp-Operationen sind fast ausschließlich `corp.plan.recover_economy`; `corp.tag.punish_visible_tag` tritt in Local Pair 2 nicht als gewählte Operation auf.

Das spricht für drei engere Befunde:

1. Viele Tags entstehen während Runner-Runs über ICE-/Trace-Fenster und werden vor dem nächsten Corp-Zug entfernt.
2. Candidate wählt in Local Pair 2 Tag/Punish-Strategic-Lines, aber konvertiert sie nicht in gewählte Punish-Aktionen.
3. Die aktuelle Suite-Metrik kann echte Punish-Legalität im Moment der Corp-Entscheidung nicht sicher belegen; dafür fehlt eine Diagnosemetrik in der Simulation Summary.

Es wurde keine Strategie geändert.

## Konfiguration

- Suite: aktuelle 8-Slot Match-Progression-Deck-Suite.
- Profile: `belief_ai_v1_4_2` und `current_candidate`.
- Seeds: `ai-v143-tuning-001` bis `006`, `ai-v143-holdout-001` bis `003`.
- `maxActions: 160`.
- Fokus-Slots:
  - `local_realistic_pair_2`: `R&D Interface Dig` vs `Shadoe Tag & Bag`.
  - `snapshot_holdout_origin_pressure_vs_tag_ops`.
  - `real_scene_pair_2`: `Stealth Interface Starter` vs `Manhunt Pressure Bureau`.

## Decksignale

### Shadoe Tag & Bag

Tagquellen:

- `Netwatch Operations Office` x1: scored agenda trace tag.
- `Hunter` x2: ICE trace tag.
- `Audit of Call Records` x3: operation trace tag nach zwei Runner-Runs.
- `Chance Observation` x2: operation trace tag nach Runner-Run.
- `Trojan Horse` x3: Tag nach Runner-Agenda-Steal.

Punish:

- `Punitive Counterstrike` x3.
- `Scorched Earth` x3.
- `Urban Renewal` x3.

### Snapshot Holdout Tag Ops

Tagquellen:

- `Fetch 4.0.1` x1.
- `Hunter` x1.
- `Datapool by Zetatech` x1.
- `Netwatch Credit Voucher` x1.

Punish/Tag-Payoff:

- `Closed Accounts` x2.
- `Datapool by Zetatech` x1.
- `Netwatch Credit Voucher` x1.

### Manhunt Pressure Bureau

Tagquellen:

- `Audit of Call Records` x3.
- `Chance Observation` x3.
- `City Surveillance` x2.

Punish:

- `Closed Accounts` x2.
- `Power Grid Overload` x1.
- `Scorched Earth` x3.
- `Urban Renewal` x2.
- `I Got a Rock` x1.

## Slotvergleich

| Slot              | Profile   | ActionLimit | Runner Steals | Corp Scores | Trace Bids | Runner Remove Tag | Gewählte Tag/Punish-Operationen |
| ----------------- | --------- | ----------: | ------------: | ----------: | ---------: | ----------------: | ------------------------------: |
| Local Pair 2      | Baseline  |     `0.444` |          `26` |         `1` |       `20` |              `19` |                             `1` |
| Local Pair 2      | Candidate |     `0.667` |          `20` |         `4` |       `22` |              `19` |                             `0` |
| Snapshot Holdout  | Baseline  |     `0.556` |          `19` |         `9` |       `29` |              `16` |                             `4` |
| Snapshot Holdout  | Candidate |     `0.556` |          `18` |         `8` |       `29` |              `21` |                             `7` |
| Real Scene Pair 2 | Baseline  |     `1.000` |           `7` |         `7` |       `22` |              `19` |                             `1` |
| Real Scene Pair 2 | Candidate |     `0.889` |           `8` |         `6` |       `22` |              `20` |                             `0` |

Interpretation:

- Local Pair 2 und Real Scene Pair 2 zeigen Candidate-seitig keine gewählten Tag/Punish-Operationen, obwohl Tag/Punish-Lines strategisch selektiert werden.
- Snapshot Holdout ist der Gegenbeweis gegen einen pauschalen "Candidate nutzt Tag/Punish nie"-Befund: dort nimmt Candidate mehr Tag/Punish-Operationen als Baseline (`7` statt `4`), ohne ActionLimit zu verschlechtern.
- Das Problem ist deshalb nicht generisch "Tag/Punish-Karten werden nie bewertet", sondern slot- und timingabhängig.

## Local Pair 2 Analyse

Kernwerte:

| Metrik                            | Baseline | Candidate | Bewertung                       |
| --------------------------------- | -------: | --------: | ------------------------------- |
| ActionLimitRate                   |  `0.444` |   `0.667` | schlechter                      |
| Corp Scores                       |      `1` |       `4` | besser                          |
| Runner Steals                     |     `26` |      `20` | Runner-Druck sinkt              |
| Score/Steal per Match             |  `3.000` |   `2.667` | weniger Terminalität            |
| `corpStrategicLineTagTracePunish` |      `0` |      `21` | Line-Modell erkennt Tag/Punish  |
| `corpStrategicLineBaitAndPunish`  |      `0` |       `5` | Line-Modell erkennt Bait/Punish |
| Corp Trace Choices                |     `20` |      `22` | Tagquellen feuern               |
| Runner Trace Choices              |     `20` |      `22` | Runner reagiert auf Trace       |
| Runner Remove Tag                 |     `19` |      `19` | Tags werden fast immer entfernt |
| Gewählte Tag/Punish-Operationen   |      `1` |       `0` | kein Candidate-Punish           |

Die letzten ActionLimit-Traces zeigen keinen eindeutigen "Punish wurde übergangen"-Eintrag. Stattdessen folgt auf Trace-Fenster häufig Runner-Tag-Removal. Das passt zu ICE-/Run-basierten Tags, die während des Runner-Zugs entstehen. Wenn der Runner den Tag sofort entfernt, existiert im nächsten Corp-Entscheidungsfenster kein Punish-Zustand mehr.

Candidate schützt und scored besser, aber die Tag/Punish-Linie bleibt diagnostisch inkonsistent: Sie wird als Strategic Line gezählt, ohne dass danach eine terminale Operation oder Damage-Aktion sichtbar folgt.

## Repro-Traces Local Pair 2

### Candidate `ai-v143-tuning-001`

- Final: Runner 2, Corp 0.
- ActionLimit: ja.
- Trace/Punish:
  - Corp Trace Bids: 3.
  - Runner Trace Bids: 3.
  - Runner Remove Tag: 2.
  - Gewählte Punish-Operation: keine.
- Letzte Corp-Entscheidungen:
  - wiederholte `corp.plan.recover_economy`.
  - `corp.plan.protect_rnd`.
  - `corp.end_turn`.
  - keine `corp.tag.punish_visible_tag`.
- Grund für fehlenden terminalen Druck:
  - Tagfenster entstehen, aber werden nicht in Corp-Punish übersetzt.
  - Es ist aus der aktuellen Summary nicht belegbar, dass Scorched/Urban/Punitive in einem Corp-Fenster legal waren.

### Candidate `ai-v143-tuning-003`

- Final: Runner 2, Corp 0.
- ActionLimit: ja.
- Trace/Punish:
  - Corp Trace Bids: 2.
  - Runner Trace Bids: 2.
  - Runner Remove Tag: 1.
  - Gewählte Punish-Operation: keine.
- Auffälliger Zustand aus vorheriger Local-Pair-2-Diagnose:
  - HQ kann spät agenda-heavy werden.
  - Runner-HQ-Threat bleibt sichtbar.
  - Corp zieht und schützt, statt terminal zu punkten oder zu punishen.
- Grund für fehlenden terminalen Druck:
  - kein klarer Corp-Punish-Window-Nachweis.
  - Stagnation bleibt beidseitig, nicht nur Tag/Punish.

### Candidate `ai-v143-holdout-003`

- Final: Runner 6, Corp 3.
- ActionLimit: ja.
- Trace/Punish:
  - Corp Trace Bids: 5.
  - Runner Trace Bids: 5.
  - Runner Remove Tag: 5.
  - Gewählte Punish-Operation: keine.
- Score-Verlauf:
  - Corp scored und nutzt scored-agenda economy.
  - Trotzdem kein terminaler Abschluss.
- Grund für fehlenden terminalen Druck:
  - Score-Linie existiert; Tag/Punish bleibt Nebenlinie ohne Abschluss.
  - Scored-Agenda-Ability-Fix ist aktiv, aber Tag/Punish-Conversion nicht.

### Baseline-Vergleich `ai-v143-tuning-003`

- Final: Runner 7, Corp 0.
- ActionLimit: nein.
- Trace/Punish:
  - Corp Trace Bids: 2.
  - Runner Trace Bids: 2.
  - Runner Remove Tag: 2.
  - Gewählte Punish-Operation: keine.
- Interpretation:
  - Baseline beendet diesen Seed über Runner-Steals, nicht über bessere Corp-Punish-Konversion.
  - Candidate verhindert solche Steals häufiger, erzeugt aber nicht genug eigene Terminalität.

## Terminal-Conversion-Klassifikation

Für Local Pair 2:

- `tag_source_available`: ja, deckseitig klar.
- `tag_source_taken`: ja, über Trace-Fenster.
- `runner_tagged`: ja, indirekt durch Runner-Remove-Tag-Aktionen belegt.
- `runner_tagged_no_punish_available`: wahrscheinlich häufig, aber mit aktueller Summary nicht beweisbar.
- `runner_tagged_punish_available`: nicht belegbar.
- `runner_tagged_punish_taken`: nein.
- `runner_tagged_punish_skipped`: nicht beweisbar.
- `punish_available_no_tag`: nicht belegbar.
- `trace_available_and_affordable`: teilweise, Trace-Bids treten auf.
- `trace_taken`: ja.
- `punish_window_expired`: plausibel, weil Tags fast vollständig entfernt werden.
- `tag_punish_line_converted`: nein.
- `tag_punish_line_stalled`: ja, für Candidate.
- `tag_punish_line_blocked_by_no_card`: nicht belegbar.
- `tag_punish_line_overridden_by_score`: teilweise, Candidate scored öfter.
- `tag_punish_line_overridden_by_economy`: möglich, da viele `recover_economy`-Operationen, aber Punish-Legalität fehlt als Nachweis.

## Metrikprüfung

Bestehende Diagnose reicht für diese Aussagen:

- Strategic-Line-Auswahl erkennt Tag/Punish (`corpStrategicLineTagTracePunish`, `corpStrategicLineBaitAndPunish`).
- Trace-Fenster treten über `corp.trace.bid_visible_amount` und `runner.trace.bid_visible_amount` auf.
- Runner entfernt Tags über `runner.tag.clear_visible_tag`.
- Scored-agenda trace/damage opportunities bleiben in diesen drei Slots 0.

Bestehende Diagnose reicht nicht für diese Aussagen:

- ob eine Punish-Karte in HQ lag, als Runner tagged war.
- ob eine Punish-LegalAction im Corp-Fenster existierte.
- ob Punish wegen Credits, Score, Remote-Safety, Protection oder Economy übersprungen wurde.
- ob Tags am Ende des Runner-Zugs noch standen.

Deshalb wurde kein Metrikcode geändert. Ein sinnvoller nächster Metrik-Slice wäre rein diagnostisch und side-correct aus Corp-Sicht:

- `corpTagSourceOpportunities`
- `corpTagSourceTaken`
- `runnerTaggedWindows`
- `runnerTaggedAtCorpDecision`
- `corpPunishOpportunities`
- `corpPunishTaken`
- `corpPunishSkipped`
- `corpPunishSkippedForEconomy`
- `corpPunishSkippedForProtection`
- `corpPunishSkippedForScore`
- `corpTaggedRunnerButNoPunish`
- `corpPunishInHandButNoTag`
- `corpPunishWindowExpiredBeforeCorpTurn`

Diese Metriken sollten nicht in AIInput fließen, sondern in Simulation Summary/Review-Diagnose bleiben, solange kein Fix gerechtfertigt ist.

## Generikbefund

Das Problem ist nicht breit genug für eine Strategieänderung:

- Snapshot Holdout zeigt Candidate nimmt mehr Tag/Punish-Operationen (`7`) als Baseline (`4`).
- Real Scene Pair 2 zeigt ebenfalls fehlende Candidate-Punish-Aktionen, aber dort verbessert sich ActionLimit (`1.000 -> 0.889`), obwohl Corp-Scores leicht sinken.
- Local Pair 2 bleibt der klare Problemfall, aber ein Holdout-Slot allein reicht nicht für Tuning.

Der generische Befund ist enger:

> Das System unterscheidet noch nicht gut genug zwischen "Tag/Punish-Line wurde strategisch gewählt" und "ein Corp-Punish-Fenster existiert wirklich jetzt". Tags aus Runner-Run-Fenstern erzeugen sichtbare Tag-Aktivität, konvertieren aber selten in Corp-Punish, weil der Runner sie entfernen kann.

## Empfehlung

Kein Strategie-Fix in diesem Schritt.

Nächster enger Slice:

1. **Tag/Punish Window Metrics Slice**: Simulation Summary um side-correcte Diagnose erweitern, die Punish-Legalität und Tag-Status am Corp-Entscheidungsfenster erfasst.
2. Danach erst entscheiden, ob eine enge Klassifikationskorrektur nötig ist:
   - Punish-LegalAction vorhanden und KI wählt Economy/Protection.
   - Tagquelle-Operation legal und sinnvoll, aber KI nimmt nur Economy.
   - Tagfenster verfallen vor Corp-Zug, also kein KI-Punish-Fehler.

Release Review ist möglich, wenn Local Pair 2 als bekannter Holdout-Warnpunkt akzeptiert wird. Für einen neuen Corp-Doctrine-Slice ist die aktuelle Evidenz noch zu dünn.
