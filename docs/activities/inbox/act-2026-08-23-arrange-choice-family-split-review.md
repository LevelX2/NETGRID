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
checks:
  - Zonenfamilien, Permutationsvalidierung und Historie geprüft
  - corepack pnpm check:engine-source-structure
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

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Runner-Stack, Corp-R&D und
Fort-ICE-Reorder besitzen getrennte Start-/Resolve-Pfade, teilen aber bewusst
Choice-Bindung, Permutationsvalidierung und den einzigen Arrange-Dispatcher.
Seit dem Review wurde die Datei nicht geändert; es gibt keine neue
Zonenfamilie, keine Mehrfamilienänderung und keinen aktuellen
Hidden-Zone-Fehler. Ein Split würde heute gemeinsame Validierung und
Continuation-Verträge verteilen. Keine Folge-Activity; beim Trigger nur die
zonenspezifische Mutation schneiden und RNG-/Hidden-Info-Grenzen unverändert
lassen.
