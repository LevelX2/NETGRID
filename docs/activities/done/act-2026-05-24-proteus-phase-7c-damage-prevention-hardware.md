---
activityId: act-2026-05-24-proteus-phase-7c-damage-prevention-hardware
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
releaseTarget: Proteus Phase 7c
blockedBy:
  - act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/hardware/cortical-stimulators.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/game/damage/prevention.test.ts
  - packages/shared/src/index.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/damage/prevention.test.ts -t "Cortical Stimulators"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles CardImplementation coverage"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - rg onr_proteus_135/Cortical Stimulators/cortical-stimulators in engine/shared/manifest/release/activity surfaces
  - git diff --check
---

# Proteus Phase 7c: Damage/Prevention Hardware

## Ziel

`Cortical Stimulators` über generische Damage-/Prevention-/Replacement-Hardware-Bausteine umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7c Damage/Prevention Hardware`.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Bestehende `damagePreventionSources`- und Hardware-CardImplementations.

## Zielkarten

- `onr_proteus_135_cortical-stimulators` Cortical Stimulators

## Scope

- Damage-/Prevention-/Replacement-Hardware.
- Turn-/Source-Limits und redigierte Choice-Fenster.
- LegalAction-Projektion und `applyAction`-Revalidierung.

## Nicht im Scope

- Keine Icebreaker-/Program-Restricted-Credit-Decks aus 7b.
- Keine allgemeine Damage-Engine-Neugestaltung.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [x] Die Zielkarte besitzt eine eigene CardImplementation-Datei.
- [x] Prevention-/Replacement-Fenster sind generisch, source-bound und hidden-info-sicher.
- [x] Wrong-Side-, stale-action-, Kosten-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Umgesetzt. `Cortical Stimulators` nutzt eine eigene CardImplementation-Datei mit einer öffentlichen, source-bound `damagePreventionSources`-Quelle für 1 Net- oder core/brain damage pro Zug. Das zweite Damage-Ereignis im selben Zug öffnet kein weiteres Prevention-Fenster.
