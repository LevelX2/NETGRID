# AI Compiled Index Warning Classification

Datum: 2026-05-25

## Kurzfazit

Die nach dem Self-Modifying-Code-Review verbleibenden 79 Warnings im read-only Compiled-Hint-Index sind fachlich klassifiziert. Es gibt weiterhin 0 Hard Errors, 0 `descriptor_gap_remaining`-Warnings und keine Runtime-, Planner- oder Consumer-Wirkung.

Die Klassifikation bestätigt: Die Warnings sind überwiegend erwartete Architektur-Differenzen zwischen aktivem Monolithen und Generated Basic Facts. Sie sind keine Legalitäts-, Engine- oder Runtimefehler.

## Ausgangslage

- Compiled Pilot Cards: 24
- Karten mit Manual Overlay: 6
- Karten ohne Overlay: 18
- Hard Errors: 0
- Warnings: 79

Roh-Warning-Gruppen:

- `active_monolith_mechanical_duplication`: 46
- `generated_fact_missing_from_active_monolith`: 27
- `manual_overlay_strategy_field_missing_from_active`: 6

## Neue Warning-Klassen

- `monolith_mechanical_duplication_candidate`: Der aktive Monolith enthält ein mechanisches Feld, das langfristig generated sein sollte.
- `generated_fact_absent_from_monolith`: Ein mechanischer Generated Fact fehlt im Monolithen oder weicht dort ab.
- `overlay_strategy_field_not_in_monolith`: Strategische Overlay-Felder existieren bewusst nur im modularen Overlay.
- `manual_review_candidate`: Semantischer Review-Kandidat, wenn Generated/Manual/Monolith mehr als strukturell auseinanderlaufen.
- `schema_or_descriptor_candidate`: reserviert für neue echte Descriptor-/Schema-Lücken.
- `info_no_overlay_needed`: Info, kein Warning, wenn eine Karte ohne Overlay keinen Overlaybedarf hat.

## Ergebnis

Warning-Klassifikation:

- `monolith_mechanical_duplication_candidate`: 46
- `generated_fact_absent_from_monolith`: 27
- `overlay_strategy_field_not_in_monolith`: 6
- `manual_review_candidate`: 0 Warnings
- `schema_or_descriptor_candidate`: 0 Warnings

Info:

- `info_no_overlay_needed`: 18
- `info_overlay_present`: 6

Kandidatenlisten:

- `migrationCandidates`: 24
- `generatedFactCandidates`: 24
- `overlayCandidates`: 0
- `reviewCandidates`: 0

## Karten nach Recommended Action

- `ready_for_generated_mechanical_fields`: 18
- `ready_for_overlay_only_strategy_fields`: 6
- `manual_review_candidate`: 0

`ready_for_overlay_only_strategy_fields`:

- `Deep Thought`
- `Japanese Water Torture`
- `Mystery Box`
- `Self-Modifying Code`
- `Crystal Palace Station Grid`
- `Red Herrings`

Diese Karten haben Overlay-Felder wie `manualNotes` oder `strategicNotes`, die bewusst nicht im aktiven Monolithen stehen.

`ready_for_generated_mechanical_fields`:

- alle 18 Karten ohne Overlay sowie `Tutor` als reine mechanische Monolith-Duplikationssicht.

## Erwartete Architektur-Differenzen

Erwartet und nicht blockierend:

- Mechanische Felder im Monolithen (`effects`, `conditions`, `breakerProfile`, `remoteRole`) sind noch aktiv, sollten langfristig aber generated werden.
- Generated Facts wie `targetProfiles` existieren im Vergleichsindex, aber nicht im aktiven Monolithen.
- Overlay-only-Felder wie `manualNotes` und `strategicNotes` sind absichtlich nicht Teil der aktiven Runtime-Datei.
- Karten ohne Overlay und ohne Overlaybedarf werden als `info_no_overlay_needed` geführt und erhöhen die Warning-Zahl nicht.

## Echte Folgearbeit

Der frühere Review-Kandidat `Self-Modifying Code` ist geschlossen:

- Generated Facts: `search`, `requires_during_run`, `targetProfiles.installCost = "normal"`
- Active Monolith: enthält kein `install_discount`-Signal mehr
- Ergebnis: kein Human-Review-Kandidat im Compiled-Index

Es gibt aktuell keine neuen Manual-Overlay-Kandidaten und keine neuen Schema-/Descriptor-Kandidaten.

## Bewusst nicht geändert

- `data/ai/ai-card-hints-active.json` wurde nur für `Self-Modifying Code` korrigiert: der falsche `install_discount`-Effect wurde entfernt.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Runtime-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine neuen Decks, Profile oder Holdout-Interpretationen.

## Check-Scope-Hinweis

Nach dem Main-Merge enthielt `data/decks/deck-snapshots-0.8.json` zusätzlich Proteus-Playtest-Snapshots im Formatprofil `netgrid_private_local_proteus_playtest_v1`. Diese Karten sind nicht Teil des aktiven AI-Hint-Monolithen. `check:ai-hint-quality` dokumentiert sie deshalb als `proteus_playtest_not_active_ai_hint_scope`, statt daraus eine Hintmigration abzuleiten.

## Nächster Schritt

Der nächste praktische Schritt ist kein weiterer SMC-Slice, sondern die Priorisierung der mechanischen Monolith-Felder, die langfristig aus Generated Facts kommen sollten.
