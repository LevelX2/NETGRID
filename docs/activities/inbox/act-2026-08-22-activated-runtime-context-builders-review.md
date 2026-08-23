---
activityId: act-2026-08-22-activated-runtime-context-builders-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Activated-Runtime-Context-Builder prüfen

## Ziel

Prüfen, ob die Callback-Gruppen des Execution-Contexts aus
`card-implementation-runtime-activated-resolve.ts` in kleine typisierte
Context-Builder ausgelagert werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 5 vom 2026-08-22.
- Aktivierungsauslöser: eine weitere Callback-Familie oder eine Änderung, die
  mindestens zwei bestehende Gruppen zugleich betrifft.

## Scope

- Hidden-Zone-, Run/Trace-, Board/Counter- und Economy-Gruppen kartieren.
- Abhängigkeiten und mögliche Builder-Grenzen bewerten.
- Bei positivem Ergebnis kleine Folgepakete pro Context-Familie anlegen.

## Nicht im Scope

- Änderung von Ability-, Kosten-, Choice- oder Effektsemantik.
- Zweiter Dispatcher oder paralleler Runtime-Host.

## Akzeptanzkriterien

- [ ] Aufteilung ist anhand Kohäsion und Importgraph begründet angenommen oder verworfen.
- [ ] Eine Empfehlung erhält genau eine Runtime- und Dispatch-Autorität.
- [ ] Folgepakete sind kollisionsarm und fokussiert testbar.

## Umsetzungshinweise

- `check:engine-source-structure` ist bei neuen Modulgrenzen Pflicht.

## Ergebnisnotiz

Noch offen.
