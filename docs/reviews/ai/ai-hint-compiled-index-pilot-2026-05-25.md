# AI Hint Compiled Index Pilot

Datum: 2026-05-25

## Kurzfazit

Der read-only Compiler-Prototyp umfasst jetzt alle 24 Derived-Basic-Facts-Pilotkarten statt nur die sechs Karten mit Manual Overlay. Er baut pro Karte eine `compiledPreview` aus:

1. aktivem Hint-Monolithen,
2. Generated Basic Facts aus dem Derived-Facts-Gate,
3. optionalem Manual Overlay.

Der Report bleibt ein Vergleichsartefakt: `data/ai/ai-card-hints-active.json` wird nicht ersetzt, nicht überschrieben und weiterhin als einzige Runtime-Quelle genutzt.

Aktueller Gate-Befund:

- Compiled Pilot Cards: 24
- Karten mit Overlay: 6
- Karten ohne Overlay: 18
- Harte Errors: 0
- Warnings: 84

## Was der Compiler-Prototyp macht

Script:

```text
scripts/check-ai-hint-compiled-index.mjs
```

Root-Script:

```text
corepack pnpm check:ai-hint-compiled-index
```

Der Check liest die 24er-Pilotliste aus `data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json`, ergänzt vorhandene Overlay-Einträge und erzeugt den deterministischen Report `docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json`.

## Was er ausdrücklich nicht macht

- keine Änderung an `data/ai/ai-card-hints-active.json`
- kein Import in `packages/ai/src/ai-hints.ts`
- keine Änderung an `deck-doctrine.ts`, `corp-plans.ts` oder `runner-plans.ts`
- keine Planer-, Strategie-, Legalitäts- oder Runtime-Wirkung
- keine Änderung an `aiSupportStatus`
- keine Migration weiterer Karten außerhalb der 24 Pilotkarten

## Inputquellen

- Active Monolith: `data/ai/ai-card-hints-active.json`
- 24er Pilotliste: `data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json`
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
3. Optionales Manual Overlay:
   - `lineSupport`
   - `quality`
   - `manualNotes`
   - `strategicNotes`
   - `descriptorGaps`
4. Conflict/Comparison Layer:
   - harte Safety-Checks
   - mechanische Monolith-/Generated-Diffs
   - strategische Monolith-/Overlay-Diffs
   - `recommendedNextAction`

## Neues Warning-Modell

Harte Errors aktuell: 0.

Abgesicherte Error-Klassen:

- Pilotkarte fehlt im aktiven Monolithen.
- Pilotkarte fehlt im Derived-Facts-Report.
- Overlay setzt `aiSupportStatus`.
- Overlay enthält Runtime-/Legalitätsfelder.
- Overlay enthält Hidden-Info-Felder.
- Generated Facts enthalten Hidden-Info-Felder.
- Overlay dupliziert mechanische Fields wie `effects`, `conditions`, `breakerProfile`, `remoteRole`, `targetProfiles`.
- Crystal-Palace-Denylist-Verstoß.
- Derived-Facts-Quellreport hat harte Errors.
- `--check` weicht vom committed Report ab.

Warnings aktuell: 84.

Warning-Verteilung:

- `active_monolith_mechanical_duplication`: 46
- `generated_fact_missing_from_active_monolith`: 28
- `manual_overlay_strategy_field_missing_from_active`: 8
- `descriptor_gap_remaining`: 2

Fehlende Overlays sind nur dann Warnings, wenn eine Karte in der Pilotliste oder im Derived-Facts-Report einen Manual-Overlay-Bedarf hat. Aktuell gibt es keine `overlay_missing_for_manual_gap`-Warnings, weil die sechs erwarteten Overlaykarten abgedeckt sind.

## Karten mit Overlay

- `Deep Thought`
- `Japanese Water Torture`
- `Mystery Box`
- `Self-Modifying Code`
- `Crystal Palace Station Grid`
- `Red Herrings`

Diese Karten behalten strategische/manual Informationen im Overlay. Zwei davon bleiben als Schema-/Descriptor-Gap markiert:

- `Japanese Water Torture`: `future_action_debt_not_structured`
- `Mystery Box`: `once_per_run_not_structured`

## Karten ohne Overlay

Die übrigen 18 Pilotkarten werden aus Active Monolith + Generated Basic Facts kompiliert:

- `Krash`
- `Poltergeist`
- `R&D-Protocol Files`
- `Scatter Shot`
- `Corporate Boon`
- `Corporate Coup`
- `Employee Empowerment`
- `Netwatch Operations Office`
- `On-Call Solo Team`
- `Political Overthrow`
- `Strike Force Kali`
- `Tutor`
- `Viral 15`
- `Virizz`
- `Audit of Call Records`
- `Chance Observation`
- `Closed Accounts`
- `Scorched Earth`

Für diese Karten ist im aktuellen Pilot kein Manual Overlay erforderlich. Die Warnings dort sind vor allem mechanische Vergleichssignale zwischen Generated Facts und Monolith.

## Karten, für die Overlay sinnvoll wäre

Aktuell fehlt kein erwartetes Overlay. Die nächsten fachlichen Overlay-Kandidaten bleiben deshalb nicht neue Pflichtkarten, sondern vorhandene Schema-/Descriptor-Themen:

- `Japanese Water Torture`: strukturierter Future-Action-Debt-Descriptor.
- `Mystery Box`: strukturierter Once-per-Run-Descriptor.

`Deep Thought`, `Crystal Palace Station Grid` und `Red Herrings` haben bereits strategische Overlays; ihr verbleibender Unterschied zum Monolithen ist erwartbar, weil `strategicNotes` nur im Overlay existieren.

## Karten, für die Generated Facts reichen

Für die 18 Karten ohne Overlay reichen im aktuellen Pilot Generated Basic Facts plus bestehender Monolith-Hint aus. Besonders klare generated-only Kandidaten:

- Scored-agenda actions: `Corporate Boon`, `Corporate Coup`, `Employee Empowerment`, `Political Overthrow`, `Netwatch Operations Office`, `On-Call Solo Team`, `Strike Force Kali`
- Tag-/Trace-/Punish operations: `Audit of Call Records`, `Chance Observation`, `Closed Accounts`, `Scorched Earth`
- Runner mechanical tools: `Krash`, `Poltergeist`, `R&D-Protocol Files`, `Scatter Shot`
- Future-run ICE coarse facts: `Tutor`, `Viral 15`, `Virizz`

## Monolith-Felder, die langfristig generated werden sollten

Langfristig generated:

- `effects`
- `conditions`
- `costProfile`, soweit mechanisch ableitbar
- `breakerProfile`
- `remoteRole`
- `targetProfiles`

Die 46 `active_monolith_mechanical_duplication`-Warnings zeigen, dass diese Felder im Monolithen bereits strukturiert gepflegt werden, aber im Zielbild besser aus Implementations/Derived Facts kommen.

## Strategische Felder, die Overlay bleiben sollten

Langfristig Overlay:

- `lineSupport`
- `quality`
- `confidence`
- `needsHumanReview`
- `manualNotes`
- `strategicNotes`
- `descriptorGaps`

Die 8 `manual_overlay_strategy_field_missing_from_active`-Warnings sind erwartbar: `manualNotes`, `strategicNotes` und `descriptorGaps` sind bewusst nur im modularen Overlay-Pilot vorhanden und nicht im aktiven Monolithen.

## Empfehlung

Der Ansatz ist tragfähig: Der Compiler kann die 24 Derived-Facts-Pilotkarten deterministisch aus Active Monolith, Generated Facts und optionalem Overlay zusammenführen. Der nächste praktische Schritt sollte kein Runtime-Compile sein, sondern eine fachliche Erweiterung der Overlay-/Descriptor-Abdeckung:

1. `Japanese Water Torture` und `Mystery Box` als Descriptor-Themen schneiden.
2. Danach ein weiteres kleines Overlaysegment nur dann anlegen, wenn eine echte strategische Lücke entsteht.
3. Erst anschließend prüfen, ob der Compiler-Report auf weitere Benchmarkkarten vorbereitet werden sollte.
