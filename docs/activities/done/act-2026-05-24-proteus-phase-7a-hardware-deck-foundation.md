---
activityId: act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 7a
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/hardware/deck-the.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Deck, The"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles CardImplementation coverage"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - rg onr_proteus_138/Deck, The/deck-the in engine/shared/manifest/release/activity surfaces
  - git diff --check
---

# Proteus Phase 7a: Hardware/Deck Foundation

## Ziel

Die Deck-Hardware-Grundlage für `Deck, The` oder foundation-only umsetzen und klären, ob Base-Link/Trace in 7d getrennt bleiben muss.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7a Hardware/Deck Foundation`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 7.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Bestehende Hardware-, Modifier-, Unique- und Restricted-Credit-CardImplementations.

## Zielkarten

- `onr_proteus_138_deck-the` Deck, The, falls die vorhandene Grundlage reicht.

## Scope

- Deck-Hardware-Einzigartigkeit.
- Deterministisches Trashen älterer Deck-Hardware beim Installieren eines neuen Decks.
- MU-/Hand-/Link-Modifier und source-bound Zustand, soweit für `Deck, The` nötig.
- Kein Proteus-ID-Branch außerhalb deklarativer CardImplementation.

## Nicht im Scope

- Keine Icebreaker-/Program-Restricted-Credit-Decks aus 7b.
- Keine Damage-/Prevention-Hardware aus 7c.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [x] `Deck, The` besitzt eine eigene CardImplementation-Datei oder der Foundation-only-Blocker ist dokumentiert.
- [x] Deck-Einzigkeit, Trash-Reihenfolge und Modifier-Cleanup sind LegalAction-/`applyAction`-seitig abgesichert.
- [x] MU-/Hand-/Link-Projektion ist public-safe und replay-/statehash-stabil.
- [x] Wrong-Side-, stale-action-, Kosten-, Ziel- und Hidden-Info-Tests sind vorhanden.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Umgesetzt. `Deck, The` nutzt eine eigene CardImplementation-Datei mit generischem `hardwareDeck: true`, öffentlichem +1-MU-Modifier sowie den bestehenden Base-Link- und Trace-Link-Ability-Bausteinen. Der Slice deckt den Base-Link-/Trace-Anteil bereits mit ab; 7d kann bei Bearbeitung als Nachweis-/No-op-Slice abgeschlossen werden, sofern keine weiteren Link-Anforderungen auftauchen.
