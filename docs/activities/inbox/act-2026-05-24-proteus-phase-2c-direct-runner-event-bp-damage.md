---
activityId: act-2026-05-24-proteus-phase-2c-direct-runner-event-bp-damage
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
releaseTarget: Proteus Phase 2c
blockedBy:
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 2c: Direct Runner Event BP + Damage

## Ziel

`Faked Hit` als Runner-Event-Sequenz aus Bad Publicity plus unpreventable Brain/Core Damage umsetzen.

## Zielkarte

- `onr_proteus_108_faked-hit` Faked Hit

## Scope

- Eigene CardImplementation-Datei.
- Bad-Publicity-Effekt aus Phase 2a.
- Unpreventable Brain/Core-Damage-Pfad nur über bestehende generische Damage-Bausteine oder sauber neu geschnittenen Helper.
- Flatline-vs.-Bad-Publicity-Priorität testen.

## Nicht im Scope

- Keine Hidden-Resource- oder Replacement-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Karte hat eine eigene CardImplementation-Datei.
- [ ] BP und Damage laufen als Engine-sequenzierte Effekte.
- [ ] Flatline-/Bad-Publicity-Priorität ist getestet.
- [ ] PublicPayload, Replay und StateHash sind stabil.

## Ergebnisnotiz

Noch offen.
