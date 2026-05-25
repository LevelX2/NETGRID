# AI-Derived Basic Facts Descriptor Schema Slice

Datum: 2026-05-25

## Kurzfazit

Die sechs nach der ersten Gap-Triage offenen Karten wurden als kleiner read-only Descriptor-/Schema-Slice geschnitten. Geschlossen wurde keine komplette Kartenlücke um jeden Preis: `Self-Modifying Code` und `Mystery Box` haben jetzt eine validierte TargetProfile-Struktur, bleiben aber wegen eines manuellen Mismatchs beziehungsweise eines nicht strukturierten Once-per-run-Descriptors offen. `Deep Thought`, `Crystal Palace Station Grid` und `Red Herrings` sind bewusst strategische Overlays. `Japanese Water Torture` bleibt ein Descriptor-Gap, obwohl der `forgo_actions`-Vergleich präziser ist.

Keine Engine-Regeln, CardImplementations, AI-Hints, Planner, Profile, Runtime-Pfade, Consumer oder `aiSupportStatus` wurden geändert.

## Kennzahlen

Vorher:

- Harte Errors: 0
- Warnings: 49
- Karten mit Manual-Overlay-/Descriptor-Bedarf: 6
- Manual/generated Mismatches: 8

Nachher:

- Harte Errors: 0
- Warnings: 42
- Karten mit Manual-Overlay-/Descriptor-Bedarf: 6
- Manual/generated Mismatches: 5

## Karten

### Japanese Water Torture

Bisheriger Gap: Wall-Coverage war ableitbar, `forgo_actions` wurde bereits im generated `breakerProfile.sideEffects` erkannt, aber der Vergleich gegen manuelle Breaker-SideEffects war zu grob. Die Future-Action-Debt ist weiterhin nicht als strukturierter Resolver-Descriptor vorhanden.

Entscheidung: `descriptor_gap_remaining`.

Begründung: Der Vergleich erkennt jetzt `breakerSideEffect:forgo_actions` als Overlap. Die Karte bleibt offen, weil die Ableitung weiterhin aus Text/Kommentar statt aus einem stabilen Resolver-Descriptor kommt.

### Self-Modifying Code

Bisheriger Gap: `search` und `requires_during_run` waren ableitbar, Target-/Install-Granularität war nicht schema-validiert.

Entscheidung: `schema_extended`.

Begründung: `targetProfiles` beschreiben jetzt `zone: "stack"`, `targetCardType: "program"`, `installsTarget: true`, `installCost: "normal"` und `shuffleAfter: true`. Die Karte bleibt offen, weil das manuelle `install_discount` nicht aus der Implementation folgt. Der Hint wurde nicht geändert, weil dieser Slice keine Hint-Migration ist.

### Mystery Box

Bisheriger Gap: Search, Topdeck-Info, Install-Discount und During-Run waren ableitbar, Top-five-/Target-Granularität war aber nicht schema-validiert.

Entscheidung: `schema_extended` und `descriptor_gap_remaining`.

Begründung: `targetProfiles` beschreiben jetzt `zone: "stack_top"`, `lookCount: 5`, `showToOpponent: true`, `targetCardType: "program"`, `installsTarget: true`, `installCost: "free"` und `shuffleAfter: true`. Die Karte bleibt offen, weil `oncePerRun` nur im Text/Kommentar sichtbar ist und nicht als strukturierter Resolver-Descriptor vorliegt.

### Deep Thought

Bisheriger Gap: `topdeck_info` ist mechanisch ableitbar, R&D-pressure und Interface-Pressure standen als manuelle Conditions/LineSupport im Hint.

Entscheidung: `intentionally_manual_overlay`.

Begründung: Es fehlt keine mechanische Basic-Fact-Ableitung für den Gate-Scope. Der strategische Wert des wiederholten Topdeck-Wissens bleibt bewusst manuell und wird nicht als mechanischer Fact erzeugt.

### Crystal Palace Station Grid

Bisheriger Gap: `run_tax` und `remoteRole:run_tax` sind mechanisch ableitbar. `remote_protection` ist kontextabhängige strategische Bewertung.

Entscheidung: `intentionally_manual_overlay`.

Begründung: Mechanisch bleibt `break_subroutine_cost -> run_tax`. `remote_protection` wird nicht mechanisch überdehnt. Die Crystal-Palace-Denylist gegen Economy-/Counter-Fehlklassifikation bleibt unverändert.

### Red Herrings

Bisheriger Gap: `agenda_steal_tax`, `run_tax` und `requires_accessed_card` sind ableitbar. `remote_protection` bleibt kontextabhängig.

Entscheidung: `intentionally_manual_overlay`.

Begründung: `remoteRole.kind = "agenda_steal_tax"` und `condition:requires_accessed_card` sind stabil im Report. `requires_agenda_in_remote` wurde nicht ergänzt, weil es für den Gate-Scope zu stark wäre: die Implementation beschreibt einen Steal-Cost-Modifier auf zugriffene Agendas aus demselben Fort, nicht eine allgemeine Remote-Agenda-Zustandsbehauptung. `remote_protection` bleibt strategisches Overlay.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine CardImplementation-Logikänderung.
- Keine Strategie-, Planner-, Profil- oder Runtime-Anbindung.
- Keine Consumer-Nutzung der Derived Facts.
- Keine neuen Decks und keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine AI-Hint-Änderung in diesem Slice.

## Nächster Schritt

Der nächste praktische Schritt ist ein gezielter Descriptor-Design-Slice für die zwei echten Descriptor-Gaps: `Japanese Water Torture` braucht einen strukturierten Future-Action-Debt-Descriptor, `Mystery Box` einen strukturierten Once-per-run-Descriptor. Separat sollte der manuelle `install_discount`-Eintrag bei `Self-Modifying Code` als Hintdaten-Cleanup geprüft werden.
