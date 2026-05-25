---
activityId: act-2026-05-24-proteus-phase-8d-runner-virus-run-counters
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
releaseTarget: Proteus Phase 8d
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/highlighter.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/taxman.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/vienna-22.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/viral-pipeline.ts
  - packages/engine/src/game/run/run-end-cleanup.ts
  - packages/engine/src/game/access/breach-state.ts
  - packages/engine/src/index.ts
  - packages/shared/src/index.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
  - docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
  - docs/releases/proteus/mechanics-coverage-analysis.md
  - docs/releases/proteus/virus-antibody-counter-contract.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/run-end-cleanup.test.ts src/game/access/breach-state.test.ts src/game/counters/proteus-purge-foundation.test.ts src/card-implementations/coverage.test.ts -t "Proteus|breach state builder|coverage"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/run-end-cleanup.test.ts src/game/access/breach-state.test.ts src/game/counters/proteus-purge-foundation.test.ts src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/shared typecheck
  - Get-Content -Raw data/manifests/proteus-card-support.json | ConvertFrom-Json | Out-Null
  - git diff --check
---

# Proteus Phase 8d: Runner Virus Run Counters

## Ziel

Runner-Virus-Programme mit successful-run-Triggern, zentralen Server-Scopes und purgefähigen Virus-Countern umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8d Runner Virus Run Counters`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- Existing successful-run- und Counter-Muster.

## Zielkarten

- `onr_proteus_090_highlighter` Highlighter
- `onr_proteus_097_taxman` Taxman
- `onr_proteus_098_vienna-22` Vienna 22
- `onr_proteus_099_viral-pipeline` Viral Pipeline

## Scope

- Successful-run-Trigger und zentrale Server-Scopes.
- Virus-Counter-Erzeugung, Cleanup und Purge-Interaktion.
- Public-safe CounterDisplay und Replay-/StateHash-Stabilität.

## Nicht im Scope

- Keine Access-/Trash-Programme aus 8e.
- Keine Random-/Bad-Publicity-Longtails aus 8f.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Successful-run-Trigger sind LegalAction-/Timing-sicher.
- [ ] Purge-Interaktion und CounterDisplay sind getestet.
- [ ] Hidden-Info-, stale-action-, Replay-/StateHash- und Manifest-/Coverage-Nachweise sind vorhanden.

## Ergebnisnotiz

Umgesetzt: `Highlighter`, `Taxman`, `Vienna 22` und `Viral Pipeline` besitzen eigene CardImplementation-Dateien und laufen über generische Successful-Run-Counter-Ziele. Highlighter-/Vienna-Counter erhöhen künftige R&D-/HQ-Access-Mengen ohne Central-Root mitzuzählen, Tax-Counter verursachen Korp-Creditverlust am Zugstart, und komplette Viral-Pipeline-Socket-Sets werden zu purgefähigen Pipe-Countern mit Korp-Action-Debt am Zugstart. Die Counter liegen in der 8a-Taxonomie und werden in PlayerViews/CounterDisplays sowie im bestehenden Proteus-Purge-Pfad berücksichtigt.

Verifiziert: fokussierte Run-End-, Breach-, Purge-/Action-Debt- und Coverage-Tests, Engine-Typecheck, Shared-Typecheck, Manifest-JSON-Parse und `git diff --check` sind grün.

Offen: Phase 8e (`Crumble`, `Garbage In`) und Phase 8f (`Armageddon`, `Scaldan`) bleiben separate Folgeslices; Decklegalität, Formatlegalität und AI-Support wurden nicht geändert.
