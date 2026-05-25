---
activityId: act-2026-05-24-proteus-phase-3b-variable-cost-strength-subtype-ice
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
releaseTarget: Proteus Phase 3b
blockedBy:
  - act-2026-05-24-proteus-phase-3a-variable-ice-foundation
resultArtifacts: []
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 3b"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 3b"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 3b"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web typecheck
  - node JSON parse data/manifests/proteus-card-support.json and data/scenarios/proteus-phase-3b-variable-cost-strength-subtype-ice-smoke-2026-05-24.json
  - git diff --check
---

# Proteus Phase 3b: Variable Cost/Strength/Subtype ICE

## Zielkarten

- `onr_proteus_013_caryatid` Caryatid
- `onr_proteus_017_credit-blocks` Credit Blocks
- `onr_proteus_023_galatea` Galatea
- `onr_proteus_024_gatekeeper` Gatekeeper
- `onr_proteus_025_homing-missile` Homing Missile
- `onr_proteus_028_lesser-arcana` Lesser Arcana
- `onr_proteus_036_sandstorm` Sandstorm
- `onr_proteus_039_sphinx-2006` Sphinx 2006
- `onr_proteus_040_sumo-2008` Sumo 2008

## Scope

- Variable Stärke, variable ETR-/Trace-Subroutinen und alternative Subtypen auf der generischen Phase-3a-Familie.
- Effektive Break-Projektion und Trace-Erweiterung nur kartenunabhängig.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] Variable Werte/Subtypen/Subroutinen sind LegalAction- und StateHash-stabil.
- [ ] PublicPayloads leaken keine unrezzed ICE-Identitäten.

## Ergebnisnotiz

Fertig umgesetzt.

- Alle neun Zielkarten haben eigene Proteus-CardImplementation-Dateien.
- `variableRez` unterstützt jetzt generisch `alternate_subtype`, wiederverwendete bezahlte ETR-Subroutinen und X-Stärke mit optionaler Trace-Basis/Trace-Limit-Projektion.
- Effektive öffentliche ICE-Subtypen werden in PlayerViews und Breaker-Matching aus `variableIceState.selectedSubtypes` gelesen.
- Homing Missile speichert X als Stärke, Trace-Basis und Trace-Bid-Limit.
- LegalAction-/`applyAction`-Revalidierung, PublicPayload-Redaction, Replay und StateHash sind durch gezielte Engine-Tests nachgewiesen.
