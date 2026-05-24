---
activityId: act-2026-05-24-proteus-phase-3d-pass-trigger-uninstall-trash-ice
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
releaseTarget: Proteus Phase 3d
blockedBy:
  - act-2026-05-24-proteus-phase-3a-variable-ice-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 3d: Pass-Trigger/Uninstall/Trash ICE

## Zielkarten

- `onr_proteus_018_datacomb` Datacomb
- `onr_proteus_019_death-yo-yo` Death Yo-Yo
- `onr_proteus_029_marionette` Marionette
- `onr_proteus_037_scaffolding` Scaffolding
- `onr_proteus_042_tumblers` Tumblers
- `onr_proteus_043_twisty-passages` Twisty Passages

## Scope

- Pass-Trigger-Fenster, HQ-Rückführung, Uninstall-/Trash-/Sabotage-Effekte.
- Öffentliche Server-/ICE-Positionslabels ohne Hidden-Info-Leak.

## Nicht im Scope

- Keine ICE-Repositionierung außerhalb der Zielkarten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] Pass-/Uninstall-/Trash-Fenster werden über LegalActions/Choices revalidiert.
- [ ] Replay und StateHash bleiben stabil.

## Ergebnisnotiz

Noch offen.
