---
activityId: act-2026-08-22-play-card-execution-owner-split-review
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

# Event- und Operation-Ausführung trennen

## Ziel

Beobachten und bei der nächsten größeren Erweiterung prüfen, ob
`play-card-execution.ts` in getrennte Event- und Operation-Owner aufgeteilt
werden sollte.

## Kontext und Quellen

- Regel-Engine-Review Batch 5 vom 2026-08-22.
- Der aktuelle Bestand ist noch überschaubar; es wurde kein Funktionsfehler
  nachgewiesen.
- Aktivierungsauslöser: neue größere Event- oder Operation-Familie.

## Scope

- Gemeinsame Play-/Kosten-/Zonenverträge und side-spezifische Ausführung erfassen.
- Einen Split erst bei nachgewiesenem Kohäsionsgewinn empfehlen.
- Bei positivem Ergebnis getrennte kleine Migrationspakete anlegen.

## Nicht im Scope

- Vorsorglicher Split allein wegen Dateigröße.
- Änderung von Kosten, On-play-Effekten oder Return-to-Grip-Verträgen.

## Akzeptanzkriterien

- [ ] Entscheidung ist anhand konkreten Änderungsdrucks begründet.
- [ ] Play-Card-Validierung und Zonenmutation bleiben genau einmal autoritativ.
- [ ] Event- und Operationstests sichern identisches Verhalten.

## Umsetzungshinweise

- Bei ausbleibendem Aktivierungsauslöser bleibt die aktuelle Datei unverändert.

## Ergebnisnotiz

Noch offen.
