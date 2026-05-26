# Aufgabe 008 - AI-Hints: Batch-2 Breaker/Target/Trash-Credit Dry-Run

## Kurzfazit

Aufgabe 008 prototypisiert einen read-only Dry-Run fuer `batch_2_breaker_target_trash_credit`. Der Batch umfasst sechs Derived-Facts-Pilotkarten und fuehrt aktive Monolith-Hints, Generated Basic Facts, Migration-Priority-Daten, Compiled-Index-Daten und bestehende Manual Overlays in einem reinen Vergleichsreport zusammen.

Ergebnis: Der Dry-Run hat 0 Hard Errors und 0 Konflikte. Drei Facts wuerden nur im Preview ergaenzt, elf Facts bestaetigen vorhandene Monolith-Strukturen. Alle sechs Karten brauchen aber noch einen Diff-/Normalization-Review, weil TargetProfiles, Trash-Credit-Ziel/Amount, BreakerProfile-Shape und CostProfile-Legacy-Daten bewusst nicht automatisch normalisiert wurden.

## Batch-2-Scope

Der Batch ist auf diese sechs Karten begrenzt:

- `Japanese Water Torture`
- `Krash`
- `Mystery Box`
- `Poltergeist`
- `Scatter Shot`
- `Self-Modifying Code`

Im Scope liegen nur mechanische Generated Facts:

- `effects.kind = breaker`
- `breakerProfile`
- `effects.kind = search`
- `effects.kind = topdeck_info`
- `effects.kind = install_discount`, nur fuer echte Free-Install-Faelle
- `conditions.requires_during_run`
- `targetProfiles`
- `effects.kind = trash_credit`
- `costProfile`, nur wenn der Derived-Facts-Report ein CostProfile liefert

Nicht im Scope liegen `remoteRole`, Future-run/Future-encounter-Facts, Batch-1 scored-agenda/tag-punish Facts, strategische Felder, Manual Overlay Notes, Legacy `roles`/`planRoles` und `aiSupportStatus`.

## Ergebniszahlen

Der deterministische Report liegt unter `docs/reviews/ai/aufgabe-008-generated-fact-batch2-dry-run-report-2026-05-25.json`.

- Batch-Karten: 6
- Hard Errors: 0
- Konflikte: 0
- Warnings: 47
- Infos: 22
- bestaetigte Generated Facts: 11
- Preview-Adds: 3
- Preview-geaenderte Karten: 2
- Shape-Differences: 5
- TargetProfile-Differences: 2
- TrashCredit-Differences: 2
- CostProfile-Differences: 6
- Manual Overlays vorhanden: 3

Warning-Gruppen:

- `consumer_active_for_fact_type`: 14
- `board_context_required`: 7
- `cost_profile_shape_difference`: 6
- `generated_fact_already_present`: 6
- `shape_difference`: 5
- `generated_fact_added_in_preview`: 3
- `target_profile_shape_difference`: 2
- `trash_credit_target_shape_difference`: 2
- `descriptor_context_required`: 2

## Kartenstatus

### Japanese Water Torture

Generated bestaetigt `effect:breaker` exakt und `breakerProfile` semantisch. Der Shape unterscheidet sich bei Breaker-Details: Generated leitet `pumpCost = 1`, `breakCost = 0` und `sideEffects = ["forgo_actions"]` ab; der aktive Monolith fuehrt zusaetzlich Legacy-/Diagnosewerte wie `baseStrength` und `costProfile`.

Status: `needs_diff_review`.

### Krash

Generated bestaetigt `effect:breaker` exakt und `breakerProfile` semantisch. Der Monolith ist bei `baseStrength`/CostProfile spezifischer, waehrend der Generated-Facts-Pfad die zentralen Breaker-Kosten und Universal-Coverage liefert.

Status: `needs_diff_review`.

### Mystery Box

Generated bestaetigt `effect:search` und `condition:requires_during_run` exakt. `install_discount` wird semantisch bestaetigt, aber mit anderem Scope geformt. `topdeck_info` und das praezise TargetProfile (`stack_top`, `lookCount = 5`, `targetCardType = program`, `installsTarget = true`, `installCost = free`, `oncePerRun = true`) wuerden nur im Preview ergaenzt.

Status: `needs_diff_review`.

### Poltergeist

Generated bestaetigt `effect:trash_credit` semantisch. Der Monolith enthaelt Amount/Repeatable-Shape, waehrend der Generated-Facts-Pfad aktuell nur die dedizierte Trash-Credit-Quelle sieht. Der Zielkontext ist card-spezifisch `node` und bleibt als Descriptor-/Comparator-Kontext sichtbar.

Status: `needs_diff_review`.

### Scatter Shot

Generated bestaetigt `effect:trash_credit` semantisch. Analog zu Poltergeist enthaelt der Monolith Amount/Repeatable-Shape, waehrend der Generated-Facts-Pfad aktuell nur die dedizierte Trash-Credit-Quelle sieht. Der Zielkontext ist card-spezifisch `upgrade` und wird ausdruecklich nicht mit Poltergeist vertauscht.

Status: `needs_diff_review`.

### Self-Modifying Code

Generated bestaetigt `effect:search` und `condition:requires_during_run` exakt. Das TargetProfile (`zone = stack`, `targetCardType = program`, `installsTarget = true`, `installCost = normal`, `shuffleAfter = true`) wuerde nur im Preview ergaenzt. Der Guardrail stellt sicher, dass `Self-Modifying Code` kein `install_discount` generiert.

Status: `needs_diff_review`.

## Board-/LegalAction-Kontext

BreakerProfile beschreibt nur statische Kartenfunktion. Ob ein Subroutine-Break legal ist, bleibt Encounter-, Run-, LegalAction- und Engine-Zustand.

TargetProfiles beschreiben Such-/Install-Ziele, aber keine Playability. `installCost = normal` bei `Self-Modifying Code` bedeutet nicht gratis. `installCost = free` bei `Mystery Box` ist mechanisch auf den Mystery-Box-Effekt begrenzt.

Trash-Credits beschreiben eine dedizierte Creditquelle. Ob und wie die Credits zahlbar sind, bleibt Cost-/LegalAction-Logik. Poltergeist und Scatter Shot muessen dauerhaft node- versus upgrade-spezifisch getrennt bleiben.

Legacy-Felder wie `roles`, `planRoles`, `aiSupportStatus`, `lineSupport` und `quality` bleiben Monolith-/Overlay-Felder und werden im Dry-Run nicht veraendert.

## Bewusst Nicht Geaendert

- Keine Aenderung an `data/ai/ai-card-hints-active.json`.
- Keine Aenderung an `aiSupportStatus`.
- Keine Runtime-, Planner-, Consumer- oder Engine-Anbindung.
- Keine aktive Hintmigration.
- Keine Monolith-Bereinigung.
- Keine Performanceinterpretation.

## Empfehlung

Batch 2 ist als Dry-Run konfliktfrei, aber noch nicht rollup-reif. Der naechste praktische Schritt ist Aufgabe 009: ein fokussierter Batch-2-Diff-/Normalization-Review fuer:

- BreakerProfile-Shape (`baseStrength`, `pumpCost`, SideEffects)
- TargetProfile-Preview-Adds bei `Mystery Box` und `Self-Modifying Code`
- Trash-Credit-Ziel/Amount/Repeatable-Shape bei `Poltergeist` und `Scatter Shot`
- CostProfile-Legacy-Shape fuer alle sechs Karten
