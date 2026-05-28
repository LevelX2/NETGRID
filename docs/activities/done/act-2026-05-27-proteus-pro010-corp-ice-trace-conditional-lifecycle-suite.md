---
activityId: act-2026-05-27-proteus-pro010-corp-ice-trace-conditional-lifecycle-suite
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO010
proReferences:
  - PRO010
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/ice/chihuahua.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/coyote.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/iceberg.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/washed-up-solo-construct.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/datacomb.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/death-yo-yo.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/marionette.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/scaffolding.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/tumblers.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/twisty-passages.ts
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/variable-ice.test.ts -t \"PRO010\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
---

# Proteus PRO010: Corp ICE Trace/Conditional/Lifecycle Suite

## Ergebnis

PRO010 ist umgesetzt. Die zehn Zielkarten sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable:

- `Chihuahua`
- `Coyote`
- `Iceberg`
- `Washed-Up Solo Construct`
- `Datacomb`
- `Death Yo-Yo`
- `Marionette`
- `Scaffolding`
- `Tumblers`
- `Twisty Passages`

## Neue generische Bausteine

- Preventable Net-Damage als Trace-Erfolg.
- Runner-pay-or-trash-program-Subroutine.
- Run-Future-ICE-Strength-Bonus mit Runner-Zahlungsfenster beim Passieren der Quelle.
- Korp-Post-Pass-ICE-zurück-nach-HQ-Fenster mit Pflichtzahlung oder optionalem Credit-Gain.

## Nachweis

Der Proteus-Harness steht nach PRO010 bei 154 Karten total, 97 implementiert, 57 fehlend und 0 Drift/Konsistenzfehlern. Keine Zielkarte wurde decklegal, formatlegal oder AI-unterstützt.
