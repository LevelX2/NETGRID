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
checks:
  - Event-/Operation-Owner, gemeinsame Mutation und Historie geprüft
  - corepack pnpm check:engine-source-structure
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

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Die 292-zeilige Datei trennt Event und
Operation bereits in private Ausführungsfunktionen, hält aber Play-Dispatch,
Kostenrevalidierung und Zonenmutation absichtlich in einem Owner. Seit Anlage
gab es keine Änderung der Datei und keine neue größere Event- oder
Operation-Familie. Ein Dateisplit würde den gemeinsamen Vertrag nicht
vereinfachen und könnte Validierung oder Mutation duplizieren. Keine
Folge-Activity; beim dokumentierten Erweiterungstrigger erneut anhand
konkreter Test- oder Änderungskopplung prüfen.
