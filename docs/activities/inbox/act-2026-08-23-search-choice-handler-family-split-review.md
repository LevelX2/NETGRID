---
activityId: act-2026-08-23-search-choice-handler-family-split-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Search-Choice-Familien und Hidden-Info-Grenzen geprüft
---

# Search-Choice-Handlerfamilien prüfen

## Ziel

Prüfen, ob Grip-/Stack-Suchen, temporäre Installationen, MU-Fortsetzungen und
Corp-HQ/R&D-Suchen aus `search-choice-handlers.ts` getrennt werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 7 vom 2026-08-23.
- Aktivierungsauslöser: nächster neuer Search-Continuation-Typ.

## Scope

- Search-Bindung, Move-Intent, MU-Checkpoint und Hidden-Info-Payload je Familie erfassen.
- Folgepakete nur bei nachgewiesener Kohäsion anlegen.

## Nicht im Scope

- Änderung von Suchregeln, Sichtbarkeit oder Kartenfiltern.
- Dualer Search-Resolver.

## Akzeptanzkriterien

- [ ] Source-Zone, Kandidatenmenge und Continuation bleiben source-bound.
- [ ] Hidden-Info-, Replay- und StateHash-Verträge bleiben erhalten.
- [ ] Ein alter MU-Sonderpfad wird nur bei belegter Gleichwertigkeit vereinheitlicht.

## Ergebnisnotiz

Noch nicht bearbeitet.
