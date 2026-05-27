---
activityId: act-2026-05-27-proteus-pro007-corp-operation-economy-trace-history
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO007
proReferences:
  - PRO007
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/operations/credit-consolidation.ts
  - packages/engine/src/card-implementations/proteus/corp/operations/data-sifters.ts
  - packages/engine/src/card-implementations/proteus/corp/operations/manhunt.ts
  - packages/engine/src/card-implementations/proteus/corp/operations/schlaghund-pointers.ts
  - packages/engine/src/card-implementations/proteus/corp/operations/underworld-mole.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - data/manifests/proteus-card-support.json
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"PRO007\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Proteus PRO007\""
---

# Proteus PRO007: Corp Operation Economy/Trace/History

## Ergebnis

PRO007 ist vollständig umgesetzt. Es wurde je eine CardImplementation-Datei für diese fünf Corp-Operations angelegt:

- `onr_proteus_047_credit-consolidation` / Credit Consolidation
- `onr_proteus_048_data-sifters` / Data Sifters
- `onr_proteus_050_manhunt` / Manhunt
- `onr_proteus_052_schlaghund-pointers` / Schlaghund Pointers
- `onr_proteus_053_underworld-mole` / Underworld Mole

## Ergänzte generische Bausteine

- Runner-History-Conditions für getrashte Nodes im letzten Runner-Zug, installierte Resources im letzten Runner-Zug und Run-Versuche im gesamten Spiel.
- Trace-Erfolg `add_tags_by_trace_margin_over_runner_link`.
- Trace-Erfolg `trash_runner_resource_and_add_tag` mit LegalAction-basierter Zielauswahl und erneuter Revalidierung in `applyAction`.
- Deklaratives Zusatzkostenmodell für Operation-Traces mit Kosten pro Base-Trace-Punkt über 0.

## Harness-Zahlen

- Vorher: 154 Proteus-Karten, 62 implementiert, 92 fehlend, 0 Drift-/Konsistenzfehler.
- Nachher: 154 Proteus-Karten, 67 implementiert, 87 fehlend, 0 Drift-/Konsistenzfehler.

Keine PRO007-Karte wurde `deck_legal`, `format_legal` oder `ai_supported`.
