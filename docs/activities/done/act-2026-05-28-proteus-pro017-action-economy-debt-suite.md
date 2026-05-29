---
activityId: act-2026-05-28-proteus-pro017-action-economy-debt-suite
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
releaseTarget: Proteus PRO017
proReferences:
  - PRO017
resultArtifacts:
  - packages/engine/src/index-tests/proteus/action-economy-debt-suite.test.ts
  - packages/engine/src/card-implementations/proteus/corp/agendas/ai-board-member.ts
  - packages/engine/src/card-implementations/proteus/corp/agendas/please-dont-choke-anyone.ts
  - packages/engine/src/card-implementations/proteus/corp/agendas/project-venice.ts
  - packages/engine/src/card-implementations/proteus/corp/operations/corporate-guard-r-temps.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/bargain-with-viacox.ts
  - packages/engine/src/card-implementations/proteus/runner/hardware/lucidrinetm-drip-feed.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/action-economy-debt-suite.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
---

# PRO017: Action Economy / Action Debt Suite

## Ergebnis

PRO017 setzt sechs Proteus-Karten vollständig als CardImplementation-Dateien um:

- `onr_proteus_001_ai-board-member`
- `onr_proteus_006_please-dont-choke-anyone`
- `onr_proteus_007_project-venice`
- `onr_proteus_046_corporate-guard-r-temps`
- `onr_proteus_131_bargain-with-viacox`
- `onr_proteus_144_lucidrinetm-drip-feed`

Der Slice ergänzt generische, statehash-relevante Action-Economy-Fakten für optionale restricted extra actions, forced runner actions, future action grants und Corp-Credit-Forfeit-Debt. Die Implementierungszählung steigt auf 144/154; 10 Proteus-Karten fehlen weiterhin. Decklegalität, Formatlegalität und AI-Support bleiben false.

## Nachweis

- Proteus-Harness: 154 total, 144 implemented, 10 missing, 0 Drift.
- PRO017-Fokustests decken AI-Board-Member-Würfelgruppen, PDCA-Counter, Project-Venice-Overadvance, Corporate-Guard-X/Debt, Viacox-d6-Forced-Actions und Lucidrine-Drip-Counter/Core-Damage ab.
