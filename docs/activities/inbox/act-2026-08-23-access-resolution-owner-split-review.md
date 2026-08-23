---
activityId: act-2026-08-23-access-resolution-owner-split-review
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

# Access-Resolution nach Ownern prüfen

## Ziel

Prüfen, ob Agenda-Steal, Access-Trash und Hidden-Resource-Access-Fähigkeiten
aus `access-resolution-actions.ts` in getrennte Owner-Dateien überführt werden
sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Agenda-Steal besitzt inzwischen einen eigenen Payment-Kontext und nutzt den
  gemeinsamen Cost-Support-Vertrag.
- Aktivierungsauslöser: nächste neue Access-Payment-Familie oder Änderung über
  mehrere Access-Resolution-Bereiche.

## Scope

- Steal-, Trash- und Hidden-Resource-Verantwortungen erfassen.
- Gemeinsame Access-Bindung und Payment-Quote von familienbezogener Mutation trennen.
- Bei positiver Entscheidung Folgepakete pro Owner anlegen.

## Nicht im Scope

- Änderung von Steal-, Trash- oder Access-Regeln.
- Duplizierte Payment-, LegalAction- oder Hidden-Info-Autorität.

## Akzeptanzkriterien

- [ ] Agenda-Steal, Access-Trash und Hidden-Resource-Fähigkeiten haben klare Owner.
- [ ] Action-ID, State-Version, Kostenquote und Support-Fortsetzung bleiben gebunden.
- [ ] Hidden-Info-, Replay- und StateHash-Verträge bleiben erhalten.

## Ergebnisnotiz

Noch offen.
