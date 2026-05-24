---
activityId: act-2026-05-24-proteus-phase-3e-ice-repositioning
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
releaseTarget: Proteus Phase 3e
blockedBy:
  - act-2026-05-24-proteus-phase-3a-variable-ice-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 3e: ICE Repositioning

## Zielkarten

- `onr_proteus_033_mobile-barricade` Mobile Barricade
- `onr_proteus_044_walking-wall` Walking Wall

## Scope

- ICE-Bewegung und Reordering in Servern.
- Positions-Revalidierung und öffentliche Bewegungsdaten ohne Hidden-Info-Leak.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] ICE-Positionen werden stale-/side-sicher revalidiert.
- [ ] PlayerViews, PublicEvents, Replay und StateHash bleiben konsistent.

## Ergebnisnotiz

Noch offen.
