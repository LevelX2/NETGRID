---
activityId: act-2026-05-24-proteus-phase-9d-data-fort-creation-lock
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
releaseTarget: Proteus Phase 9d
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 9d: Data-Fort Creation Lock

## Ziel

`Precision Bribery` über einen generischen, turngebundenen Data-Fort-Creation-Lock umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9d Data-Fort Creation Lock`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.

## Zielkarte

- `onr_proteus_146_precision-bribery` Precision Bribery

## Scope

- Lock auf Data-Fort-Erstellung und Installationspfade in neue Remotes.
- Kosten-/Trash-/Sabotage-Revalidierung.
- Turngebundener Lock-Cleanup.

## Nicht im Scope

- Keine allgemeine Remote-/Server-Neudefinition.
- Keine Hidden-Zone-Search oder Random-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Die Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Der Data-Fort-Creation-Lock ist generisch, turngebunden und StateHash-relevant.
- [ ] Install-/Create-Remote-LegalActions werden korrekt gefiltert und in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-/Trash-, Lock-Cleanup- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
