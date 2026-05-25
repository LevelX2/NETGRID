---
activityId: act-2026-05-24-proteus-phase-6e-runner-agenda-overadvance-events
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
releaseTarget: Proteus Phase 6e
blockedBy:
  - act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline
resultArtifacts: []
checks: []
---

# Proteus Phase 6e: Runner Agenda/Overadvance Events

## Ziel

Die Runner-Events mit Agenda-, Run- und Overadvance-Bezug nach der Agenda-Baseline aus Phase 6a umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `6e Runner Agenda/Overadvance Events`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Phase 6a Agenda-/Steal-/Overadvance-Baseline.

## Zielkarten

- `onr_proteus_102_blackmail` Blackmail
- `onr_proteus_116_pirate-broadcast` Pirate Broadcast
- `onr_proteus_119_promises-promises` Promises, Promises

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Runner-Events gegen Agenda-/Advancement-Zustände, agenda-point-/overadvance-bezogene Kosten und Effekte, Run-/Access-History falls benötigt.
- Keine Regelautorität außerhalb der Engine.

## Nicht im Scope

- Keine Agenda-Baseline-Karten aus Phase 6a.
- Keine Action-Debt-Longtails aus Phase 9, außer sie werden als Blocker dokumentiert.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Run-/Agenda-/Overadvance-Voraussetzungen sind LegalAction-basiert und in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
