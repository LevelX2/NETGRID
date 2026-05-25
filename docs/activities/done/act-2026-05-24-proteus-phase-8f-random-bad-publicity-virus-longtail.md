---
activityId: act-2026-05-24-proteus-phase-8f-random-bad-publicity-virus-longtail
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
releaseTarget: Proteus Phase 8f
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/armageddon.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/scaldan.ts
  - packages/engine/src/game/run/successful-run-interventions.ts
  - packages/engine/src/game/run/run-end-cleanup.ts
  - packages/engine/src/game/counters/proteus-purge-foundation.test.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/virus-antibody-counter-contract.md
checks:
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/successful-run-interventions.test.ts src/game/run/run-end-cleanup.test.ts src/game/counters/proteus-purge-foundation.test.ts src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/shared typecheck
  - node -e "JSON.parse(require('fs').readFileSync('data/manifests/proteus-card-support.json','utf8')); console.log('json ok')"
---

# Proteus Phase 8f: Random/Bad-Publicity Virus Longtail

## Ziel

`Armageddon` und `Scaldan` mit RandomDrawRecords, Bad-Publicity-Reuse und Virus-/Purge-Interaktion umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8f Random/Bad-Publicity Virus Longtail`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- `docs/releases/proteus/bad-publicity-loss-gate-contract.md`.
- Bestehende RandomDrawRecords- und Bad-Publicity-Gates.

## Zielkarten

- `onr_proteus_078_armageddon` Armageddon
- `onr_proteus_094_scaldan` Scaldan

## Scope

- RandomDrawRecords, Seed und RandomCounter.
- Bad-Publicity-Reuse aus Phase 2.
- Virus-/Purge-Interaktion und replay-/statehash-stabile Zufallsfolgen.

## Nicht im Scope

- Keine allgemeine Random-Phase-9-Arbeit außerhalb dieser Zielkarten.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [x] Beide Zielkarten besitzen eigene CardImplementation-Dateien.
- [x] Random-Effekte nutzen Seed, RandomCounter und RandomDrawRecords.
- [x] Bad-Publicity- und Virus-/Purge-Interaktionen sind gate-konform getestet.
- [x] PublicPayload/Replays leaken keine privaten Kandidatenlisten.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Abgeschlossen. `Armageddon` und `Scaldan` sind als eigene CardImplementation-Dateien registriert und im Manifest als `human_playable` umgesetzt, ohne Decklegalität, Formatlegalität oder AI-Support zu ändern. `Armageddon` nutzt ein generisches R&D-Successful-Run-Followup für Doom-Counter statt Access sowie deterministic Corp-Install-Doom-Würfe über `RandomDrawRecords`; Hidden-Install-PublicEvents bleiben redigiert. `Scaldan` nutzt den generischen Successful-Run-Counter-Pfad auf HQ und löst am Korp-Start-of-turn deterministic Würfe aus, die das vorhandene `bad_publicity_7`-Gate erreichen können. Replay-/StateHash-Stabilität, Wrong-Side-Revalidierung, RandomDrawRecords und Registry-/Coverage-/Manifest-Nachweise sind getestet.
