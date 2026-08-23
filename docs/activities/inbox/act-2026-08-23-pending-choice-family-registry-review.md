---
activityId: act-2026-08-23-pending-choice-family-registry-review
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
  - Choice-Routing, Bindungen und Struktur-Gate geprüft
---

# Pending-Choice-Familienregistry prüfen

## Ziel

Prüfen, ob das Source-Präfix-Routing in `pending-choice-resolution.ts` durch
typisierte, registrierte Choice-Familien ersetzt werden sollte.

## Kontext und Quellen

- Regel-Engine-Review Batch 7 vom 2026-08-23.
- Aktivierungsauslöser: neuer Source-Präfix oder Änderung an mindestens zwei
  Choice-Domains.

## Scope

- Bestehende Präfixe, Resolver, StateVersion- und Source-Bindungen erfassen.
- Einen kleinen Registry-Vertrag mit genau einem zentralen Dispatcher prüfen.
- Bei positivem Ergebnis Folgepakete pro Choice-Familie anlegen.

## Nicht im Scope

- Änderung der Choice-Semantik oder öffentliche Kompatibilitätsaliasse.
- Zweite Resolverautorität neben `pending-choice-resolution.ts`.

## Akzeptanzkriterien

- [ ] Präfixkollisionen und lose Stringparameter sind inventarisiert.
- [ ] LegalAction-, PendingChoice-, Replay- und Hidden-Info-Bindungen bleiben erhalten.
- [ ] Eine Umsetzung ist in kleine, kollisionsarme Familienpakete geschnitten.

## Ergebnisnotiz

Noch nicht bearbeitet.
