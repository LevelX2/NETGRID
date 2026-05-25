---
activityId: act-2026-05-24-proteus-phase-3c-relative-board-count-ice
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
releaseTarget: Proteus Phase 3c
blockedBy:
  - act-2026-05-24-proteus-phase-3a-variable-ice-foundation
resultArtifacts: []
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 3c"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 3c"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 3c"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web typecheck
  - node JSON parse data/manifests/proteus-card-support.json and data/scenarios/proteus-phase-3c-relative-board-count-ice-smoke-2026-05-24.json
  - git diff --check
---

# Proteus Phase 3c: Relative/Board-Count ICE

## Zielkarten

- `onr_proteus_012_bug-zapper` Bug Zapper
- `onr_proteus_021_dog-pile` Dog Pile
- `onr_proteus_026_hunting-pack` Hunting Pack
- `onr_proteus_030_mastermind` Mastermind

## Scope

- Öffentliche Zählfunktionen für installierte/gerezzte ICE und relative Boardzustände.
- StateHash-stabile effektive Werte ohne Leaks unrezzter Identitäten.

## Nicht im Scope

- Keine Repositionierung oder Hidden-Resource-Mechaniken.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] Zählwerte werden generisch berechnet und in LegalActions/Views konsistent genutzt.
- [ ] Hidden-Info-Grenzen für unrezzed ICE bleiben gewahrt.

## Ergebnisnotiz

Fertig umgesetzt.

- Alle vier Zielkarten haben eigene Proteus-CardImplementation-Dateien.
- Die generische `relativeIce`-Familie zählt nur gerezzte ICE außerhalb der aktuellen ICE im selben Fort.
- Bug Zapper, Dog Pile und Mastermind nutzen die Zählung für dynamische Schaden-Subroutinen.
- Dog Pile und Mastermind nutzen dieselbe Zählung für effektive öffentliche Stärke.
- Hunting Pack erzeugt pro gezählter ICE eine öffentliche Trace-5-Tag-Subroutine.
- Hidden-Info-Grenzen, Replay und StateHash sind durch gezielte Engine-Tests abgedeckt.
