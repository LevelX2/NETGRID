# Aufgabe 017: Runner Info / Central Pressure / Access-Replacement Closeout

Datum: 2026-05-25

## Kurzfazit

Aufgabe 017 erweitert den read-only Generated-Facts-Pilot auf Runner-Info, Central Pressure und Access-Replacement. Der Closeout bleibt ein Vergleichsartefakt: `data/ai/ai-card-hints-active.json` bleibt unverändert und weiterhin Runtime-Quelle; es gibt keine Engine-, Runtime-, Planner- oder Consumer-Wirkung.

Ergebnis:

- Kandidaten geprüft: 17
- Eingeschlossen: 13
- Ausgeschlossen: 4, jeweils begründet
- Bestätigte Generated Facts: 27
- Preview-Adds: 12
- Normalisierte Differenzen: 29
- Verbleibende Differenzen: 0
- Hard Errors / echte semantische Konflikte: 0 / 0
- Descriptor-Follow-ups: 0
- Readiness: `ready_read_only_split_subbatches`

## Warum Dieser Batch

Nach Breaker-, RemoteRole- und Corp-Remote-Closeouts ist Runner-Info / Central Pressure / Access-Replacement der nächste stabile größere Pilotbatch. Die Mechanik ist aus CardImplementations gut abgrenzbar: Topdeck-Info, Access-Replacement, Multiaccess, HQ-Info und Expose-Facts lassen sich mechanisch ableiten. Strategische Run-Priorität bleibt getrennt und wird nicht als Generated Fact ausgegeben.

## Geprüfte Kandidaten

Primäre Kandidaten:

- `R&D-Protocol Files`
- `Deep Thought`
- `Microtech AI Interface`
- `Executive Wiretaps`
- `Edited Shipping Manifests`
- `Custodial Position`

Zusätzliche Kandidaten:

- `Expert Schedule Analyzer`
- `Boardwalk`
- `Cockroach`
- `Shredder Uplink Protocol`
- `False Echo`
- `I Spy`
- `Mouse`
- `SeeYa`
- `Smarteye`
- `Speed Trap`
- `Startup Immolator`

Alle 17 Kandidaten wurden gegen aktiven Hint, Runtime-Katalog, CardImplementation, AI-Support-Status und fachliche Batch-Passung geprüft.

## Eingeschlossene Karten

Eingeschlossen wurden 13 Karten:

- `Boardwalk`
- `Custodial Position`
- `Deep Thought`
- `Edited Shipping Manifests`
- `Executive Wiretaps`
- `Expert Schedule Analyzer`
- `I Spy`
- `Microtech AI Interface`
- `Mouse`
- `R&D-Protocol Files`
- `SeeYa`
- `Shredder Uplink Protocol`
- `Smarteye`

Subbatches:

- `rd_topdeck_info`: 3
- `hq_info`: 2
- `central_access_replacement`: 2
- `central_multiaccess_or_interface`: 2
- `expose_or_remote_info`: 4

## Ausgeschlossene Karten

Ausgeschlossen wurden vier Karten:

- `Cockroach`: HQ-zentriert, aber mechanisch eher random HQ discard pressure als Runner-Info oder Access-Replacement.
- `False Echo`: force-rez disruption nach erfolgreichem Run, besser in einem Runpath-/Install-Rez-Disruption-Batch.
- `Speed Trap`: Runner-Survival-/Jack-out-Prevention, besser im Prevention-/Damage-/Survival-Batch.
- `Startup Immolator`: ICE-Trash nach vollständigem Brechen; besser im Corp-ICE-Disruption-Batch, weil der Monolith aktuell eine program_trash-nahe Legacy-Form enthält.

Das sind begründete Scope-Excludes, keine Hard Errors.

## Derived-Facts-Erweiterungen

Der read-only Pilot wurde auf 61 Karten erweitert. Für Batch 6 werden mechanisch abgeleitet:

- `effect:topdeck_info`
- `effect:zone_shuffle`
- `effect:access_replacement`
- `effect:multiaccess`
- `effect:hq_info`
- `effect:expose_info`
- `effect:economy`, soweit mechanisch Teil der Karte
- `effect:tag`, soweit mechanisch Teil der Karte
- `condition:requires_successful_run`
- `condition:requires_accessed_card`
- `condition:requires_during_run`

Die Ontology-Known-Lists wurden read-only um `hq_info`, `expose_info` und `ice_trash` erweitert und im AI-Testpfad abgesichert.

## Dry-Run, Diff Und Normalisierung

Der kombinierte Closeout-Check ist:

```bash
corepack pnpm check:ai-generated-fact-batch6-runner-info-closeout
```

Er liest Active Monolith, Derived-Facts-Report, Compiled-Index-Pilot und Migration-Priority-Report und erzeugt den deterministischen Report:

```text
docs/reviews/ai/aufgabe-017-runner-info-central-pressure-closeout-report-2026-05-25.json
```

Normalisierte Regeln:

- `rd_topdeck_info_normalization`: 2
- `hq_info_normalization`: 4
- `central_access_replacement_normalization`: 8
- `central_multiaccess_or_interface_normalization`: 6
- `successful_run_context_normalization`: 7
- `access_context_normalization`: 7
- `expose_or_remote_info_context_normalization`: 6
- `zone_shuffle_or_topdeck_manipulation_normalization`: 3
- `central_pressure_overlay_split_normalization`: 9
- `hidden_zone_context_classification`: 9

Keine aktive Hintdatei wird geändert. Die Normalisierung wirkt nur im Comparator-/Dry-Run-Pfad.

## Rollup-Status

Batch 6 ist read-only future-migration-ready, aber logisch in Subbatches gegliedert:

- R&D-Topdeck-Info: ready
- HQ-Info: ready mit Access-/Successful-run-Kontext
- Central Access-Replacement: ready mit Successful-run-Kontext
- Central Multiaccess / Interface: ready mit Successful-run-Kontext
- Expose / Remote-Info: ready mit Access-/Run-Kontext

Alle 13 eingeschlossenen Karten haben:

- aktiven Hint
- Runtime-Katalogkarte
- CardImplementation
- AI-Support-Status `ai_supported`
- Derived Facts
- 0 verbleibende Issues
- Readiness `ready_read_only_with_access_context`

## Kontextregeln

Generated Facts beschreiben statische Kartenfunktion. Sie erzeugen keine aktuelle Access-, Run- oder Hidden-Zone-Wahrheit.

Wichtige Grenzen:

- Successful-run-Conditions bleiben Engine-/LegalAction-Kontext.
- Accessed-card-Conditions bleiben Access-Kontext und erzeugen keinen Zugriff.
- R&D-/HQ-Info enthält keine konkreten versteckten Kartenidentitäten.
- R&D-Topdeck-Manipulation erzeugt keine statische Wahrheit über die aktuelle R&D-Reihenfolge.
- Access-Replacement ist nicht normaler Access und keine Auto-Steal-/Auto-Trash-Erwartung.
- Multiaccess ist mechanische Access-Anzahl, keine strategische Run-Priorität.
- Central Pressure bleibt Overlay-/Consumer-/Planlogik und wird nicht als mechanischer Generated Fact ausgegeben.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Engine-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Profil-, Deck- oder Holdout-Änderung.

## Nächster Batch

Empfohlen wird Aufgabe 018:

```text
corp_ice_longtail_future_trace_damage
```

Kandidaten:

- `Ball and Chain`
- `Canis Major`
- `Canis Minor`
- `Bolter Cluster`
- `Neural Blade`
- `Hunter`
- `Data Raven`
- `Fetch 4.0.1`
- `Cinderella`
- `Cerberus`
- `Banpei`
- `Data Naga`
- `Jack Attack`
- `Fatal Attractor`
- `Data Darts`
- `Mastiff`

Begründung: Nach Breaker-, Tag/Punish-, RemoteRole-, Runpath- und Central-Info-Kontextarbeit ist der Corp-ICE-Longtail der nächste große spielstärkerelevante Block. Trace, Damage, ETR und Future-run-Facts brauchen stärkeren Kontext, aber die bisherigen Guardrails sind dafür vorbereitet.
