---
activityId: act-2026-05-28-proteus-pro017-1-action-economy-hardening
status: done
kind: hardening
area: cards
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO017-1
proReferences:
  - PRO017
  - PRO017-1
resultArtifacts:
  - packages/engine/src/index-tests/proteus/action-economy-debt-suite.test.ts
  - packages/engine/src/game/damage/damage-core.ts
  - packages/engine/src/game/choices/pending-choice-resolution.ts
  - packages/engine/src/game/abilities/trigger-ability-execution.ts
  - packages/engine/src/index.ts
  - packages/shared/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/action-economy-debt-suite.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/damage/damage-core.test.ts src/game/corp/scored-agenda-flow.test.ts src/game/corp/scored-agenda-abilities.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/turn/corp-main-actions.test.ts src/game/turn/runner-main-actions.test.ts src/game/events/build-event.test.ts src/game/view/player-view-projection.test.ts src/game/choices/pending-choice-resolution.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
  - PRO017 typo scan across packages, docs, data and KI-Wissen-NETGRID
---

# PRO017-1: Action-Economy-Härtung

## Ergebnis

PRO017-1 härtet den bereits umgesetzten Action-Economy-/Action-Debt-Scope ohne neue Proteus-Kartenpromotion.

- `Please Don't Choke Anyone` ist jetzt Choice-basiert und kein Auto-Replacement mehr. Nach Runner-Replacement-/Prevention-Fenstern öffnet die Korp ein source-bound PDCA-Fenster und entscheidet all-or-nothing pro Damage-Slice, ob der erfolgreiche Korp-Damage normal durchgeht oder vollständig in PDCA-Counter auf der gescorten Agenda umgewandelt wird.
- Turn-bound Extra-Action-Grants erhalten eine Turn-Serial-Bindung und werden beim Seiten-/Zugwechsel sowie im Action-Economy-Compaction-Pfad entfernt. Nicht genutzte optionale und forced Grants können nicht in spätere Züge leaken; verbrauchte Grants werden weiter kompakt entfernt.
- `Bargain with Viacox` kann Roll 6 deterministisch als "nicht möglich" auflösen, wenn die zufällig bestimmte Grip-Karte nicht legal spiel- oder installierbar ist. Der Resolve entfernt den forced Grant replay-stabil und ohne verdeckte Grip-Kartenidentität in PublicPayloads oder PlayerViews.

## Nachweis

- Proteus-Harness bleibt unverändert: 154 total, 144 implemented, 10 missing, 0 Drift.
- Keine Decklegalität, Formatlegalität oder AI-Unterstützung wurde aktiviert.
