---
activityId: act-2026-05-24-proteus-phase-3c-relative-board-count-ice
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
releaseTarget: Proteus Phase 3c
blockedBy:
  - act-2026-05-24-proteus-phase-3a-variable-ice-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 3c: Relative/Board-Count ICE

## Zielkarten

- `onr_proteus_012_bug-zapper` Bug Zapper
- `onr_proteus_021_dog-pile` Dog Pile
- `onr_proteus_026_hunting-pack` Hunting Pack
- `onr_proteus_030_mastermind` Mastermind

## Scope

- Öffentliche Zählfunktionen für installierte/gerezzte ICE und relative Boardzustände.
- StateHash-stabile effektive Werte ohne Leaks unrezzter Identitäten.

## Nicht im Scope

- Keine Repositionierung oder Hidden-Resource-Mechaniken.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] Zählwerte werden generisch berechnet und in LegalActions/Views konsistent genutzt.
- [ ] Hidden-Info-Grenzen für unrezzed ICE bleiben gewahrt.

## Ergebnisnotiz

Noch offen.
