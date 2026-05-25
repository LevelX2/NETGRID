---
activityId: act-2026-05-24-proteus-phase-8e-virus-access-trash-program-effects
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
releaseTarget: Proteus Phase 8e
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/crumble.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/garbage-in.ts
  - packages/engine/src/game/access/access-actions.ts
  - packages/engine/src/game/access/access-flow.ts
  - packages/engine/src/game/run/run-end-cleanup.ts
  - packages/shared/src/index.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
  - docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
  - docs/releases/proteus/mechanics-coverage-analysis.md
  - docs/releases/proteus/virus-antibody-counter-contract.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/run-end-cleanup.test.ts src/game/access/access-actions.test.ts src/game/access/access-flow.test.ts src/card-implementations/coverage.test.ts -t "Proteus|access action generation|access flow execution|coverage"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/run-end-cleanup.test.ts src/game/access/access-actions.test.ts src/game/access/access-flow.test.ts src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/shared typecheck
  - Get-Content -Raw data/manifests/proteus-card-support.json | ConvertFrom-Json | Out-Null
  - git diff --check
---

# Proteus Phase 8e: Virus Access/Trash/Program Effects

## Ziel

Virus-Programme mit Access-Modifikatoren, Trash-Rechten und programgebundenen Countern umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8e Virus Access/Trash/Program Effects`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- Bestehende Access-/Trash-/Counter-Muster.

## Zielkarten

- `onr_proteus_084_crumble` Crumble
- `onr_proteus_089_garbage-in` Garbage In

## Scope

- Access-Modifikatoren und Trash-Rechte.
- Programgebundene Counter.
- Öffentliche Zugriffsergebnisse ohne private Queue-Leaks.

## Nicht im Scope

- Keine Run-Counter-Programme aus 8d.
- Keine Random-/Bad-Publicity-Longtails aus 8f.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Beide Zielkarten besitzen eigene CardImplementation-Dateien.
- [ ] Access-/Trash-Choices sind LegalAction-basiert und `applyAction`-revalidiert.
- [ ] PublicEvent/PlayerView/Replays leaken keine privaten Access-Queue-Inhalte.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Umgesetzt: `Crumble` und `Garbage In` besitzen eigene CardImplementation-Dateien und erzeugen über den generischen Successful-Run-Counter-Pfad purgefähige `crumble`-/`garbage`-Counter. Der Access-Pfad projiziert kostenlose Trash-Actions für den aktuell accesseten HQ-/R&D-Content, inklusive tatsächlich accesseter Central-Root-Upgrades; Garbage-In-Verwendung verbraucht deterministisch zwei `garbage`-Counter in derselben Action-Auflösung.

Verifiziert: fokussierte Run-End-, Access-Action-, Access-Flow- und Coverage-Tests, Engine-Typecheck, Shared-Typecheck, Manifest-JSON-Parse und `git diff --check` sind grün.

Offen: Phase 8f (`Armageddon`, `Scaldan`) bleibt separater Random-/Bad-Publicity-Folgeslice; Decklegalität, Formatlegalität und AI-Support wurden nicht geändert.
