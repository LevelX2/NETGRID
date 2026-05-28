# Aufgabe 035 - AI: Corp Economy-before-score Suspicious Trace Sampling

## Kurzfazit

Aufgabe 035 sichtet die 15 repeated-suspicious- und 16 no-conversion-suspicious-Fälle aus Aufgabe 034 anhand konkreter, side-safe `actionSequence`-Evidence. Es wurde kein Code-Fix und keine Strategieänderung umgesetzt.

Ergebnis: Die 31 suspicious Event-Fälle sind keine echten Corp-Economy-before-score-Schleifen. Alle 31 Fälle clustern als `metric_artifact`: Die Diagnosefamilie zählt sie als Economy-before-score, die konkrete gewählte Action ist aber `install_card`, `advance_card`, `score_agenda` oder eine Tag/Punish-Operation. Es gibt in diesem Sample keinen Basic-Credit-, Recover-Economy- oder echte repeated-Economy-Loop-Fall.

Fix-Gate-Entscheidung: kein Economy-before-score-Fix. Sinnvoller ist eine Metrikschärfung in einem späteren Diagnose-Slice oder die Rückkehr zu Runner Setup/Search/Recovery/Memory.

## Bezug zu Aufgabe 034

Aufgabe 034 hatte folgende Candidate-Warnung gemessen:

- `corpEconomyBeforeScoreRepeatedEconomyWithin3 = 44`, davon 15 suspicious.
- `corpEconomyBeforeScoreNotConvertedWithin3CorpActions = 71`, davon 16 suspicious.
- Snapshot Holdout, Local Pair 2 und Real Scene 1 waren die wichtigsten Slot-Foki.

Aufgabe 034 hatte bewusst keinen Planner-Fix umgesetzt, weil die Aggregate noch keine saubere Fix-Klasse zeigten. Aufgabe 035 prüft nun die konkreten suspicious Trace-Fälle.

## Methodik

Temporärer Harness:

- `runMatchProgressionBenchmarkSuite`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- `includeHoldout: true`
- `maxActions: 160`
- 8 runnable Slots
- Fokus auf Candidate-`actionSequence`

Der Harness extrahierte nur side-safe Felder:

- Slot, Seed, Match-Index, Action-Nummer, Turn.
- Suspicious-Kind: `repeated_economy_before_score` oder `no_conversion_within_3`.
- Score-/Advance-/AgendaInstall-ready-remote-Flags.
- Ready-Remote- und Runner-Contest-Flags.
- konkrete Action-Familie und Action-Type.
- ReasonCode.
- nächste 3 Corp-Aktionen als Action-Familie plus ReasonCode.
- Followup-Klasse.
- Root-Cause-Klasse.

Nicht enthalten:

- keine Hidden Cards
- keine Runner-Hand-/Stack-/R&D-/HQ-Inhalte
- keine privaten Payloads
- keine CardInstances
- kein FullGameState

Der temporäre Harness wurde nach der Auswertung gelöscht. Der deterministische JSON-Report liegt in `docs/reviews/ai/aufgabe-035-corp-economy-before-score-trace-sampling-report-2026-05-25.json`.

## Root-Cause-Taxonomie

| Klasse                             | Bedeutung                                                           |
| ---------------------------------- | ------------------------------------------------------------------- |
| `true_repeated_economy_loop`       | echte wiederholte Economy trotz legalem Score-/Advance-/Agenda-Exit |
| `blocked_no_agenda_exit`           | Scorepfad war faktisch nicht vorhanden                              |
| `blocked_remote_not_safe`          | Remote-/Contest-Kontext erklärt den Skip                            |
| `blocked_central_or_safety`        | HQ/R&D/Safety plausibel höher                                       |
| `blocked_credits_or_reserve`       | Credits oder Reserve fehlen weiter                                  |
| `plan_drift_no_clear_terminal`     | Folgeaktionen driften ohne klaren terminalen Scorepfad              |
| `metric_artifact`                  | suspicious entsteht aus zu grober Diagnosefamilie                   |
| `unclassified_needs_more_evidence` | Evidence reicht nicht                                               |

## Globale Verteilung

| Root Cause           | Fälle |
| -------------------- | ----: |
| `metric_artifact`    |    31 |
| alle anderen Klassen |     0 |

Weitere globale Schnitte:

| Schnitt                         | Fälle |
| ------------------------------- | ----: |
| suspicious Event-Fälle gesamt   |    31 |
| eindeutige Action-Fenster       |    20 |
| `repeated_economy_before_score` |    15 |
| `no_conversion_within_3`        |    16 |
| Followup `no_progress`          |    21 |
| Followup `runner_steal`         |     6 |
| Followup `score`                |     4 |

Konkrete gewählte Actions:

| Action / ReasonCode                              | Fälle | Bewertung                                                                            |
| ------------------------------------------------ | ----: | ------------------------------------------------------------------------------------ |
| `install_card` / `corp.plan.score_next_turn`     |    21 | Scorepfad-/Agenda-Install-Kontext, kein echter Economy-Loop                          |
| `advance_card` / `corp.plan.score_next_turn`     |     4 | Advance-/Scorepfad-Kontext, kein echter Economy-Loop                                 |
| `score_agenda` / `corp.plan.score_now`           |     2 | terminale Score-Aktion, klarer Diagnoseartefakt                                      |
| `play_operation` / `corp.tag.punish_visible_tag` |     4 | Tag/Punish-Operation verdrängt Agenda-Exit, aber keine Economy-before-score-Schleife |

Die Economy-before-score-Suspicious-Klasse ist damit zu breit: Sie hängt an Scorepfad-/Plan-Evidence oder Action-Familienheuristik, nicht an tatsächlich wiederholter Korp-Economy.

## Snapshot Holdout

Snapshot Holdout enthält 4 suspicious Event-Fälle, alle `metric_artifact`.

Alle vier Fälle stammen aus demselben Matchfenster:

- `seed = ai-v143-tuning-004`
- `reasonCode = corp.tag.punish_visible_tag`
- konkrete Action: `play_operation`
- terminal sichtbarer Kontext: Agenda-Install in ready remote legal
- nächste Corp-Aktionen: weitere Tag/Punish-Operation, End Turn oder Mandatory Draw

Befund: Snapshot Holdout bleibt ein schwacher Slot, aber diese Economy-before-score-Suspicious-Fälle erklären ihn nicht als Economy-Loop. Das Muster ist eher Operation-vs-Agenda-Exit beziehungsweise Tag/Punish-vs-Scorepfad, nicht Basic-/Recover-Economy.

## Local Pair 2

Local Pair 2 enthält 9 suspicious Event-Fälle, alle `metric_artifact`.

Verteilung:

- mehrere `install_card / corp.plan.score_next_turn`-Fenster
- `advance_card / corp.plan.score_next_turn`
- `score_agenda / corp.plan.score_now`
- 2 Fälle mit Runner-Steal-Followup

Befund: Das ActionLimit-Warnsignal aus Local Pair 2 hängt nicht sauber an Corp-Economy-before-score. Die gesichteten Fälle sind Scorepfad-Aktionen, die wegen der Diagnosefamilie als Economy gezählt werden. Für Local Pair 2 bleibt Runner Setup/Search/Memory/NoProgress der plausiblere nächste Hebel.

## Real Scene 1

Real Scene 1 enthält 9 suspicious Event-Fälle, alle `metric_artifact`.

Verteilung:

- `install_card / corp.plan.score_next_turn`
- `advance_card / corp.plan.score_next_turn`
- 2 Fälle mit Runner-Steal-Followup
- mehrere No-Progress-Followups

Befund: Real Scene 1 hatte in Aufgabe 034 hohe Economy-before-score-Zahlen, ist aber im 8-Slot-Ergebnis leicht positiv. Die Trace-Sichtung zeigt keine echte Economy-Schleife, sondern Scorepfad-Aktionen, die in der Suspicious-Metrik falsch als Economy-before-score erscheinen.

## Beispiel-Evidence

Side-safe Beispiel 1, Snapshot Holdout:

```json
{
  "slotId": "snapshot_holdout_origin_pressure_vs_tag_ops",
  "seed": "ai-v143-tuning-004",
  "actionNumber": 66,
  "suspiciousKind": "repeated_economy_before_score",
  "chosenActionFamily": "play_operation",
  "diagnosticActionFamily": "economy",
  "reasonCode": "corp.tag.punish_visible_tag",
  "nextCorpActions": [
    "play_operation:corp.tag.punish_visible_tag",
    "play_operation:corp.tag.source_visible_payoff",
    "end_turn:corp.end_turn"
  ],
  "rootCauseCandidate": "metric_artifact"
}
```

Side-safe Beispiel 2, Local Pair 2:

```json
{
  "slotId": "local_realistic_pair_2",
  "seed": "ai-v143-holdout-003",
  "actionNumber": 146,
  "suspiciousKind": "repeated_economy_before_score",
  "chosenActionFamily": "advance",
  "diagnosticActionFamily": "economy",
  "reasonCode": "corp.plan.score_next_turn",
  "nextCorpActions": [
    "score:corp.plan.score_now",
    "end_turn:corp.end_turn",
    "resolve_choice:corp.choice.resolve"
  ],
  "followup": "score",
  "rootCauseCandidate": "metric_artifact"
}
```

Side-safe Beispiel 3, Real Scene 1:

```json
{
  "slotId": "real_scene_pair_1",
  "seed": "ai-v143-tuning-003",
  "actionNumber": 5,
  "suspiciousKind": "no_conversion_within_3",
  "chosenActionFamily": "install_asset",
  "diagnosticActionFamily": "economy",
  "reasonCode": "corp.plan.score_next_turn",
  "nextCorpActions": [
    "install_asset:corp.plan.score_next_turn",
    "end_turn:corp.end_turn",
    "rez_ice:corp.rez.defensive_card"
  ],
  "followup": "runner_steal",
  "rootCauseCandidate": "metric_artifact"
}
```

## Fix-Gate-Entscheidung

Entscheidung: Kein Economy-before-score-Fix.

Begründung:

- 31/31 suspicious Event-Fälle sind `metric_artifact`.
- 0/31 Fälle sind echte `true_repeated_economy_loop`.
- Es gibt keine Basic-Credit-/Recover-Economy-Schleife im Sample.
- Mehrere Fälle sind bereits Scorepfad-Aktionen (`install_card`, `advance_card`, `score_agenda`) und sollten nicht als Economy-before-score-Skip zählen.
- Tag/Punish-Operationen sind ein anderes Attributionsthema, kein Economy-before-score-FixGate.

Die richtige Folge wäre keine Planner-Score-Änderung, sondern bei Bedarf eine spätere Metrikschärfung: Economy-before-score-Suspicious sollte konkrete Action-Familien wie Score/Advance/Agenda-Install und Tag/Punish-Operationen nicht als repeated Economy behandeln.

## Bewusst Nicht Geändert

- keine Codeänderung
- keine Engine-Regeländerung
- keine neue Legalität
- keine LegalAction-Änderung
- keine Strategie-/Planner-Score-Änderung
- keine PlanWeight-Änderung
- keine Profilumschaltung
- keine neuen Decks
- keine Holdout-Optimierung
- keine Änderung an `aiSupportStatus`
- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Runtime-Nutzung des Compiled Index
- keine Runtime-Nutzung modularer Overlays
- keine aktive Hintmigration

## Nächster praktischer Schritt

Nicht weiter an Corp-Economy-before-score drehen. Wenn dieser Bereich erneut angefasst wird, zuerst die Metrikartefakte aus der Suspicious-Zählung entfernen, ohne Planner-Wirkung. Der stärkere technische Hebel bleibt Runner Setup/Search/Recovery/Memory Attribution, weil Aufgabe 027/028 dort echte FixGate-Signale gezeigt hatten.
