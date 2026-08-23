---
activityId: act-2026-08-23-trigger-ability-owner-split-review
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
  - Triggerfamilien, Timing-Predicates und Struktur-Gate geprüft
---

# Trigger-Ability-Owner prüfen

## Ziel

Prüfen, ob spezialisierte Triggerpfade und Timing-Predicates aus
`trigger-ability-execution.ts` in ihre bestehenden Ability-Owner wandern sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 7 vom 2026-08-23.
- Aktivierungsauslöser: neuer Spezialtrigger oder erneuter Builder-/Resolver-Timingbruch.

## Scope

- Triggerfamilien, Action-Builder und Resolve-Time-Revalidierung zuordnen.
- Gemeinsame Timing-Predicates nur bei exakt geteilter Semantik extrahieren.

## Nicht im Scope

- Änderung von Triggerreihenfolge oder Ability-Semantik.
- Zweiter Triggerdispatcher.

## Akzeptanzkriterien

- [ ] Builder und Resolver verwenden dieselbe fachliche Timinggrenze.
- [ ] Jeder Trigger bleibt genau einem Ability-Owner zugeordnet.
- [ ] Replay und PublicPayload bleiben unverändert.

## Ergebnisnotiz

Noch nicht bearbeitet.
