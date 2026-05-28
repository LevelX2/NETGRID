---
activityId: act-2026-05-28-proteus-pro016-random-dice-encounter-suite
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
releaseTarget: Proteus PRO016
proReferences:
  - PRO016
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/forwards-legacy.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/roadblock.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/executive-boot-camp.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/lisa-blight.ts
  - packages/engine/src/index-tests/proteus/random-dice-encounter-suite.test.ts
  - docs/activities/done/act-2026-05-28-proteus-pro016-random-dice-encounter-suite.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/random-dice-encounter-suite.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts src/game/run/encounter-entry.test.ts src/game/run/encounter-actions.test.ts src/game/run/encounter-resolution.test.ts src/game/run/run-end-cleanup.test.ts src/game/run/run-core-execution.test.ts src/game/run/run-rez-window.test.ts src/game/card-implementation/card-implementation-runtime-deps.test.ts
---

# Proteus PRO016: Random/Dice/Encounter Suite

## Ergebnis

PRO016 ist umgesetzt. `Forward's Legacy`, `Roadblock`, `Executive Boot Camp` und `Lisa Blight` besitzen konkrete CardImplementation-Dateien, sind registriert und im Proteus-Manifest als engine-/human-playable markiert.

Der Harness steht nach Umsetzung bei 154 Proteus-Karten, 138 konkreten Implementierungen, 16 fehlenden Implementierungen und 0 Drift. Keine der vier Karten wurde decklegal, formatlegal oder AI-unterstützt.

## Generische Bausteine

- Encounter-Entry-Würfel für ICE mit deterministischem d6, encountergebundenem Strength-Modifier oder Derez plus automatischem Passieren.
- Random-HQ-Discard als aktivierte Korp-Kosten mit RandomDrawRecord und Hidden-Info-Redaction.
- Rungebundene temporäre Korp-Credits für Korp-Kosten während des aktuellen Runs.
- Rungebundene Subroutine-Copy-Ziele für ICE im selben Fort mit Revalidierung von Fort, ICE und Subroutine.

## Tests

Die neue Suite `random-dice-encounter-suite.test.ts` deckt Run-Start-Würfel, Roadblock-Encounter-Würfel, Random-HQ-Discard, temporäre Korp-Run-Credits, Lisa-Blight-Zielauswahl und Replay/StateHash-Stabilität ab. Die Coverage-Reconciliation bestätigt 154/138/16 ohne Drift.
