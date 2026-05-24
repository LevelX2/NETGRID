# AI Corp Score Failure Diagnosis 2026-05-24

## Kurzfazit

Der aktuelle Candidate bleibt safety-stabil und senkt ActionLimit im Mittel, aber die niedrigeren Corp-Scores sind nicht durch erneute Cheap-Remote-Fehler verursacht. `corpAgendaInstalledInCheaplyContestableRemote` und `corpAdvanceInCheaplyContestableRemote` bleiben in allen acht Slots bei 0.

Die dominante Ursache ist: Die Corp startet viele Scorepfade, aber die Scorefenster entstehen zu selten vor Runner-Steal oder ActionLimit. In den Low-Score-Matches dominieren `agenda_advanced_but_stolen`, `agenda_advanced_but_no_score_window`, Protection-Loops nach Agenda-Install und teils starke Runner-Contest-Kapazität. Snapshot Holdout und Local Pair 1 zeigen echte Warnsignale, aber kein alleiniges Holdout-spezifisches Muster.

Ein klarer Metrikfehler wurde korrigiert: `corpScorePathChosenAfterProtection` und `corpProtectionOpenedScorePath` zählten vorher zu breit, wenn ein geschützter Scorepfad gewählt wurde, aber keine Protection-Aktion im kurzen Vorfenster lag. Außerdem zählt `corpProtectionConvertedToScoreWithin3` jetzt Agenda-Install, Advance und Score als Conversion, nicht nur Advance/Score.

## Benchmark-Konfiguration

- Funktion: `runMatchProgressionBenchmarkSuite`
- Profile: `belief_ai_v1_4_2` vs `current_candidate`
- Slots: Smoke, Snapshot Rig, Snapshot Pressure, Snapshot Holdout, Local Pair 1/2, Real Scene Pair 1/2
- Seeds: sechs Tuning- und drei Holdout-Seeds
- `maxActions`: aktueller Suite-Standard 160
- Real-Scene-Slots bleiben `holdout_only`

## Slotanalyse

| Slot              | Corp Scores | Runner Steals |    ActionLimit | ScoreActions | Missed Score Windows | Befund                                                                    |
| ----------------- | ----------: | ------------: | -------------: | -----------: | -------------------: | ------------------------------------------------------------------------- |
| Smoke             |      7 -> 8 |      18 -> 16 | 0.667 -> 0.667 |       7 -> 8 |               0 -> 0 | Candidate leicht besser bei Corp-Scores, aber weiter ActionLimit-lastig.  |
| Snapshot Rig      |    13 -> 12 |      27 -> 26 | 0.333 -> 0.333 |     13 -> 12 |               0 -> 0 | Leichter Corp-Score-Verlust; mehrere advanced/stolen und no-window Fälle. |
| Snapshot Pressure |    12 -> 11 |      26 -> 26 |     0.556 -> 0 |     12 -> 11 |               0 -> 0 | ActionLimit stark besser, Corp-Scores minimal niedriger.                  |
| Snapshot Holdout  |      3 -> 1 |      27 -> 30 | 0.556 -> 0.556 |       3 -> 1 |               0 -> 0 | Schwächster Slot: weniger ScoreActionsAvailable, mehr Runner-Steals.      |
| Local Pair 1      |      4 -> 2 |      10 -> 10 | 0.333 -> 0.111 |       4 -> 2 |               0 -> 0 | ActionLimit besser, Corp-Scores niedriger; Runner-Contest bleibt hoch.    |
| Local Pair 2      |      8 -> 6 |      22 -> 23 | 0.556 -> 0.556 |       8 -> 6 |               0 -> 0 | Leichter Scoreverlust, kein Missed-Score-Window-Problem.                  |
| Real Scene 1      |      5 -> 6 |      18 -> 20 | 0.444 -> 0.222 |       5 -> 6 |               0 -> 0 | Holdout-only; Candidate verbessert ActionLimit und Corp-Scores.           |
| Real Scene 2      |      6 -> 9 |        8 -> 6 |     1 -> 0.889 |       6 -> 9 |               0 -> 0 | Holdout-only; Candidate verbessert Corp-Scores deutlich.                  |

## Failure-Kategorien

Aggregiert über Candidate-Low-Score-Matches:

| Kategorie                                  | Count | Einordnung                                                                                    |
| ------------------------------------------ | ----: | --------------------------------------------------------------------------------------------- |
| `agenda_advanced_but_stolen`               |    38 | Häufigster realer Verlustpfad: Agenda wird vor Score gestohlen.                               |
| `agenda_advanced_but_no_score_window`      |    34 | Agenda wird begonnen/advanced, aber Scorefenster entsteht nicht rechtzeitig.                  |
| `protection_loop_after_agenda_install`     |    36 | Weitere Schutz-/Remote-Aufbauaktionen nach offenem Scorepfad, oft ohne schnellen Score.       |
| `runner_contest_too_strong`                |    17 | Runner kann Remote sichtbar contesten; Cheap-Remote-Safety blockiert zurecht riskante Linien. |
| `economy_loop_before_score_path`           |    17 | Economy nach oder vor Scorepfad, teilweise mit `insufficient_credits` begründet.              |
| `agenda_in_hq_but_no_safe_remote`          |    16 | Agenda wird gehalten, weil Remote-Safety nicht reicht.                                        |
| `protection_loop_before_agenda_install`    |     5 | Protection vor Agenda-Install wiederholt sich ohne schnelle Install-Konversion.               |
| `no_agenda_seen`                           |     4 | Vor allem seed-/drawabhängige Stalls ohne sichtbare Agenda-Linie.                             |
| `deck_pressure_low_terminal`               |     3 | Beide Seiten erzeugen wenig terminalen Score-/Steal-Druck.                                    |
| `agenda_in_hq_but_hq_pressure_forces_hold` |     2 | HQ-Schutz verdrängt gelegentlich Remote-Scoreplanung.                                         |
| `sample_or_seed_specific`                  |     1 | Restfälle ohne klares generisches Muster.                                                     |

`metric_artifact_possible` wurde häufig markiert, weil die bisherige Protection->Score-Metrik zu breit war. Nach der Korrektur sinken die Werte stark und sind als harte Strategieaussage belastbarer.

## Metrikprüfung

- `scoreActionsAvailable`, `scoreActionsTaken`, `missedScoreWindows`: sauber für legale Score-Actions. Auffällig ist nicht, dass Scorefenster verpasst werden; wenn `score_agenda` legal ist, wird sie genommen.
- `corpProtectionConvertedToScoreWithin3`: war zu streng, weil Agenda-Install nicht als Conversion zählte. Korrigiert.
- `corpProtectionRepeatedWithoutScoreConversion`: war nicht offensichtlich strategisch falsch, aber profitiert von der Conversion-Korrektur und dedupliziert jetzt pro Protection-Decision.
- `corpScorePathChosenAfterProtection` und `corpProtectionOpenedScorePath`: waren zu breit. Korrigiert auf „Scorepfad folgt innerhalb von 3 eigenen strategischen Entscheidungen auf echte Corp-Protection“.
- `corpRemoteSafeButNoScoreActionTaken` und `corpRemoteSafeButAgendaHeld`: bleiben Diagnosewerte. Sie zeigen echte Fenster, sind aber nicht allein Fix-tauglich, weil Gründe wie Credits, keine Agenda oder Runner-Contest-Lage variieren.
- `corpScorePathAvailableButNotTaken`: bleibt niedrig; der aktuelle Verlust entsteht meist vor legalem Scorefenster.

Korrigierte Kernwerte:

| Slot              | ConvertedWithin3 | RepeatedWithoutConversion | ChosenAfterProtection | OpenedScorePath |
| ----------------- | ---------------: | ------------------------: | --------------------: | --------------: |
| Smoke             |           0 -> 0 |                    0 -> 3 |                0 -> 2 |          0 -> 2 |
| Snapshot Rig      |           0 -> 4 |                    0 -> 4 |                4 -> 7 |          4 -> 7 |
| Snapshot Pressure |           0 -> 1 |                    0 -> 4 |                3 -> 3 |          3 -> 3 |
| Snapshot Holdout  |           0 -> 3 |                    0 -> 3 |                1 -> 3 |          1 -> 3 |
| Local Pair 1      |           0 -> 2 |                    0 -> 3 |                3 -> 3 |          3 -> 3 |
| Local Pair 2      |           0 -> 0 |                    0 -> 0 |                0 -> 0 |          0 -> 0 |
| Real Scene 1      |           0 -> 0 |                    0 -> 0 |                1 -> 2 |          1 -> 2 |
| Real Scene 2      |           0 -> 0 |                    0 -> 0 |                0 -> 0 |          0 -> 0 |

## Repro-Traces

### Snapshot Holdout, Candidate, `ai-v143-tuning-001`

- Ergebnis: ActionLimit, Runner 3, Corp 0
- Kategorien: `agenda_advanced_but_no_score_window`, `agenda_advanced_but_stolen`, `economy_loop_before_score_path`, `protection_loop_after_agenda_install`
- Trace:
  - Turn 15: Agenda in `remote_1` installiert, dann advanced; Runner-Contest `low`, aber noch 2 Advances bis Score.
  - Turn 17: Tag/Punish-Operations und Economy statt Score-Konversion.
  - Turn 19: weitere Remote-ICE-Protection, dann Agenda-Install in `remote_1`; Scorefenster wird nicht erreicht.
- Diagnose: Kein Cheap-Remote-Verstoß. Problem ist zu lange Score-Linie und Zwischenaktionen, bevor `score_agenda` legal wird.

### Local Pair 1, Candidate, `ai-v143-tuning-002`

- Ergebnis: Corp gewinnt über Runner-Flatline/anderes Ende, aber Corp scoret 0 Agenda-Punkte; Runner 3
- Kategorien: `agenda_advanced_but_no_score_window`, `agenda_advanced_but_stolen`, `runner_contest_too_strong`
- Trace:
  - Spätes Spiel: viele Economy-/Draw-/HQ-Protect-Aktionen.
  - Turn 13: Remote-Upgrade bei `runner_contest_capacity:high`.
  - Keine belastbare Agenda-Install/Advance/Score-Linie im letzten Fenster.
- Diagnose: Local Pair 1 ist weiterhin eher Runner-Contest-/Path-Druck und Corp-Conversion-Mix, nicht ein einzelner Protection->Score-Bug.

### Snapshot Rig, Candidate, `ai-v143-holdout-002`

- Ergebnis: ActionLimit, Runner 3, Corp 0
- Kategorien: `agenda_in_hq_but_no_safe_remote`, `economy_loop_before_score_path`, `runner_contest_too_strong`
- Trace:
  - Turn 15: Economy trotz `remote_safe_but_agenda_held` und `insufficient_credits`.
  - Turn 15: Agenda wird installiert.
  - Turn 17: R&D-Schutz, dann Advance; Scorefenster entsteht nicht rechtzeitig.
- Diagnose: Generisches Muster: Credits/Reserve und zusätzlicher Central-Schutz verzögern lange Agenda-Linien.

### Real Scene Pair 2, Candidate, `ai-v143-holdout-002`

- Ergebnis: ActionLimit, Runner 3, Corp 0 in diesem Seed; Slot insgesamt Candidate besser
- Kategorien: `no_agenda_seen`, `deck_pressure_low_terminal`
- Trace:
  - Wiederholte Economy und HQ-Protection mit `corp_score_path_skip_reason:no_agenda`.
  - Keine ScoreActionsAvailable.
- Diagnose: Dieser Seed ist eher Draw-/Deckfluss und kein Score-Heuristik-Fixsignal. Der Slot insgesamt verbessert Corp-Scores 6 -> 9.

## Generisch oder seedabhängig?

Generisch:

- `score_agenda` wird nicht verpasst, wenn legal.
- Cheap-Remote-Safety hält stabil.
- Agenda-Linien werden oft begonnen, aber bis zum Scorefenster gestohlen oder durch weitere Setup-/Protection-/Economy-Schritte verzögert.

Seed-/slotabhängig:

- Snapshot Holdout verschlechtert Corp-Scores besonders stark, aber die Kategorien treten auch in Smoke/Snapshot/Local auf.
- Real Scene Pair 2 ist kein Negativsignal für Corp-Scores; einzelne No-Agenda-Stalls bleiben sampleabhängig.

## Empfehlung

Kein neuer Fix in diesem Schritt außer der Metrikkorrektur.

Ein weiterer enger Fix-Slice wäre nur gerechtfertigt, wenn er generisch als `Advance-to-Score Window Compression` formuliert wird:

- Wenn Agenda installiert/advanced und Remote effektiv geschützt ist, keine nicht zwingende Economy/Protection/Central-Aktion einschieben, falls dadurch das Scorefenster verzögert wird.
- Nicht pauschal aggressiver scoren.
- Cheap-Remote-Safety bleibt hart.

Alternativ ist ein Release Review sinnvoll, weil der Candidate bereits safety-stabil ist und ActionLimit im Mittel verbessert, aber Corp-Scores nur gemischt sind.
