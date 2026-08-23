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
checks:
  - Damage-Architektur, Owner, RNG- und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
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

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Die führende
`damage-runtime-architecture.md` weist der Datei bewusst finale
Damage-/Tag-/Trash-Auflösung einschließlich RNG-Records und PDCA-Folgepfad zu;
Replacement-Kandidaten und Prevention besitzen bereits eigene Module. Der
spätere RNG-Fix `582431649` blieb innerhalb dieses Finalresolver-Owners und
belegt keine Mehrfachautorität. Seit Anlage kam keine neue
Replacement-Familie oder bereichsübergreifende Änderung hinzu. Keine
Folge-Activity; beim Trigger muss Imminent-Event → Replacement → Prevention
zentral und deterministisch bleiben.
