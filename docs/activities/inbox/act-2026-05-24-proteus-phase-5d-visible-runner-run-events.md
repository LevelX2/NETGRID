---
activityId: act-2026-05-24-proteus-phase-5d-visible-runner-run-events
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
releaseTarget: Proteus Phase 5d
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 5d: Visible Runner Run Events

## Ziel

Die sichtbaren Proteus-Run-Events über generische `make_run`- und rungebundene Follow-up-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5d Visible Runner Run Events`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Run-/Access-/Expose-/Trash-/Tag-/Damage-Muster.

## Zielkarten

- `onr_proteus_101_all-hands` All-Hands
- `onr_proteus_104_decoy-signal` Decoy Signal
- `onr_proteus_105_demolition-run` Demolition Run
- `onr_proteus_106_disgruntled-ice-technician` Disgruntled Ice Technician
- `onr_proteus_107_drone-for-a-day` Drone for a Day
- `onr_proteus_120_reconnaissance` Reconnaissance
- `onr_proteus_121_remote-detonator` Remote Detonator
- `onr_proteus_122_rush-hour` Rush Hour
- `onr_proteus_127_weefle-initiation` Weefle Initiation

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- `make_run`-Erweiterungen, rungebundene Follow-up-Flags, Expose-/Trash-/Tag-/Damage-/Access-Folgefenster und Run-End-Cleanup.
- Keine Regelautorität außerhalb der Engine.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine einfachen Economy-/Draw-Karten aus Phase 5c.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Runstart, Runziel, Folgeflags und Cleanup sind deterministisch und revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
