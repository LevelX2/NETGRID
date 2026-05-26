# AI Compiled Index Warning Classification

Datum: 2026-05-25

## Kurzfazit

Die 80 verbleibenden Warnings im read-only Compiled-Hint-Index sind jetzt fachlich klassifiziert. Es gibt weiterhin 0 Hard Errors, 0 `descriptor_gap_remaining`-Warnings und keine Runtime-, Planner- oder Consumer-Wirkung.

Die Klassifikation bestätigt: Die Warnings sind überwiegend erwartete Architektur-Differenzen zwischen aktivem Monolithen und Generated Basic Facts. Sie sind keine Legalitäts-, Engine- oder Runtimefehler.

## Ausgangslage

- Compiled Pilot Cards: 24
- Karten mit Manual Overlay: 6
- Karten ohne Overlay: 18
- Hard Errors: 0
- Warnings: 80

Roh-Warning-Gruppen:

- `active_monolith_mechanical_duplication`: 46
- `generated_fact_missing_from_active_monolith`: 28
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
- `generated_fact_absent_from_monolith`: 28
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
- `reviewCandidates`: 1

## Karten nach Recommended Action

- `ready_for_generated_mechanical_fields`: 18
- `ready_for_overlay_only_strategy_fields`: 5
- `manual_review_candidate`: 1

`manual_review_candidate`:

- `Self-Modifying Code`: aktiver Monolith enthält weiterhin ein manuelles `install_discount`-Signal, während Generated Facts den normalen Install-Target-Pfad beschreiben. Das ist fachlich getrennt von der Compiler-/Overlay-Infrastruktur und sollte als späterer Hintdaten-Review geprüft werden.

`ready_for_overlay_only_strategy_fields`:

- `Deep Thought`
- `Japanese Water Torture`
- `Mystery Box`
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

Die einzige fachliche Review-Spur ist `Self-Modifying Code`. Sie betrifft den aktiven manuellen Hintinhalt, nicht den Compiler selbst:

- Generated Facts: `search`, `requires_during_run`, `targetProfiles`
- Active Monolith: enthält weiterhin ein Install-Discount-Signal
- Empfehlung: späterer fokussierter Hintdaten-Review, keine Runtime-Anbindung

Es gibt aktuell keine neuen Manual-Overlay-Kandidaten und keine neuen Schema-/Descriptor-Kandidaten.

## Bewusst nicht geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Runtime-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine neuen Decks, Profile oder Holdout-Interpretationen.

## Check-Scope-Hinweis

Nach dem Main-Merge enthielt `data/decks/deck-snapshots-0.8.json` zusätzlich Proteus-Playtest-Snapshots im Formatprofil `netgrid_private_local_proteus_playtest_v1`. Diese Karten sind nicht Teil des aktiven AI-Hint-Monolithen. `check:ai-hint-quality` dokumentiert sie deshalb als `proteus_playtest_not_active_ai_hint_scope`, statt daraus eine Hintmigration abzuleiten.

## Nächster Schritt

Der nächste praktische Schritt ist ein kleiner Review-Slice für `Self-Modifying Code`, der den aktiven manuellen `install_discount`-Hinweis gegen Generated Facts und Kartentext prüft. Danach kann entschieden werden, ob eine minimale Hintdaten-Korrektur nötig ist oder ob der Mismatch als dokumentierter Legacy-Hinweis stehen bleibt.
