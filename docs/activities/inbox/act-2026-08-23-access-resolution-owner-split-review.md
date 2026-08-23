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
checks:
  - Access-Owner, Paymentbindung und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# Access-Resolution nach Ownern prüfen

## Ziel

Prüfen, ob Agenda-Steal, Access-Trash und Hidden-Resource-Access-Fähigkeiten
aus `access-resolution-actions.ts` in getrennte Owner-Dateien überführt werden
sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Regel-Engine-Review Batch 8 vom 2026-08-23 ergänzt
  `access-effect-execution.ts` als angrenzenden Owner für Anwendbarkeit,
  Payment-Choice, Step-Ausführung und Continuations.
- Agenda-Steal besitzt inzwischen einen eigenen Payment-Kontext und nutzt den
  gemeinsamen Cost-Support-Vertrag.
- Aktivierungsauslöser: nächste neue Access-Payment-Familie oder Änderung über
  mehrere Access-Resolution-/Access-Effect-Bereiche.

## Scope

- Steal-, Trash- und Hidden-Resource-Verantwortungen erfassen.
- Die Grenze zu `access-effect-execution.ts` und dessen Applicability-,
  Payment-, Step- und Continuation-Aufgaben einbeziehen.
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

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Agenda-Steal, Access-Trash und
Hidden-Resource-Fähigkeiten sind fachlich unterscheidbar, teilen aber bewusst
die aktuelle Access-Bindung und fail-closed Revalidierung von Karte, Action,
StateVersion und Quote. Der unmittelbar vorausgehende Fix `3e8afe801` betraf
ausschließlich den Steal-Payment-Support und belegt keine Querfamilienkopplung.
Seit Anlage der Activity gab es keine weitere Änderung und keine neue
Access-Payment-Familie. Keine Folge-Activity; beim Trigger nur
familienbezogene Mutation extrahieren und Binding-/Payment-Autorität zentral
lassen.
