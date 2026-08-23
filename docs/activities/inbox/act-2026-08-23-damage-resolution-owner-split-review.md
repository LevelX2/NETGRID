---
activityId: act-2026-08-23-damage-resolution-owner-split-review
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

# Damage-Resolution-Owner aufteilen

## Ziel

Prüfen, ob `damage-event-resolution.ts` entlang Core-Damage-Auflösung,
PDCA-Replacement und Damage-Choice-Orchestrierung geteilt werden sollte.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Aktivierungsauslöser: nächste neue Damage-Replacement-Familie oder eine
  Änderung über mehr als einen der genannten Bereiche.

## Scope

- State-, Event- und Choice-Verantwortungen der Datei erfassen.
- Eine Owner-Grenze entwerfen, die Replacement-Reihenfolge zentral hält.
- Bei positiver Entscheidung kleine Folgepakete je Verantwortungsbereich anlegen.

## Nicht im Scope

- Änderung von Damage-, Prevention- oder Flatline-Regeln.
- Änderung öffentlicher Damage-Payloads ohne eigenes Vertragsreview.

## Akzeptanzkriterien

- [ ] Core-Damage, PDCA-Replacement und Choice-Orchestrierung haben klare Owner.
- [ ] Hidden-Info-, Replacement-, Replay- und StateHash-Verträge bleiben erhalten.
- [ ] Es entsteht kein zweiter Damage- oder Replacement-Controller.

## Umsetzungshinweise

Die gemeinsame Reihenfolge von Imminent Event, Replacement und Prevention ist
eine harte Schichtgrenze.

## Ergebnisnotiz

Noch offen.
