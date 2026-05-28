---
activityId: act-2026-05-28-proteus-pro017-2-pdca-damage-timing-hardening
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
releaseTarget: Proteus PRO017-2
proReferences:
  - PRO017
  - PRO017-2
resultArtifacts:
  - packages/engine/src/game/damage/damage-core.ts
  - packages/engine/src/game/run/encounter-printed-effects.ts
  - packages/engine/src/game/run/run-flow-hosts.ts
  - packages/engine/src/game/card-implementation/damage-runtime-deps.ts
  - packages/engine/src/index-tests/proteus/action-economy-debt-suite.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/action-economy-debt-suite.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/damage/damage-core.test.ts src/game/corp/scored-agenda-flow.test.ts src/game/corp/scored-agenda-abilities.test.ts src/game/run/encounter-printed-effects.test.ts src/game/run/encounter-resolution.test.ts src/game/run/run-flow-hosts.test.ts src/game/run/run-core-execution.test.ts src/game/events/build-event.test.ts src/game/view/player-view-projection.test.ts src/game/choices/pending-choice-resolution.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
  - PRO017 typo scan across packages, docs, data and KI-Wissen-NETGRID
---

# PRO017-2: PDCA Damage Timing Hardening

## Ergebnis

PRO017-2 härtet `Please Don't Choke Anyone` ohne neue Proteus-Kartenpromotion.

- PDCA speichert beim Öffnen des Damage-Replacement-Fensters den ursprünglichen `phase`-, `timingPoint`- und `activeSide`-Kontext und stellt ihn nach `pass` und `replace` wieder her.
- Bei Flatline bleibt der Game-End-Kontext erhalten: `phase = game_over`, `winner = corp`, `gameEndReason = flatline`.
- PDCA hängt jetzt am gemeinsamen Damage-Resolution-Fenster und greift konsistent nach bestehenden Replacement-/Event-Modification-Fenstern für verbleibenden erfolgreichen Corp-Damage, unter anderem in Operation-, Scored-Agenda-, Trace- und Encounter-/Printed-Subroutine-Pfaden.
- Runner-self-Damage und unpreventable Core-Damage, insbesondere `Lucidrine™ Drip Feed`, öffnen kein PDCA-Fenster.

## Nachweis

- Proteus-Harness bleibt unverändert: 154 total, 144 implemented, 10 missing, 0 Drift.
- Keine Decklegalität, Formatlegalität oder AI-Unterstützung wurde aktiviert.
