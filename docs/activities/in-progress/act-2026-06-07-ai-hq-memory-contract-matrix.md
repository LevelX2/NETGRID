---
activityId: act-2026-06-07-ai-hq-memory-contract-matrix
status: in_progress
kind: architecture
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# HQ-Hand-Wissensvertrag und Ereignismatrix

## Ziel

Für die Runner-KI soll ein präziser Vertrag entstehen, wie rechtmäßig gewonnenes HQ-Wissen langfristig erhalten, reduziert oder invalidiert wird. Der Vertrag soll zwischen sicherem Wissen, unbekannten Karten und mehrdeutigen Kandidatengruppen unterscheiden und spätere Umsetzungspakete anleiten.

## Kontext und Quellen

- Nutzerbefund vom 2026-06-07: Nach mehreren HQ-Zugriffen kennt die Runner-KI scheinbar nur noch die zuletzt im aktuellen Zug gesehene HQ-Karte.
- Analyse vom 2026-06-07: `packages/ai/src/belief-state.ts` löscht bei verdecktem Korp-Install ohne `cardDefinitionId` aktuell die gesamte `hqHandMemory`-Liste über `unknown_departure`.
- Bestehende Vorarbeit: `docs/activities/done/act-2026-05-17-ai-belief-reconnect-undo-contract.md`.
- Relevante Codeanker:
  - `packages/ai/src/belief-state.ts`
  - `packages/ai/src/runner-plans.ts`
  - `packages/engine/src/public-context.ts`
  - `packages/engine/src/game/view/public-event-view.ts`
  - `apps/web/app/page.tsx`

## Scope

- Ereignismatrix für HQ-Wissen definieren:
  - HQ-Zugriff,
  - voller HQ-Look,
  - Korp-Draw,
  - bekannte und verdeckte Operation/Install/Discard/Steal/Trash/Score/Move,
  - HQ-/R&D-Shuffle, Swap, Arrange und echte Hidden-Zone-Reorder.
- Pro Ereignis festhalten, welche Informationen sicher erhalten bleiben, welche Kandidaten mehrdeutig werden und wann vollständige Invalidierung nötig ist.
- Side-sichere Zusatzfelder prüfen, die für verdeckte Install-Abgänge gebraucht werden, z. B. `installPlacement: "ice" | "root"` und eine nicht-identitätsleakende Position.
- Den Zielzustand für ein späteres `KnownHqHandMemory`-Ledger beschreiben:
  - sichere Definitionen,
  - unbekannte Restkarten,
  - mehrdeutige Kandidatengruppen,
  - Remote-Kandidatenverknüpfung,
  - abwärtskompatible `knownDefinitions`/`knownCount`-Ableitung.

## Nicht im Scope

- Keine Codeänderung.
- Keine neue Nutzung echter Hidden-Info, FullState, Storage-Interna, gegnerischer Decklisten oder Replay-PrivatePayload.
- Keine Änderung an LegalActions, `applyAction`, Engine-Regeln, Replay oder StateHash.
- Keine produktive Weltmodellierung oder Rollout-KI.

## Akzeptanzkriterien

- [ ] Es gibt ein kurzes Vertragsartefakt oder eine Activity-Ergebnisnotiz mit klarer Ereignismatrix für HQ-Hand-Wissen.
- [ ] Der Vertrag benennt explizit, wann vollständige Invalidierung erlaubt ist und wann nur Kandidaten reduziert werden dürfen.
- [ ] Der Vertrag definiert side-sichere Eventfelder, die keine Kartenidentität leaken, aber Typ-/Placement-Schlussfolgerungen erlauben.
- [ ] Offene Regelfragen sind sichtbar als Folgepakete oder Blocker benannt.
- [ ] Keine Code-, Engine-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung wurde in diesem Paket vorgenommen.

## Umsetzungshinweise

- Dieses Paket ist der Startpunkt für die folgenden Umsetzungspakete.
- Wichtiges Beispiel für den Vertrag: Voll bekannte HQ-Hand `ICE A`, `ICE B`, `Operation X`, `Asset Y`; verdeckter ICE-Install lässt `Operation X` und `Asset Y` sicher in HQ, während `ICE A`/`ICE B` als Kandidatengruppe mehrdeutig bleiben.
- Reine Reihenfolge in HQ ist für die Hand-Multimenge nicht automatisch relevant; echte Mischungen mit anderen Hidden-Zonen sind dagegen harte Invalidierungskandidaten.

## Ergebnisnotiz

Noch offen.
