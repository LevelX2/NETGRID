---
activityId: act-2026-08-22-corp-operation-resolution-family-split-review
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

# Corp-Operation-Resolution nach Effektfamilien neu bewerten

## Ziel

Beim nächsten substanziellen Ausbau prüfen, ob
`corp-operation-resolution.ts` seine Registry-Orchestrierung durch getrennte
Utility-/Effektfamilien klarer und kollisionsärmer abbilden kann.

## Kontext und Quellen

- Regel-Engine-Review Batch 4 vom 2026-08-22.
- `packages/engine/src/game/play/corp-operation-resolution.ts`
- Im Review wurde kein aktueller Regel- oder Ablaufdefekt festgestellt.
- Aktivierungsauslöser: neue Operation-Familie oder eine Änderung, die mehrere
  heutige Resolution-Zweige gleichzeitig berührt.

## Scope

- Orchestrierung, familienbezogene Ausführung und gemeinsame Payload-/Host-
  Verträge inventarisieren.
- Prüfen, welche Zweige echte Effektfamilien und welche zentrale Ablaufhoheit
  darstellen.
- Bei positiver Entscheidung kleine Extraktionspakete mit unverändertem
  Registry-Dispatch definieren.

## Nicht im Scope

- Vorsorglicher Refactor ohne fachlichen Änderungsauslöser.
- Änderung von Operation-Kosten, Legalität, ResolvedEffects oder Kartenregeln.
- Zweite Registry oder stringbasierter Neben-Dispatch.

## Akzeptanzkriterien

- [ ] Zentrale Orchestrierung und extrahierbare Effektfamilien sind klar
  getrennt.
- [ ] Die Entscheidung berücksichtigt Importzyklen, Payload-Autorität und
  Determinismus.
- [ ] Eine empfohlene Extraktion erhält exakt denselben Registry- und
  LegalAction-Vertrag.
- [ ] Folgearbeit ist pro Effektfamilie klein paketiert.

## Umsetzungshinweise

- Dateilänge allein ist kein ausreichender Grund für die Aufteilung.
- Erst beim Aktivierungsauslöser gegen den dann aktuellen Code neu bewerten.

## Ergebnisnotiz

Noch offen.
