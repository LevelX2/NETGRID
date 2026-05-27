---
activityId: act-2026-05-26-proteus-pro006-simple-corp-ice-resolver
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-26
startedAt: 2026-05-26
completedAt: 2026-05-26
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO006
proReferences:
  - PRO006
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/ice/brain-wash.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/colonel-failure.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/misleading-access-menus.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/snowbank.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/card-implementations/coverage.test.ts
  - packages/engine/src/index.test.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-6b-corp-ice-simple-resolver.md
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Proteus PRO006\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"Proteus PRO006\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "git diff --check"
---

# Proteus PRO006: Simple Corp ICE Resolver

## Ziel

Die vier einfachen Corp-ICE-Resolver aus PRO006 als konkrete Proteus-CardImplementation-Dateien umsetzen, ohne die verbleibenden Phase-6b-Karten freizugeben.

## Ergebnisnotiz

Abgeschlossen am 2026-05-26.

`Brain Wash` nutzt den generischen Printed-Subroutine-Pfad `damage` mit `damageType: brain` und `amount: 1`. `Colonel Failure` nutzt drei unmittelbare `trash_program`-Printed-Subroutinen und zwei `end_the_run`-Printed-Subroutinen in Kartentextreihenfolge. `Misleading Access Menus` und `Snowbank` nutzen je eine `end_the_run_unless_runner_pays`-Printed-Subroutine mit Kosten 1 und den generischen Lifecycle-Hook `on_rez` mit `gain_credits` 3 für die Corp.

Ergänzt wurde nur der generische Mapping-Zweig, der deklarative Printed-Subroutinen `end_the_run_unless_runner_pays` in Engine-Subroutinen übersetzt. Brain damage, immediate `trash_program` und Lifecycle-`on_rez`-Credit-Gain waren bereits generisch vorhanden und wurden wiederverwendet.

Alle vier Karten sind registriert, in der Coverage als `implemented` sichtbar und im Proteus-Manifest `implemented`, `engine_supported`, `playable` und `human_playable`. `deck_legal`, `format_legal` und `ai_supported` bleiben `false`.

Die Phase-6b-Restkarten gehen in PRO010. `Chihuahua`, `Coyote`, `Iceberg` und `Washed-Up Solo Construct` wurden in PRO006 nicht umgesetzt oder freigegeben.
