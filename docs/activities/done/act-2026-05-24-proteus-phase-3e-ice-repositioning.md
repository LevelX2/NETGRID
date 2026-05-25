---
activityId: act-2026-05-24-proteus-phase-3e-ice-repositioning
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
releaseTarget: Proteus Phase 3e
blockedBy:
  - act-2026-05-24-proteus-phase-3a-variable-ice-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/ice/mobile-barricade.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/walking-wall.ts
  - packages/engine/src/index.ts
  - packages/engine/src/game/view/card-view.ts
  - data/scenarios/proteus-phase-3e-ice-repositioning-smoke-2026-05-24.json
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 3e"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 3e"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 3e"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web typecheck
  - node -e "for (const f of ['data/manifests/proteus-card-support.json','data/scenarios/proteus-phase-3e-ice-repositioning-smoke-2026-05-24.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); console.log(f); }"
  - git diff --check
---

# Proteus Phase 3e: ICE Repositioning

## Zielkarten

- `onr_proteus_033_mobile-barricade` Mobile Barricade
- `onr_proteus_044_walking-wall` Walking Wall

## Scope

- ICE-Bewegung und Reordering in Servern.
- Positions-Revalidierung und öffentliche Bewegungsdaten ohne Hidden-Info-Leak.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [x] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [x] ICE-Positionen werden stale-/side-sicher revalidiert.
- [x] PlayerViews, PublicEvents, Replay und StateHash bleiben konsistent.

## Ergebnisnotiz

Umgesetzt als generisches Fort-Run-Window `move_self_to_different_position_on_same_fort` für Start-of-run-ICE-Repositionierung im angegriffenen Fort. Mobile Barricade und Walking Wall haben eigene CardImplementation-Dateien; unrezzed Nutzung setzt den bestehenden `faceup`-Reveal-Zustand ohne Rez, Runner-PlayerViews zeigen danach nur die revealed Quelle. `applyAction` revalidiert Side, StateVersion, Kosten, Source-/Zielposition, Fortbindung und Once-per-run-Source-Verbrauch; Action-IDs enthalten Source-/Target-ICE-Positionen, damit mehrere Reposition-Ziele nicht kollidieren.
