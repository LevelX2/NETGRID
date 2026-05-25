---
activityId: act-2026-05-24-proteus-phase-8f-random-bad-publicity-virus-longtail
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 8f
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts: []
checks: []
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

- [ ] Beide Zielkarten besitzen eigene CardImplementation-Dateien.
- [ ] Random-Effekte nutzen Seed, RandomCounter und RandomDrawRecords.
- [ ] Bad-Publicity- und Virus-/Purge-Interaktionen sind gate-konform getestet.
- [ ] PublicPayload/Replays leaken keine privaten Kandidatenlisten.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
