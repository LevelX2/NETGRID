# Aufgabe 018 - AI-Hints: Corp ICE Longtail / Future-Trace-Damage Closeout

## Kurzfazit

Aufgabe 018 schließt den read-only Batch `batch_7_corp_ice_longtail_future_trace_damage` für Corp ICE ab. Der Batch bleibt konfliktfrei und ohne Runtime-, Planner-, Consumer- oder Engine-Wirkung. `data/ai/ai-card-hints-active.json` bleibt unverändert und weiterhin Runtime-Quelle.

Ergebnis:

- 44 Kandidaten geprüft.
- 24 primäre Corp-ICE-Karten eingeschlossen.
- 20 optionale ICE-Karten begründet zurückgestellt.
- 154 Generated Facts bestätigt oder neu abgeleitet.
- 119 Preview-Adds im read-only Vergleichspfad.
- 248 Differenzen/Kontext-Hinweise normalisiert.
- 0 verbleibende Differenzen.
- 0 Hard Errors.
- 0 echte semantische Konflikte.
- Readiness: `ready_read_only_split_subbatches`.

## Warum Dieser Batch

Nach Runner Info / Central Pressure ist der Corp-ICE-Longtail der größte unmittelbare Spielstärkehebel. Er nutzt die bereits etablierten Guardrails aus Batch 3 und Batch 6:

- Future-run-/Future-encounter-Facts sind mechanische Basic Facts, keine aktuelle Run-Legalität.
- Trace-Payoffs behalten `requires_trace_success`.
- Damage-, Trash-, ETR- und Run-Lock-Facts bleiben Encounter-/Runpath-/Target-/Prevention-Kontext.
- Konkrete Pfadkosten und Safety bleiben bei Board, LegalActions und `effectiveRunQuote`.

## Geprüfte Kandidaten

Eingeschlossen:

- `Asp`
- `Ball and Chain`
- `Banpei`
- `Bolter Cluster`
- `Canis Major`
- `Canis Minor`
- `Cerberus`
- `Cinderella`
- `Cortical Scrub`
- `Data Darts`
- `Data Naga`
- `Data Raven`
- `Fang`
- `Fang 2.0`
- `Fatal Attractor`
- `Fetch 4.0.1`
- `Fragmentation Storm`
- `Homewrecker™`
- `Hunter`
- `Jack Attack`
- `Mastiff`
- `Neural Blade`
- `Pocket Virtual Reality`
- `Shock.r`

Zurückgestellt:

- `Laser Wire`
- `Razor Wire`
- `Nerve Labyrinth`
- `Code Corpse`
- `Liche`
- `Ice Pick Willie`
- `D'Arc Knight`
- `Cortical Scanner`
- `Keeper`
- `Mazer`
- `Quandary`
- `Reinforced Wall`
- `Crystal Wall`
- `Fire Wall`
- `Data Wall`
- `Data Wall 2.0`
- `Wall of Static`
- `Wall of Ice`
- `Filter`
- `Haunting Inquisition`

Die Excludes sind keine Fehler. Sie sind optionale ICE-Kandidaten, die bewusst außerhalb des primären Future/Trace/Damage/ETR-Longtail-Batches bleiben.

## Derived-Facts-Erweiterungen

Der read-only Deriver/Pilot wurde um Batch-7-Karten und stabile ICE-Fact-Klassen erweitert:

- `effect:etr`
- `effect:trace`
- `effect:tag_source`
- `effect:damage`
- `effect:program_trash`
- `effect:hardware_trash`
- `effect:future_run_effect`
- `effect:future_encounter_effect`
- `effect:run_lock`
- `effect:no_jack_out`
- `effect:persistent_counter_effect`
- `effect:trace_credit`
- `condition:requires_encounter`
- `condition:requires_unbroken_subroutine`
- `condition:requires_trace_success`
- `condition:requires_later_encounter`
- `condition:requires_remaining_ice`

Die bestehenden Batch-3-Future-run-ICE-Karten bleiben auf ihrem bisherigen coarse Descriptor-Pfad, damit Aufgabe 013/014 nicht nachträglich semantisch umgedeutet werden.

## Normalisierung

Normalisierte Regeln:

- `ice_trace_tag_normalization`
- `ice_damage_normalization`
- `ice_program_trash_normalization`
- `ice_hardware_trash_normalization`
- `ice_etr_normalization`
- `future_encounter_lock_normalization`
- `run_lock_or_no_jack_out_normalization`
- `persistent_counter_effect_normalization`
- `trace_credit_source_normalization`
- `simple_ice_baseline_normalization`
- `encounter_context_required_classification`
- `trace_success_context_required_classification`
- `runpath_context_required_classification`
- `prevention_context_required_classification`
- `target_selection_context_required_classification`
- `effective_run_quote_priority_annotation`

## Kontextregeln

Trace:

- Trace-Tag-, Trace-Damage- und Trace-Trash-Facts bleiben an `requires_trace_success` gebunden.
- Generated Facts garantieren keine Tags, keinen Trash und keinen Schaden.

Damage:

- Damage-Facts beschreiben nur mechanische Subroutinen.
- Prevention, unpreventable Damage und Flatline bleiben Engine-Kontext.

Program-/Hardware-Trash:

- Generated Facts wählen keine konkreten Ziele.
- Trash-Legalität bleibt Encounter-/Engine-Kontext.

Future-run / Future-encounter:

- Later-ICE- und remaining-ICE-Kontext bleibt sichtbar.
- Diese Facts erzeugen keine aktuelle Self-ETR-Safety.

ETR / Remote-Safety:

- ETR ist eine Subroutine-Klasse.
- Statische Remote-Safety bleibt Board-/Breaker-/RunQuote-abhängig.

Persistent Counter:

- Counter-Effekte beschreiben Kartenmechanik.
- Der Report enthält keinen aktuellen Counter-State.

## Rollup-Status

Batch 7 ist `ready_read_only_split_subbatches`.

Subbatches:

- `trace_tag_ice`
- `damage_ice`
- `tag_damage_punish_ice`
- `program_or_hardware_trash_ice`
- `future_run_or_future_encounter_ice`
- `run_lock_or_jack_out_lock`

Alle 24 eingeschlossenen Karten sind `ready_read_only_with_encounter_trace_runpath_context`.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine modularen Overlays als Runtime-Quelle.
- Keine Engine-, Planner-, Consumer- oder Profiländerung.
- Keine Performanceinterpretation.

## Nächster Batch

Empfohlen für Aufgabe 019: `corp_economy_operation_advance_burst_longtail`.

Begründung: Nach Corp ICE ist Corp-Score-Conversion über Economy-, Operation- und Advance-Burst-Karten der direkteste nächste Spielstärkehebel. Die mechanischen Outputs sind gut als Generated Basic Facts abgrenzbar, während Board-/Historienbedingungen weiter als Kontext markiert bleiben können.
