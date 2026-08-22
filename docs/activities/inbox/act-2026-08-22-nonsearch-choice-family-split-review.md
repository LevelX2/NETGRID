---
activityId: act-2026-08-22-nonsearch-choice-family-split-review
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

# Nonsearch-Choice-Familien modularisieren

## Ziel

Prüfen, ob `nonsearch-choice-handlers.ts` nach den inzwischen klar
unterscheidbaren Choice-Familien aufgeteilt werden sollte, ohne Dispatch,
Hidden-Info-Barrieren oder Wiederaufnahmeverträge zu duplizieren.

## Kontext und Quellen

- Regel-Engine-Review Batch 4 vom 2026-08-22.
- `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts`
- Die P3.47-Vertragsvalidierung ist bereits ursächlich umgesetzt; dieses Paket
  betrifft ausschließlich die spätere Modulstruktur.
- Aktivierungsauslöser: nächste neue Nonsearch-Choice-Familie oder erneute
  Änderung in mindestens zwei bestehenden Familien.

## Scope

- Importgraph, gemeinsame Host-Verträge und familienbezogene Helfer erfassen.
- Einen Schnitt mindestens zwischen Corp-Hidden-Zone,
  Runner-Trash/Economy und Secret-Spend/Targeted-Run bewerten.
- Gemeinsamen Dispatch und Choice-Validierung als genau eine Autorität
  erhalten.
- Bei positiver Entscheidung kleine Migrationspakete pro Familie anlegen.

## Nicht im Scope

- Sofortige Komplettaufteilung nur wegen Dateilänge.
- Änderung von Choice-Semantik, Source-Format, Kartenbewegung oder Credits.
- Aufweichung von Hidden-Info-, StateVersion- oder Resume-Validierung.

## Akzeptanzkriterien

- [ ] Verantwortlichkeiten und gemeinsame Abhängigkeiten sind dokumentiert.
- [ ] Eine Aufteilung ist anhand Kohäsion, Zyklenrisiko und Änderungsnutzen
  begründet angenommen oder verworfen.
- [ ] Ein empfohlener Schnitt erzeugt keinen zweiten Dispatcher oder Resolver.
- [ ] Umsetzungsarbeit ist pro Familie klein und testbar paketiert.

## Umsetzungshinweise

- Die strikten P3.47-Machine-Errors und Legacy-V1.9.22-Trennung sind harte
  Bestandsverträge.
- `check:engine-source-structure` ist bei jeder empfohlenen Modulgrenze Pflicht.

## Ergebnisnotiz

Noch offen.
