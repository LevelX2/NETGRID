# Aufgabe 016: Breaker-/Icebreaker-Longtail Closeout

Datum: 2026-05-25

## Kurzfazit

Aufgabe 016 erweitert den read-only Generated-Facts-Pilot auf den Breaker-/Icebreaker-Longtail. Der Closeout ist ein reines Vergleichsartefakt: `data/ai/ai-card-hints-active.json` bleibt unverändert und weiterhin Runtime-Quelle; es gibt keine Engine-, Runtime-, Planner- oder Consumer-Wirkung.

Ergebnis:

- Kandidaten geprüft: 26
- Eingeschlossen: 18
- Ausgeschlossen: 8 optionale Breaker, jeweils begründet
- Bestätigte Generated Facts: 61
- Preview-Adds: 0
- Normalisierte Differenzen: 17
- Verbleibende Differenzen: 0
- Hard Errors / echte semantische Konflikte: 0 / 0
- Descriptor-Follow-ups: 0
- Readiness: `ready_read_only_split_subbatches`

## Warum Dieser Batch

Nach den Remote-/Future-run- und Corp-Remote-Closeouts ist der Breaker-Longtail der stabilste größere Folgebatch. Die mechanischen Facts liegen in den CardImplementations eng genug vor: Coverage, Breakerprofil und SideEffects lassen sich aus `icebreakerAbilities` ableiten. Die Legalität bleibt trotzdem ausschließlich bei Encounter, Engine, LegalActions und `effectiveRunQuote`.

## Geprüfte Kandidaten

Primäre Kandidaten:

- `Worm`
- `Pile Driver`
- `Codecracker`
- `Cyfermaster`
- `Raffles`
- `Raptor`
- `Shaka`
- `Black Dahlia`
- `Loony Goon`
- `Blink`
- `Dropp`
- `Replicator`
- `Reflector`
- `AI Boon`
- `Bartmoss Memorial Icebreaker`
- `Tinweasel`
- `Wizard's Book`
- `Wild Card`

Optionale Kandidaten:

- `Dwarf`
- `Grubb`
- `Flak`
- `Dogcatcher`
- `Hammer`
- `Jackhammer`
- `Ramming Piston`
- `Snowball`

Alle 26 Kandidaten wurden gegen aktiven Hint, Runtime-Katalog, CardImplementation, AI-Support-Status und fachliche Batch-Passung geprüft.

## Eingeschlossene Karten

Eingeschlossen wurden 18 primäre Longtail-Breaker:

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

Subbatches:

- `standard_breakers`: 11
- `random_breakers`: 3
- `side_effect_breakers`: 1
- `special_subtype_breakers`: 2
- `noisy_breakers`: 1

## Ausgeschlossene Karten

Ausgeschlossen wurden acht optionale Breaker:

- `Dogcatcher`
- `Dwarf`
- `Flak`
- `Grubb`
- `Hammer`
- `Jackhammer`
- `Ramming Piston`
- `Snowball`

Grund: Diese Karten sind bewusst für eine spätere optionale Breaker-Erweiterung zurückgestellt. Ihre Implementations- und AI-Support-Existenz ist geprüft, aber Aufgabe 016 bleibt auf die 18 primären Longtail-Breaker begrenzt. Das ist kein Hard Error.

## Derived-Facts-Erweiterungen

Der read-only Pilot wurde auf 50 Karten erweitert. Für den Breaker-Longtail werden mechanisch abgeleitet:

- `effect:breaker`
- `breakerProfile`
- `breakerCoverage:*`
- `breakerSideEffect:*`, soweit mechanisch aus Implementation ableitbar

Neue Coverage-Formen im Longtail:

- `wall`
- `sentry`
- `code_gate`
- `ap`
- `trace`
- `universal`

Neue oder bestätigte SideEffects:

- `stealth_loss`
- `random_failure`
- `program_trash_risk`
- `once_per_subroutine`
- `ends_run_after_use`

## Dry-Run, Diff Und Normalisierung

Der kombinierte Closeout-Check ist:

```bash
corepack pnpm check:ai-generated-fact-batch5-breaker-closeout
```

Er liest Active Monolith, Derived-Facts-Report, Compiled-Index-Pilot und Migration-Priority-Report und erzeugt den deterministischen Report:

```text
docs/reviews/ai/aufgabe-016-breaker-icebreaker-longtail-closeout-report-2026-05-25.json
```

Normalisierte Regeln:

- `breaker_coverage_normalization`: 11
- `noisy_stealth_loss_normalization`: 2
- `random_breaker_context_normalization`: 5
- `run_ends_after_use_normalization`: 2
- `special_subtype_breaker_normalization`: 4
- `board_context_required_classification`: 18
- `effective_run_quote_priority_annotation`: 18

Keine aktive Hintdatei wird geändert. Die Normalisierung wirkt nur im Comparator-/Dry-Run-Pfad.

## Rollup-Status

Batch 5 ist read-only future-migration-ready, aber logisch in Subbatches gegliedert:

- Standard-Breaker: ready
- Random-Breaker: ready mit RNG-/SideEffect-Kontext
- Noisy-Breaker: ready mit Payment-/Stealth-Loss-Kontext
- Special-Subtype-Breaker: ready mit spezifischer Coverage, nicht universal
- SideEffect-Breaker: ready mit Run-Ende-Kontext

Alle 18 eingeschlossenen Karten haben:

- aktiven Hint
- Runtime-Katalogkarte
- CardImplementation
- AI-Support-Status `ai_supported`
- Derived Facts
- 0 verbleibende Issues
- Readiness `ready_read_only_with_encounter_context`

## Kontextregeln

BreakerProfile beschreibt statische Kartenfunktion. Es erzeugt keine aktuelle Break-Legalität.

Wichtige Grenzen:

- Tatsächliches Brechen bleibt Encounter-/LegalAction-/Engine-Sache.
- Payment, Stealth-Verlust, Selbst-Trash, Random Outcomes und Run-Ende bleiben Kontextentscheidungen.
- Universal Breaker bleiben universal und werden nicht auf spezifische Coverage reduziert.
- Spezialbreaker wie `Replicator` und `Reflector` werden nicht zu Universal-Breakern normalisiert.
- `effectiveRunQuote` bleibt für konkrete Pfadkosten und Breakbarkeit führend.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Engine-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Profil-, Deck- oder Holdout-Änderung.

## Nächster Batch

Empfohlen wird Aufgabe 017:

```text
runner_info_central_pressure_access_replacement
```

Kandidaten:

- `R&D-Protocol Files`
- `Deep Thought`
- `Microtech AI Interface`
- `Executive Wiretaps`
- `Edited Shipping Manifests`
- `Custodial Position`

Begründung: Nach dem Breaker-Longtail ist Runner-Info, Central Pressure und Access Replacement die stabilste größere Gruppe mit hohem Spielstärkebezug. Die Mechanik ist enger als ein breiter Corp-ICE-Trace-/Damage-Batch; strategische Bewertung bleibt Overlay-/Consumer-Kontext.
