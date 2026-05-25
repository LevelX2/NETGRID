---
activityId: act-2026-05-24-proteus-phase-8e-virus-access-trash-program-effects
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
releaseTarget: Proteus Phase 8e
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts: []
checks: []
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

Noch offen.
