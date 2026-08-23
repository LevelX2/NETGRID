---
activityId: act-2026-08-23-arrange-choice-family-split-review
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
checks: []
---

# Arrange-Choice-Familien modularisieren

## Ziel

Prüfen, ob `arrange-choice-handlers.ts` in Runner-Stack-Arrange,
Corp-R&D-Arrange und Fort-ICE-Reorder geteilt werden sollte.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Im geprüften Umfang wurde kein aktueller Hidden-Zone-Fehler nachgewiesen.
- Aktivierungsauslöser: nächste neue Arrange-Familie oder eine Änderung über
  mehrere Zonenfamilien.

## Scope

- Gemeinsame Choice-Validierung von zonenspezifischer Mutation trennen.
- Hidden-Zone-Sets, Reihenfolge und Continuations je Familie erfassen.
- Bei positiver Entscheidung Folgepakete je Zone anlegen.

## Nicht im Scope

- Änderung von Reveal-, Shuffle- oder Auswahlregeln.
- Aufweichung side-sicherer PlayerViews oder PublicEvents.

## Akzeptanzkriterien

- [ ] Jede Arrange-Familie besitzt genau einen Mutationsowner.
- [ ] Choice-Optionen und Zoneninhalt werden beim Resolve weiterhin exakt gebunden.
- [ ] RNG-, Hidden-Info-, Replay- und StateHash-Verträge bleiben erhalten.

## Ergebnisnotiz

Noch offen.
