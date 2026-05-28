---
activityId: act-2026-05-28-proteus-pro014-corp-asset-upgrade-utility-suite
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO014
proReferences:
  - PRO014
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/assets/cybertech-think-tank.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/department-of-misinformation.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/government-contract.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/ldl-traffic-analyzers.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/siren.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/syd-meyer-superstores.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/panic-button.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/raymond-ellison.ts
  - packages/engine/src/index-tests/proteus/corp-asset-upgrade-utility.test.ts
  - data/manifests/proteus-card-support.json
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/corp-asset-upgrade-utility.test.ts"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "git diff --check"
---

# PRO014: Proteus Corp Asset/Upgrade Utility Suite

## Ergebnis

PRO014 implementiert acht Proteus-Corp-Asset-/Upgrade-Karten:

- `onr_proteus_055_cybertech-think-tank` Cybertech Think Tank
- `onr_proteus_056_department-of-misinformation` Department of Misinformation
- `onr_proteus_059_government-contract` Government Contract
- `onr_proteus_061_ldl-traffic-analyzers` LDL Traffic Analyzers
- `onr_proteus_067_panic-button` Panic Button
- `onr_proteus_071_raymond-ellison` Raymond Ellison
- `onr_proteus_074_siren` Siren
- `onr_proteus_076_syd-meyer-superstores` Syd Meyer Superstores

Der Proteus-Harness steht danach bei 154 total, 129 implementiert, 25 fehlend und 0 Drift. Keine der Karten wurde `deck_legal`, `format_legal` oder `ai_supported` gesetzt.

## Neue Bausteine

- HQ-Installbindung für Corp-Root-Karten.
- Corp-Aktivierungsfenster während Runs und Trace-Fenstern.
- Temporäre Corp-Credit-Pools für Install/Rez, Trace und Run mit deterministischem Cleanup.
- Start-of-run-Redirect auf Sirens Fort.
- Zielwahl für eigenes rezzed ICE und Trash-zu-Archives mit öffentlichem Payload.
