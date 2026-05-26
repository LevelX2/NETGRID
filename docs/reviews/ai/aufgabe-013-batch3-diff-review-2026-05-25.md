# Aufgabe 013 - Batch-3 Diff-/Normalization-Review

## Kurzfazit

Aufgabe 013 klassifiziert die Batch-3-Differenzen aus Aufgabe 012 read-only. Ergebnis: Es gibt keine echten semantischen Konflikte. Batch 3 sollte aber nach dem Diff-Review getrennt weitergeführt werden:

- `remote_upgrades_only`: `Crystal Palace Station Grid`, `Red Herrings`
- `future_run_ice`: `Tutor`, `Virizz`, `Viral 15`

Die Remote-Upgrades sind vergleichsweise stabil und können in einem eigenen Normalization-Dry-Run weitergeführt werden. Future-run ICE braucht dagegen strengere Remaining-ICE-/Runpath-/Descriptor-Regeln, bevor ein Rollup sinnvoll ist.

`data/ai/ai-card-hints-active.json` bleibt unverändert die aktive Runtime-Quelle. Es gibt keine Runtime-, Planner-, Consumer-, Engine- oder Strategie-Wirkung.

## Ausgangslage

Aufgabe 012 meldete:

- Batch-Karten: 5
- bestätigte Generated Facts: 15
- Preview-Adds: 0
- Hard Errors: 0
- Konflikte: 0
- Status: `needs_diff_review`
- Warnings: 76

Die relevanten Diffgruppen:

- `shape_difference`: 6
- `remote_role_shape_difference`: 4
- `future_run_shape_difference`: 3
- `board_context_required`: 15
- `runpath_context_required`: 10
- `descriptor_context_required`: 9

## Klassifikation

### Shape-Differences

Die 6 Shape-Differences sind keine Konflikte:

- `Virizz` `effect:run_tax`: `runpath_context_shape_difference`
- `Viral 15` `effect:program_trash`: `runpath_context_shape_difference`
- `Viral 15` `effect:run_tax`: `runpath_context_shape_difference`
- `Crystal Palace Station Grid` `effect:run_tax`: `remote_role_equivalent_run_tax`
- `Red Herrings` `effect:run_tax`: `remote_role_equivalent_agenda_steal_tax`
- `Red Herrings` `remoteRole`: `board_context_shape_difference`

### RemoteRole-Differences

Die 4 RemoteRole-Differences bleiben innerhalb der erwarteten RemoteRole-Semantik:

- `Crystal Palace Station Grid`: `remote_role_equivalent_run_tax`
- `Red Herrings` `effect:run_tax`: `remote_role_equivalent_agenda_steal_tax`
- `Red Herrings` `remoteRole`: `active_state_context_required`
- zusätzlicher Red-Herrings-Hinweis: `remote_role_equivalent_agenda_steal_tax`

Guardrails:

- Crystal Palace bleibt `run_tax`.
- Crystal Palace wird nicht Economy, Counter oder Agenda-Steal-Tax.
- Red Herrings bleibt `agenda_steal_tax`.
- Red Herrings wird nicht als generischer Remote-Run-Tax behandelt.

### FutureRun-Differences

Die 3 FutureRun-Differences sind Folgearbeit, keine Konflikte:

- `Virizz` `effect:run_tax`: `remaining_ice_context_required`
- `Viral 15` `effect:program_trash`: `future_run_program_trash_context_required`
- `Viral 15` `effect:run_tax`: `remaining_ice_context_required`

Diese Facts dürfen nicht als aktuelle Legalität, Self-Safety oder unmittelbare Trash-/Break-Wahrheit verstanden werden.

### BoardContext

Die 15 BoardContext-Hinweise wurden als Safety-Kontext klassifiziert:

- Future-run ICE: `future_run_requires_ongoing_run_context`
- Crystal Palace: `remote_role_requires_rezzed_active_state` beziehungsweise `run_tax_requires_encounter_or_run_context`
- Red Herrings: `agenda_steal_tax_requires_access_context`

### RunpathContext

Die 10 RunpathContext-Hinweise wurden klassifiziert als:

- `future_run_requires_current_run_path`
- `future_run_requires_remaining_ice`
- `future_run_requires_effective_run_quote_context`
- `future_run_requires_unbroken_subroutine`

`effectiveRunQuote` bleibt bei konkreten Pfadkosten führend.

### DescriptorContext

Die 9 DescriptorContext-Hinweise sind zweigeteilt:

- 3x `future_run_descriptor_followup` für `Tutor`, `Virizz`, `Viral 15`
- 6x `descriptor_context_info` für bewusst strategische/contextual Remote-Protection bei `Crystal Palace Station Grid` und `Red Herrings`

Remote-Protection bleibt vorerst Overlay-/Strategie-Thema und wird nicht mechanisch generated.

## Split-Empfehlung

Empfehlung: `remote_upgrades_ready_future_ice_needs_followup` mit Follow-up-Shape `split_after_diff_review`.

Begründung:

- Remote-Upgrades sind nach RemoteRole-Normalisierung relativ stabil.
- Future-run ICE braucht eigene Descriptor- und Runpath-Regeln.
- Ein gemeinsamer Batch würde Normalisierungsregeln vermischen, die unterschiedlich riskant sind.

Empfohlene Folge:

- Aufgabe 014A: `Remote-Upgrades-Normalization-Dry-Run`
- Aufgabe 014B: `Future-run-ICE-Descriptor-Review`

## Normalisierungsregeln

Empfohlene Regeln:

- `remote_role_run_tax_normalization`
- `remote_role_agenda_steal_tax_normalization`
- `future_run_remaining_ice_context_normalization`
- `future_run_program_trash_context_normalization`
- `active_state_context_normalization`
- `effective_run_quote_priority_annotation`
- `keep_remote_protection_overlay_only`

## Bewusst nicht geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Runtime-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Profilumschaltung, keine neuen Decks, keine Holdout-Optimierung.
