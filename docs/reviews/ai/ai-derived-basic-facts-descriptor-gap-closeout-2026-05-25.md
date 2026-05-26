# AI Derived Basic Facts Descriptor Gap Closeout

Datum: 2026-05-25

## Kurzfazit

Die zwei verbliebenen echten Descriptor-Gaps im Derived-Basic-Facts-/Overlay-System sind geschlossen:

- `Japanese Water Torture`: `future_action_debt_not_structured`
- `Mystery Box`: `once_per_run_not_structured`

Beide Lösungen bleiben read-only. Es gibt keine Engine-Regeländerung, keine Planerwirkung, keine Runtime-Nutzung des Compilers oder der modularen Overlays und keine Änderung an `data/ai/ai-card-hints-active.json`.

## Japanese Water Torture

Gap:

```text
future_action_debt_not_structured
```

Entscheidung:

`forgo_actions` ist für den Basic-Facts-Level ausreichend. Der Deriver erzeugte bereits `breakerProfile.sideEffects = ["forgo_actions"]`; die zusätzliche Descriptor-Gap-Markierung war zu streng. Die konkrete spätere Aktionsschuld bleibt Engine-/Runtime-Zustand und wird nicht als Planner-Semantik aktiviert.

Änderung:

- `scripts/check-ai-derived-facts.mjs` erzeugt weiter `breakerProfile.sideEffects = ["forgo_actions"]`.
- Die bisherige `needsManualOverlayReasons`-Lücke wird nicht mehr erzeugt.
- Der Report hält nur noch eine `derivationNotes`-Notiz fest, dass keine Planner-/Runtime-Nutzung gemeint ist.
- Das Overlay entfernt `descriptorGaps` und behält nur eine erklärende `manualNotes`-Notiz.

Warum keine Planerwirkung:

Die Änderung schreibt nur read-only Reportdaten. Kein Consumer liest `forgo_actions` aus dem Compiled-Index oder den Overlays für Entscheidungen.

## Mystery Box

Gap:

```text
once_per_run_not_structured
```

Entscheidung:

Kein neues Ontology-Feld ist nötig. `AiHintEffectTargetProfile` hatte bereits das read-only Feld `oncePerRun?: boolean`. Der Deriver nutzt dieses Feld jetzt für Mystery Box.

Änderung:

- `scripts/check-ai-derived-facts.mjs` setzt `targetProfiles[0].oncePerRun = true`, wenn die Implementation/Textform `only once each run` enthält.
- Die bisherige `needsManualOverlayReasons`-Lücke wird nicht mehr erzeugt.
- Das Overlay entfernt `descriptorGaps` und behält nur eine erklärende `manualNotes`-Notiz.
- `packages/ai/src/hint-ontology.test.ts` deckt `oncePerRun: true` im TargetProfile ab.

Warum keine Planerwirkung:

`oncePerRun` ist nur in der read-only Ontology/Report-Schicht sichtbar. Die tatsächliche Ability-Legalität bleibt unverändert in der Engine; kein AI-Consumer wertet dieses Feld aus.

## Kennzahlen

Vorher:

- Derived-Facts Hard Errors: 0
- Derived-Facts Warnings: 42
- `cardsNeedingManualOverlay`: 6
- Compiled-Index Hard Errors: 0
- Compiled-Index Warnings: 84
- `descriptor_gap_remaining`: 2

Nachher:

- Derived-Facts Hard Errors: 0
- Derived-Facts Warnings: 40
- `cardsNeedingManualOverlay`: 4
- Compiled-Index Hard Errors: 0
- Compiled-Index Warnings: 80
- `descriptor_gap_remaining`: 0

## Bewusst nicht geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Regel-, Runtime-, Planner- oder Consumer-Anbindung.
- Keine neue Deck- oder Holdout-Arbeit.
- Keine Massenmigration weiterer Hints.

## Nächster Schritt

Der nächste praktische Schritt ist kein Runtime-Compile, sondern die verbleibenden Compiled-Index-Warnings als Monolith-vs-Generated-Vergleich zu klassifizieren. Besonders sinnvoll ist ein kleiner Bericht, welche mechanischen Monolith-Felder zuerst in Generated Basic Facts überführt werden könnten, ohne die aktive Runtime-Quelle zu ersetzen.
