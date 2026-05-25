---
activityId: act-2026-05-24-proteus-phase-8c-viral-breeding-ground-agenda
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
releaseTarget: Proteus Phase 8c
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/agendas/viral-breeding-ground.ts
  - packages/engine/src/game/counters/proteus-viral-breeding-ground.test.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
  - docs/releases/proteus/virus-antibody-counter-contract.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/counters/proteus-viral-breeding-ground.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/access/access-effect-handlers.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles CardImplementation coverage"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - git diff --check
---

# Proteus Phase 8c: Viral Breeding Ground Agenda

## Ziel

`Viral Breeding Ground` mit agenda-basierter Virus-/Counter-Erzeugung und Interaktion zur Purge-Grundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8c Viral Breeding Ground Agenda`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- Agenda-/Access-/Scored-Fenster aus bisherigen Release-Slices.

## Zielkarten

- `onr_proteus_009_viral-breeding-ground` Viral Breeding Ground

## Scope

- Agenda-basierte Virus-/Counter-Erzeugung.
- Scored-/Access-Fenster.
- Interaktion mit Purge und Runner-Virus-Zählung.

## Nicht im Scope

- Keine Antibody-Assets aus 8b.
- Keine Runner-Virus-Programme aus 8d bis 8f.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [x] Zielkarte besitzt eine eigene CardImplementation-Datei.
- [x] Counter- und Agenda-Fenster sind LegalAction-basiert und replay-stabil.
- [x] Hidden-Info- und PlayerView/PublicPayload-Redaction sind geprüft.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Phase 8c ist umgesetzt: `Viral Breeding Ground` besitzt eine eigene CardImplementation-Datei und nutzt generische Engine-Bausteine für Score-Fort-Trash sowie eine Corp-Access-Choice, die bis zu zwei installierte Runner-Programme pro Advancement-Counter in die Grip zurückgibt. Hosted Programs auf zurückgegebenen Daemon-/Host-Programmen werden deterministisch getrasht. PublicPayloads liefern Counts und nur öffentliche Definition-IDs; Replay-/StateHash-Stabilität ist durch fokussierte Tests belegt.
