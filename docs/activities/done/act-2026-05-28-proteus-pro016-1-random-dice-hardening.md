---
activityId: act-2026-05-28-proteus-pro016-1-random-dice-hardening
status: done
kind: hardening
area: cards
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO016-1
proReferences:
  - PRO016
  - PRO016-1
resultArtifacts:
  - packages/engine/src/ability-engine/card-implementation-runtime.ts
  - packages/engine/src/ability-engine/additional-subroutine-modifiers.ts
  - packages/engine/src/game/view/visible-run-quote.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/executive-boot-camp.ts
  - packages/engine/src/index-tests/proteus/random-dice-encounter-suite.test.ts
  - docs/activities/done/act-2026-05-28-proteus-pro016-1-random-dice-hardening.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/random-dice-encounter-suite.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/run-end-cleanup.test.ts src/game/run/run-core-execution.test.ts src/game/run/encounter-entry.test.ts src/game/run/encounter-actions.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/encounter-resolution.test.ts src/game/card-implementation/card-implementation-runtime-deps.test.ts src/game/run/run-flow-hosts.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
  - rg -n "Executive Boot Camp|Lisa Blight|corpRunTemporaryCredits|corp_costs_during_this_run|copy_same_fort_ice_subroutine_for_run|encounterAdditionalSubroutines|PRO016-1|PROO16|PROD016|PRO 016" packages docs data KI-Wissen-NETGRID -S
---

# Proteus PRO016-1: Random/Dice Hardening

## Ergebnis

PRO016-1 ist als gezielte Härtung des bereits umgesetzten PRO016-Scope erledigt. Es wurden keine neuen Proteus-Karten implementiert, keine Manifest-Freigaben geöffnet und keine `deck_legal`-, `format_legal`- oder `ai_supported`-Flags geändert.

Der Harness bleibt bei 154 Proteus-Karten, 138 konkreten Implementierungen, 16 fehlenden Implementierungen und 0 Drift.

## Semantikentscheidungen

- `Executive Boot Camp`: `corp_costs_during_this_run` bleibt bewusst breit. Die 2 temporären Korp-Credits dürfen für generische Korp-Kosten verwendet werden, die über den aktuellen Run-Payment-Kontext laufen. Nicht ausgegebene Credits werden am Run-Ende aus `corp.credits` zurückgegeben und der Run-Pool existiert danach nicht mehr.
- `Lisa Blight`: Mehrfachnutzung der Karte bleibt grundsätzlich möglich, aber dieselbe Quellen-/Ziel-ICE-/Original-Subroutine-Kombination darf im selben Run nicht doppelt denselben Copy-Record erzeugen. Andere Quellen oder andere Subroutinen bleiben generisch deterministisch.

## Tests

`random-dice-encounter-suite.test.ts` deckt zusätzlich ab:

- Executive-Boot-Camp-Credits werden gewährt, im Run für einen Korp-Kostenpfad verbraucht, am Run-Ende bereinigt und nach Run-Ende nicht erneut angeboten.
- Random-HQ-Discard leakt keine verdeckte HQ-Kartendefinition in PublicPayload oder RunnerView.
- Lisa-Blight-Kopien erscheinen in der effektiven ICE-Quote direkt nach der Original-Subroutine.
- Lisa-Blight-Kopien sind rungebunden, falsches Fort bleibt illegal, leeres HQ bleibt illegal und stale identische Duplikat-Ziele werden abgewiesen.
