# Aufgabe 011 - Batch-2 Generated-Facts-Rollup

## Kurzfazit

Aufgabe 011 rollt Batch 2 read-only zusammen. Batch 2 ist nach Dry-Run, Diff-Review und Normalization-Dry-Run conflict-/gap-frei und `future_migration_ready_read_only`: 6/6 Karten sind future-migration-ready, 11 Generated Facts sind bestätigt, 3 Preview-Adds bleiben reine Vergleichsartefakte, Hard Errors und echte semantische Konflikte bleiben 0.

`data/ai/ai-card-hints-active.json` bleibt unverändert die aktive Runtime-Quelle. Es gibt keine Runtime-, Planner-, Consumer-, Engine- oder Strategie-Wirkung.

## Quellen und Gates

Geprüfte Quellen:

- `docs/reviews/ai/aufgabe-008-generated-fact-batch2-dry-run-report-2026-05-25.json`
- `docs/reviews/ai/aufgabe-009-batch2-diff-review-report-2026-05-25.json`
- `docs/reviews/ai/aufgabe-010-batch2-normalization-dry-run-report-2026-05-25.json`
- `docs/reviews/ai/aufgabe-007-batch1-generated-facts-rollup-report-2026-05-25.json`
- `docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json`
- `docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json`
- `docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json`

Neuer Check:

```text
corepack pnpm check:ai-generated-fact-batch2-rollup
```

## Batch-2-Gesamtstatus

- Batch-Karten: 6
- bestätigte Generated Facts: 11
- Preview-Adds: 3
- Hard Errors: 0
- Konflikte: 0
- echte semantische Konflikte: 0
- normalisierte Differenzen: 15
- verbleibende Shape-/Target-/TrashCredit-/CostProfile-Differenzen: 0
- BoardContext-Infos: 7
- Monolith-only mechanical facts: 0
- Deriver-Follow-ups: 0
- Descriptor-Gaps: 0
- Human-Review-Kandidaten: 0

Readiness:

- `ready_for_future_generated_migration`: 4 Karten
- `ready_but_board_context_required`: 2 Karten

## Kartenstatus

| Karte                  | Fact-Gruppen                | bestätigt | Preview-Adds | Readiness                              |
| ---------------------- | --------------------------- | --------: | -----------: | -------------------------------------- |
| Japanese Water Torture | BreakerProfile, CostProfile |         2 |            0 | `ready_for_future_generated_migration` |
| Krash                  | BreakerProfile, CostProfile |         2 |            0 | `ready_for_future_generated_migration` |
| Mystery Box            | TargetProfile, CostProfile  |         3 |            2 | `ready_but_board_context_required`     |
| Poltergeist            | TrashCredit, CostProfile    |         1 |            0 | `ready_for_future_generated_migration` |
| Scatter Shot           | TrashCredit, CostProfile    |         1 |            0 | `ready_for_future_generated_migration` |
| Self-Modifying Code    | TargetProfile, CostProfile  |         2 |            1 | `ready_but_board_context_required`     |

Die drei Preview-Adds sind weiterhin nur Vergleichsartefakte:

- `Mystery Box`: `effect:topdeck_info`, `targetProfile`
- `Self-Modifying Code`: `targetProfile`

## Board- und LegalAction-Kontext

BreakerProfile:

- Beschreibt statische Kartenfunktion.
- Tatsächliches Brechen bleibt Encounter-/LegalAction-/Engine-Sache.
- `effectiveRunQuote` bleibt führend.
- `Krash` bleibt universal coverage und wird nicht auf einzelne ICE-Typen reduziert.
- `Japanese Water Torture` behält `forgo_actions` als SideEffect, ohne Runtime-Bewertung.

TargetProfiles:

- Beschreibt Such-/Zielstruktur.
- Such-/Install-Legalität bleibt Engine-/LegalAction-Sache.
- `Self-Modifying Code` bleibt `installCost = normal` und erzeugt kein `install_discount`.
- `Mystery Box` bleibt `installCost = free`, `install_discount`, `oncePerRun = true` und Top-five/StackTop.
- SMC und Mystery Box werden nicht als äquivalente Search-Facts behandelt.

TrashCredits:

- Beschreibt dedizierte Creditquellen.
- Nutzung/Zahlbarkeit bleibt LegalAction-/Payment-/Engine-Sache.
- `Poltergeist` bleibt node-trash-credit.
- `Scatter Shot` bleibt upgrade-trash-credit.

CostProfile:

- Mechanische Kosten und strategisches Risiko bleiben getrennt.
- Mechanische Kosten können langfristig generated sein.
- `reserveRisk` und `opportunityCost` bleiben Overlay/Strategy.

## Bewertung

Batch 2 ist future-migration-ready als read-only Kandidat. Die Normalisierung hat alle bekannten Shape-/Target-/TrashCredit-/CostProfile-Differenzen semantisch eingeordnet, ohne aktive Hintdaten zu verändern. Die verbleibenden Hinweise sind Safety-Kontext für Board, LegalAction und Legacy-Kompatibilität.

## Nächster Batch

Empfohlen wird Aufgabe 012 als `batch_3_remote_role_future_run_ice`:

- `Tutor`
- `Virizz`
- `Viral 15`
- `Crystal Palace Station Grid`
- `Red Herrings`

Begründung: RemoteRole und Future-run/Future-encounter-Facts sind die nächste relevante mechanische Kategorie nach Batch 1 und Batch 2. RemoteRole-Facts haben bereits Diagnose-/Consumer-Wert, während Future-run-/Future-encounter-Facts stärkere Board-/Runpath-Kontextmarkierung brauchen. Wenn der Scope zu breit wirkt, ist ein kleinerer Remote-Upgrades-only-Batch mit `Crystal Palace Station Grid` und `Red Herrings` die sinnvolle Fallback-Variante.

## Bewusst nicht geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Runtime-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Profilumschaltung, keine neuen Decks, keine Holdout-Optimierung.
