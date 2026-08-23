---
activityId: act-2026-08-23-turn-persistent-state-owner-review
status: inbox
kind: architecture
area: engine
priority: normal
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
  - Debt- und Virus-State-Owner sowie Invarianten geprüft
---

# Persistente Turn-State-Domains prüfen

## Ziel

Prüfen, ob Corp-Aktionsschuld und purgefähige Runner-Virus-Counter aus
`turn-basic-execution.ts` in eigene State-Domains überführt werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 8, Finding F-08-03, vom 2026-08-23.
- Safe-Integer-, Summen- und Server-Invarianten sind inzwischen im Validator
  und in produktiven Lesern fail-closed abgesichert.
- Aktivierungsauslöser: nächste Änderung an Debt oder purgefähigen Countern.

## Scope

- Leser, Mutatoren, Validatoren und Public-Summaries je Domain zuordnen.
- Gemeinsame State-Helper ohne Abhängigkeit auf Basisactions entwerfen.

## Nicht im Scope

- Änderung von Purge-, Aktionsschuld- oder Counterregeln.
- Kompatibilitätsadapter für beschädigte V0-States.

## Akzeptanzkriterien

- [ ] Debt und purgefähige Counter besitzen getrennte, eindeutige Owner.
- [ ] Validator und alle Leser verwenden denselben Safe-Integer-Vertrag.
- [ ] Replay, StateHash und öffentliche Summaries bleiben unverändert.

## Ergebnisnotiz

Noch nicht bearbeitet.
