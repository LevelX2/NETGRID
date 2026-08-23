---
activityId: act-2026-08-23-activated-action-target-provider-review
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
  - Activated-Action-Zielzweige und Capability-Bindungen geprüft
---

# Typisierte Target-Provider für Activated Actions prüfen

## Ziel

Prüfen, ob zielabhängige Spezialzweige aus
`card-implementation-runtime-activated-actions.ts` über typisierte,
Capability-gebundene Target-Provider gekapselt werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 8 vom 2026-08-23.
- Aktivierungsauslöser: nächste neue Target-Familie im zentralen Builder.

## Scope

- Bestehende Target-Kinds, LegalAction-Payloads und Resolve-Revalidierung kartieren.
- Einen Registry-Vertrag mit zentralem Action-Builder bewerten.

## Nicht im Scope

- Änderung von Targeting- oder Ability-Semantik.
- Target-Provider als zweite LegalAction-Autorität.

## Akzeptanzkriterien

- [ ] Provider liefern nur Kandidatenfakten für exakt gebundene Capabilities.
- [ ] Der zentrale Builder bleibt Owner der LegalAction.
- [ ] Resolver revalidieren Ziele weiterhin unabhängig und fail-closed.

## Ergebnisnotiz

Noch nicht bearbeitet.
