# Aufgabe 002: Generated-Fact-Migrationspriorisierung

Datum: 2026-05-25

## Kurzfazit

Aufgabe 002 priorisiert die Generated-Fact-Migrationskandidaten aus dem read-only Compiled-Hint-Index. Nach der Aufgabe-017-Piloterweiterung umfasst der Report 61 Kandidaten. Es wurde nichts migriert: `data/ai/ai-card-hints-active.json` bleibt unverändert, der Compiler bleibt ohne Runtime-/Planner-/Consumer-Wirkung.

Die 190 Compiled-Index-Warnings bleiben Vergleichssignale. Sie sind jetzt als Migrationsreihenfolge interpretierbar, nicht als Fehler.

## Ausgangslage

- Pilotkarten: 61
- Karten mit Manual Overlay: 6
- Karten ohne Overlay: 55
- Hard Errors: 0
- Compiled-Index Warnings: 190
- `migrationCandidates`: 61
- `generatedFactCandidates`: 61
- `overlayCandidates`: 0
- `reviewCandidates`: 8

Warning-Gruppen:

- `monolith_mechanical_duplication_candidate`: 111
- `generated_fact_absent_from_monolith`: 65
- `overlay_strategy_field_not_in_monolith`: 6
- `manual_review_candidate`: 8
- `schema_or_descriptor_candidate`: 0

## Report

Neuer deterministischer Report:

- `docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json`

Neuer Check:

- `corepack pnpm check:ai-generated-fact-migration-priority`

Der Check liest nur:

- `docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json`
- `docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json`
- `data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json`
- `data/ai/ai-card-hints-active.json`
- die beiden Manual-Overlay-Dateien

## Prioritätsklassen

`P0`: 13 Karten

- `Japanese Water Torture`
- `Krash`
- `Corporate Boon`
- `Corporate Coup`
- `Employee Empowerment`
- `Netwatch Operations Office`
- `On-Call Solo Team`
- `Political Overthrow`
- `Strike Force Kali`
- `Audit of Call Records`
- `Chance Observation`
- `Closed Accounts`
- `Scorched Earth`

Begründung: Diese Karten haben eindeutige mechanische Facts mit hoher späterer Wirkung, etwa scored-agenda actions, tag/punish conditions oder Breakerprofile.

`P1`: 44 Karten

- `Mystery Box`
- `Self-Modifying Code`
- `Tutor`
- `Viral 15`
- `Virizz`
- `Crystal Palace Station Grid`
- `Red Herrings`
- `Antiquated Interface Routines`
- `Chicago Branch`
- `Data Masons`
- `Jenny Jett`
- `Namatoki Plaza`
- `Olivia Salazar`
- `Rio de Janeiro City Grid`
- `Tesseract Fort Construction`
- `AI Boon`
- `Bartmoss Memorial Icebreaker`
- `Black Dahlia`
- `Blink`
- `Codecracker`
- `Cyfermaster`
- `Dropp`
- `Loony Goon`
- `Pile Driver`
- `Raffles`
- `Raptor`
- `Reflector`
- `Replicator`
- `Shaka`
- `Tinweasel`
- `Wild Card`
- `Wizard's Book`
- `Worm`
- `Microtech AI Interface`
- `Executive Wiretaps`
- `Edited Shipping Manifests`
- `Custodial Position`
- `Expert Schedule Analyzer`
- `Boardwalk`
- `Shredder Uplink Protocol`
- `I Spy`
- `Mouse`
- `SeeYa`
- `Smarteye`

Begründung: Die Facts sind mechanisch nützlich, brauchen aber saubere Board-/LegalAction-Kontextgrenzen oder stabilere Descriptor-Behandlung.

`P2`: 4 Karten

- `Deep Thought`
- `Poltergeist`
- `R&D-Protocol Files`
- `Scatter Shot`

Begründung: Mechanisch korrekt, aber aktuell eher Diagnose-/Longtail-Wert oder strategisch flankiert.

`P3`: 0 Karten

Begründung: Es gibt keine Karte im 61er-Pilot, die ausschließlich strategisch/quality-getrieben und nicht Generated-Fact-Kandidat ist.

## Field-Kategorien

- `safe_generated_now`: 54
- `generated_with_board_context`: 56
- `generated_with_descriptor_limitations`: 18
- `overlay_only`: 6
- `legacy_keep_for_compat`: 61

Interpretation:

- `effects`, `conditions`, `breakerProfile`, `remoteRole` und `targetProfiles` sind langfristige Generated-Kandidaten.
- `lineSupport`, `quality`, `manualNotes`, `strategicNotes`, `confidence` und `needsHumanReview` bleiben Overlay-/Manual-Felder.
- `roles`, `planRoles` und `aiSupportStatus` bleiben vorerst Kompatibilitätsfelder im Monolithen.

## Risiko

- `low`: 29
- `medium`: 32
- `high`: 0

Kein Kandidat ist als `high` klassifiziert, weil es keine Hard Errors, keine Review-Kandidaten und keine offenen Schema-/Descriptor-Kandidaten im Compiled-Index gibt. Medium heißt hier: spätere Migration darf den Board-/LegalAction-Kontext nicht statisch interpretieren.

## Migrationsreihenfolge

Batch 1: Scored-agenda und Tag/Trace/Punish

- `Corporate Boon`
- `Corporate Coup`
- `Employee Empowerment`
- `Netwatch Operations Office`
- `On-Call Solo Team`
- `Political Overthrow`
- `Strike Force Kali`
- `Audit of Call Records`
- `Chance Observation`
- `Closed Accounts`
- `Scorched Earth`

Batch 2: BreakerProfile, TargetProfiles und Dedicated Credits

- `Japanese Water Torture`
- `Krash`
- `Mystery Box`
- `Poltergeist`
- `Scatter Shot`
- `Self-Modifying Code`

Batch 3: RemoteRole `run_tax` / `agenda_steal_tax`

- `Crystal Palace Station Grid`
- `Red Herrings`

Batch 4: Future-run/Future-encounter ICE

- `Tutor`
- `Viral 15`
- `Virizz`

Batch 5: Restliche Longtail-Facts

- `Antiquated Interface Routines`
- `Chicago Branch`
- `Data Masons`
- `Jenny Jett`
- `Namatoki Plaza`
- `Olivia Salazar`
- `Rio de Janeiro City Grid`
- `Tesseract Fort Construction`
- `AI Boon`
- `Bartmoss Memorial Icebreaker`
- `Black Dahlia`
- `Blink`
- `Codecracker`
- `Cyfermaster`
- `Dropp`
- `Loony Goon`
- `Pile Driver`
- `Raffles`
- `Raptor`
- `Reflector`
- `Replicator`
- `Shaka`
- `Tinweasel`
- `Wild Card`
- `Wizard's Book`
- `Worm`

Batch 6: Runner Info, Central Pressure und Access Replacement

- `Deep Thought`
- `R&D-Protocol Files`
- `Boardwalk`
- `Custodial Position`
- `Edited Shipping Manifests`
- `Executive Wiretaps`
- `Expert Schedule Analyzer`
- `I Spy`
- `Microtech AI Interface`
- `Mouse`
- `SeeYa`
- `Shredder Uplink Protocol`
- `Smarteye`

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compilers.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Engine-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine neuen Decks, Profile oder Holdout-Interpretationen.

## Empfehlung

Der nächste praktische Schritt ist kein Runtime-Compiler. Nach den Batch-1-bis-6-Closeouts ist ein größerer read-only Corp-ICE-Longtail-Block sinnvoll, der Trace-, Damage-, ETR- und Future-run-Facts nur als mechanische Generated Facts bewertet.
