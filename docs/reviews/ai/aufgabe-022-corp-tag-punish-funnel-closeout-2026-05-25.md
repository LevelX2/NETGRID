# Aufgabe 022 - AI-Hints: Corp Tag/Punish Funnel Closeout

## Kurzfazit

Aufgabe 022 konsolidiert den read-only Batch `batch_11_corp_tag_punish_funnel` als Cross-Batch-Inventar für Tagquellen, sichtbare Tag/Punish-Payoffs, Ambush-/Access-Punish, ICE-Trace-Fenster und Runner-Survival-Gegenkontext. `data/ai/ai-card-hints-active.json` bleibt unverändert und weiterhin einzige Runtime-Quelle.

Ergebnis:

- 38 Funnel-Karten geprüft und eingeschlossen.
- 0 Karten ausgeschlossen.
- 190 Generated Facts bestätigt oder neu abgeleitet.
- 123 Preview-Adds im read-only Vergleichspfad.
- 293 Differenzen/Kontext-Hinweise normalisiert.
- 165 Source/Payoff-Pairings als reine Diagnose-Evidence erzeugt.
- 0 verbleibende Differenzen.
- 0 Follow-ups.
- 0 Hard Errors.
- 0 echte semantische Konflikte.
- Readiness: `ready_read_only_with_terminal_window_context`.
- Funnel-Consumer-Readiness: `ready_for_diagnostic_consumer_review`.

## Warum Dieser Funnel

Tag/Punish ist kein einzelner Kartentyp. Die relevanten mechanischen Facts liegen über Scored-Agenda-Actions, Operations, ICE, Nodes/Assets/Ambushes und Runner-Survival-Karten verteilt. Aufgabe 022 führt diese Facts zusammen, ohne daraus Strategie, Playability oder Legalität abzuleiten.

Der wichtige Kontext bleibt:

- Tagquellen erzeugen nur mögliche Tags in einem konkreten Window.
- Trace-basierte Tags brauchen `requires_trace_success`.
- Runner-turn Tags sind kein garantierter Corp-turn Punish-State.
- Payoffs brauchen sichtbaren Runner-Tag-State oder konkrete Access-/Ambush-/Encounter-Kontexte.
- Source/Payoff-Pairings sind Diagnose-Evidence, keine Action-Empfehlung.

## Cross-Batch-Quellen

Zusammengeführt wurden:

- Batch 1: Scored-Agenda- und Operation-Tag/Punish-Facts.
- Batch 7: Corp ICE mit Trace, Tag, Damage, Trash, Run-lock und persistenten Counter-Effekten.
- Batch 9: Corp Nodes/Assets/Ambushes mit Tagquellen, Payoffs und Access-Punish.
- Batch 10: Runner Survival als Gegenkontext, nicht als Corp-Funnel-Karten.

## Eingeschlossene Karten

Batch 1 / Operations und scored agendas:

- `Netwatch Operations Office`
- `On-Call Solo Team`
- `Strike Force Kali`
- `Audit of Call Records`
- `Chance Observation`
- `Closed Accounts`
- `Scorched Earth`
- `Private Cybernet Police`
- `Punitive Counterstrike`

Batch 7 / Corp ICE:

- `Asp`
- `Cerberus`
- `Cinderella`
- `Data Raven`
- `Fang`
- `Fang 2.0`
- `Fetch 4.0.1`
- `Fragmentation Storm`
- `Homewrecker™`
- `Hunter`
- `Jack Attack`
- `Mastiff`
- `Pocket Virtual Reality`

Batch 9 / Nodes, assets, ambushes:

- `Corporate Detective Agency`
- `Datapool by Zetatech`
- `Netwatch Credit Voucher`
- `Power Grid Overload`
- `Trojan Horse`
- `Urban Renewal`
- `Blood Cat`
- `City Surveillance`
- `Corprunner's Shattered Remains`
- `Experimental AI`
- `Hacker Tracker Central`
- `I Got a Rock`
- `Omniscience Foundation`
- `Schlaghund`
- `Setup!`
- `Solo Squad`

Ausgeschlossen: keine.

## Derived-Facts-Erweiterungen

Neu in den Pilot aufgenommen wurden:

- `Private Cybernet Police`: `scored_agenda_action`, `trace`, `tag_source`, `requires_scored_agenda`, `requires_trace_success`.
- `Punitive Counterstrike`: `damage`, `tag_punish_payoff`, `requires_runner_tagged`.

Bereits abgedeckte Funnel-Karten wurden nicht doppelt in die Pilotliste aufgenommen, sondern im Cross-Batch-Inventar geführt.

## Normalisierung

Normalisierte Regeln:

- `tag_source_window_normalization`
- `trace_tag_condition_normalization`
- `visible_tag_payoff_normalization`
- `agenda_steal_tag_punish_normalization`
- `ambush_tag_punish_normalization`
- `persistent_tag_pressure_normalization`
- `pay_or_take_tag_normalization`
- `tag_punish_funnel_pairing_normalization`
- `terminal_window_context_normalization`
- `runner_survival_countercontext_normalization`
- `legalaction_context_required_classification`
- `board_context_required_classification`

## Funnel-Rollup

Readiness: `ready_read_only_with_terminal_window_context`.

Rollup-Zahlen:

- Tagquellen: 15.
- Punish-Payoffs: 23.
- Trace-Tagquellen: 10.
- Direkte Tagquellen: 5.
- Runner-turn Tagquellen: 2.
- Corp-turn Tagquellen: 8.
- Persistenter Tag-/Counter-Druck: 3.
- Sichtbare Tag-Payoffs: 11.
- Ambush-Punish-Karten: 3.
- Runner-Survival-Gegenkontext: 11 Karten.

Alle 165 Source/Payoff-Pairings sind `tag_source_to_visible_tag_payoff` und enthalten `actionDecisionGenerated: false`.

## Kontextregeln

TagSource / Payoff:

- Trace-basierte Tagquellen behalten `requires_trace_success`.
- Tagged-runner Payoffs behalten `requires_runner_tagged`.
- Payoffs erzeugen keine aktuelle Playability.

Terminal Window:

- Generated Facts beschreiben Kartentiming, nicht den aktuellen Terminal-State.
- Ob ein Runner-turn Tag bis zur Corp-Decision besteht, muss später über Boardstate/Metriken geprüft werden.
- Legal Punish bleibt LegalAction-/Engine-Kontext.

Ambush / Access:

- Ambush- und Access-Punish-Facts behalten Access-Kontext.
- Kein Ambush-Fact wird als garantierter Hit interpretiert.

Runner Survival:

- Runner-Survival-Karten werden als Gegenkontext dokumentiert.
- Sie erzeugen keinen sicheren Runner-State und keine Tag-/Damage-Immunität.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Planner-/Consumer-Anbindung.
- Keine Engine-, LegalAction- oder Strategieänderung.
- Keine Holdout- oder Performanceinterpretation.

## Empfohlener Nächster Schritt

Empfohlen wird Aufgabe 023: `tag_punish_terminal_consumer_diagnostic_slice`.

Begründung: Der Funnel ist jetzt mechanisch breit genug abgedeckt. Der nächste sinnvolle Schritt ist kein weiterer Datenbatch, sondern ein Diagnose-Slice mit First-Class-Metriken:

- Tag während Runner-Turn erzeugt.
- Tag bei Corp-Decision sichtbar.
- Legal Punish-Aktion vorhanden.
- Punish genommen oder übersprungen.
- Runner hat Tag vor Corp-Decision entfernt.
- Payoff in HQ, Board oder Score Area sichtbar.

Ein Strategiefix sollte erst danach erfolgen.
