---
activityId: act-2026-05-28-proteus-pro018-hidden-zone-search-install-tutor-suite
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
releaseTarget: Proteus PRO018
proReferences:
  - PRO018
resultArtifacts:
  - packages/engine/src/index-tests/proteus/hidden-zone-search-install-tutor.test.ts
  - packages/engine/src/card-implementations/proteus/runner/events/hijack.ts
  - packages/engine/src/card-implementations/proteus/runner/events/test-spin.ts
  - data/manifests/proteus-card-support.json
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-9c-hidden-zone-search-install-tutor.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-zone-search-install-tutor.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-zone-search-install-tutor.test.ts src/game/hidden-zone/search-install-intents.test.ts src/game/hidden-zone/search-choice-handlers.test.ts src/game/hidden-zone/runner-stack-shuffle.test.ts src/game/run/run-end-cleanup.test.ts src/game/run/run-core-execution.test.ts src/game/run/run-flow-hosts.test.ts src/game/damage/damage-core.test.ts src/game/view/hidden-info.test.ts src/game/replay.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# PRO018: Hidden-Zone Search/Install Tutor Suite

## Ergebnis

PRO018 setzt zwei Proteus-Karten vollständig als CardImplementation-Dateien um:

- `onr_proteus_110_hijack`
- `onr_proteus_126_test-spin`

Der Slice ergänzt einen engen wiederverwendbaren Engine-Vertrag für runnerprivate Hidden-Zone-Installationschoices:

- `Hijack` ist keine Stack-Search-Karte; es installiert ein legales Programm oder eine Hardware aus der Runner-Grip und stellt genau 3 temporäre Credits nur für diese Installationskosten bereit.
- `Test Spin` sucht ein Programm im Runner-Stack, installiert es kostenlos, shufflet deterministisch, startet den gewählten Run und löst nach dem Run Return-to-Stack oder den Verlust-/Meat-Damage-Penalty-Pfad aus.

Die Grip-/Stack-Kandidaten bleiben side-privat; PublicPayloads geben nur rechtmäßig öffentliche Ergebnisfelder weiter. Decklegalität, Formatlegalität und AI-Support bleiben false.

## Nachweis

- Proteus-Harness: 154 total, 146 implemented, 8 missing, 0 Drift.
- PRO018-Fokustests decken Happy Paths, wrong side, stale action, illegale Choice, Hidden-Info-Redaction, deterministisches Shuffle, Return/Penalty und Replay/StateHash ab.
