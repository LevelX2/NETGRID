# AI Hint Compiled Index Pilot

Datum: 2026-05-25

## Kurzfazit

Der Pilot baut einen read-only Vergleichsindex aus drei Quellen:

1. aktivem Hint-Monolithen,
2. Generated Basic Facts aus dem Derived-Facts-Gate,
3. modularen Manual Overlays.

Der Compiler erzeugt nur den deterministischen Report `docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json`. Er ersetzt `data/ai/ai-card-hints-active.json` nicht und wird von keiner Runtime-, Planner- oder Consumer-Datei importiert.

Aktueller Gate-Befund:

- Compiled Pilot Cards: 6
- Harte Errors: 0
- Warnings: 33

## Was der Compiler-Prototyp macht

Neues Script:

```text
scripts/check-ai-hint-compiled-index.mjs
```

Neues Root-Script:

```text
corepack pnpm check:ai-hint-compiled-index
```

Der Check liest die Overlay-Pilotkarten, erzeugt pro Karte eine `compiledPreview` und vergleicht die Quellen. Die Preview ist ausdrücklich ein Report-Artefakt, keine Runtime-Datei.

## Was er ausdrücklich nicht macht

- keine Änderung an `data/ai/ai-card-hints-active.json`
- kein Import in `packages/ai/src/ai-hints.ts`
- keine Änderung an `deck-doctrine.ts`, `corp-plans.ts` oder `runner-plans.ts`
- keine Planer-, Strategie-, Legalitäts- oder Runtime-Wirkung
- keine Änderung an `aiSupportStatus`
- keine Migration weiterer Karten

## Inputquellen

- Active Monolith: `data/ai/ai-card-hints-active.json`
- Derived Basic Facts: `docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json`
- Manual Overlays:
  - `data/ai/hints/overlays/onr-v1/runner/programs.json`
  - `data/ai/hints/overlays/onr-v1/corp/upgrades.json`

Der Compiler liest den committed Derived-Facts-Report statt den Deriver neu zu importieren. Damit entsteht keine zweite Deriver-Logik und keine fragile TS/MJS-Tooling-Brücke.

## Merge-Modell

Die Preview pro Karte wird in dieser Reihenfolge zusammengesetzt:

1. Active Monolith Basis:
   - `cardId`
   - `side`
   - `cardType`
   - `roles`
   - `planRoles`
   - bestehendes `aiSupportStatus`
2. Generated Basic Facts:
   - `effects`
   - `conditions`
   - `costProfile`
   - `breakerProfile`
   - `remoteRole`
   - `targetProfiles`
3. Manual Overlay:
   - `lineSupport`
   - `quality`
   - `manualNotes`
   - `strategicNotes`
   - `descriptorGaps`
4. Conflict/Comparison Layer:
   - harte Safety-Checks
   - mechanische Monolith-/Generated-Diffs
   - strategische Monolith-/Overlay-Diffs

## Pilotkarten

- `Deep Thought`
- `Japanese Water Torture`
- `Mystery Box`
- `Self-Modifying Code`
- `Crystal Palace Station Grid`
- `Red Herrings`

Alle sechs Karten haben:

- aktiven Monolith-Hint
- Derived Facts
- Manual Overlay
- compiled Preview

## Hard Errors und Warnings

Harte Errors aktuell: 0.

Abgesicherte Error-Klassen:

- Overlay-Karte fehlt im aktiven Monolithen.
- Descriptor-Gap-Overlay ohne Derived-Facts-Karte.
- Overlay setzt `aiSupportStatus`.
- Overlay enthält Runtime-/Legalitätsfelder.
- Overlay enthält Hidden-Info-Felder.
- Generated Facts enthalten Hidden-Info-Felder.
- Overlay dupliziert mechanische Fields wie `effects`, `conditions`, `breakerProfile`, `remoteRole`, `targetProfiles`.
- Crystal-Palace-Denylist-Verstoß.
- Derived-Facts-Quellreport hat harte Errors.
- `--check` weicht vom committed Report ab.

Warnings aktuell: 33.

Warning-Verteilung:

- `active_mechanical_field_should_be_generated`: 12
- `generated_fact_missing_or_differs_in_active`: 11
- `overlay_field_missing_or_differs_in_active`: 8
- `descriptor_gap_remaining`: 2

Diese Warnings sind erwartete Vergleichssignale: Der aktive Monolith enthält noch mechanische Strukturfelder, während die Overlay-Dateien bereits nur strategische/manual Felder halten.

## Vergleich Active Monolith vs Generated vs Overlay

### Deep Thought

- Generated: `effect:topdeck_info`
- Overlay: `lineSupport`, `quality`, `strategicNotes`
- Monolith mechanisch: `effects`
- Zielbild: Topdeck-Info generated; R&D-/Interface-Pressure bleibt Overlay.

### Japanese Water Torture

- Generated: `effect:breaker`, `breakerProfile`
- Overlay: `lineSupport`, `quality`, `manualNotes`, `descriptorGaps`
- Monolith mechanisch: `effects`, `breakerProfile`
- Zielbild: Breakerprofil generated; `future_action_debt_not_structured` bleibt Descriptor-/Manual-Thema.

### Mystery Box

- Generated: `effect:search`, `effect:topdeck_info`, `effect:install_discount`, `condition:requires_during_run`, `targetProfiles`
- Overlay: `lineSupport`, `quality`, `manualNotes`, `descriptorGaps`
- Monolith mechanisch: `effects`, `conditions`
- Zielbild: Search-/Top-five-/Install-Target generated; `once_per_run_not_structured` bleibt Descriptor-Gap.

### Self-Modifying Code

- Generated: `effect:search`, `condition:requires_during_run`, `targetProfiles`
- Overlay: `lineSupport`, `quality`, `manualNotes`
- Monolith mechanisch: `effects`, `conditions`
- Zielbild: Install-Target-Profil generated; strategische Rig-/Breaker-Search-Einordnung bleibt Overlay.

### Crystal Palace Station Grid

- Generated: `effect:run_tax`, `remoteRole:run_tax`
- Overlay: `lineSupport`, `quality`, `strategicNotes`
- Monolith mechanisch: `effects`, `remoteRole`
- Zielbild: Run-Tax generated; Remote-Protection bleibt strategische Kontextwertung. Die Denylist bleibt grün.

### Red Herrings

- Generated: `effect:run_tax`, `condition:requires_accessed_card`, `remoteRole:agenda_steal_tax`
- Overlay: `lineSupport`, `quality`, `strategicNotes`
- Monolith mechanisch: `effects`, `conditions`, `remoteRole`
- Zielbild: Agenda-Steal-Tax und Access-Condition generated; Remote-Protection bleibt strategische Kontextwertung.

## Empfehlungen

Langfristig generated:

- `effects`
- `conditions`
- `costProfile`, soweit mechanisch ableitbar
- `breakerProfile`
- `remoteRole`
- `targetProfiles`

Langfristig Overlay:

- `lineSupport`
- `quality`
- `confidence`
- `needsHumanReview`
- `manualNotes`
- `strategicNotes`
- `descriptorGaps`

Der Ansatz ist tragfähig: Der Pilot kann einen compiled Vergleichsindex für die sechs Karten deterministisch erzeugen, ohne die Runtime-Datei zu ersetzen. Die 33 Warnings sind keine Safety-Fehler, sondern zeigen den noch nicht migrierten Monolith-Zustand.

## Nächster Schritt

Als nächstes bietet sich entweder ein zweites Overlay-Segment an oder die Erweiterung des Compiler-Prototyps auf alle 24 Derived-Facts-Pilotkarten. Der bessere nächste Schritt ist die 24-Karten-Erweiterung, weil sie prüft, ob das Merge-Modell auch außerhalb der sechs offenen Overlay-Karten stabil bleibt.
