---
activityId: act-2026-05-24-proteus-phase-9b-action-economy-debt
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
releaseTarget: Proteus Phase 9b
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 9b: Action Economy/Action Debt

## Ziel

`AI Board Member`, `Please Don't Choke Anyone`, `Project Venice`, `Corporate Guard(R) Temps`, `Bargain with Viacox` und `Lucidrine™ Drip Feed` über generische Aktionsökonomie- und Action-Debt-Bausteine umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9b Action Economy/Action Debt`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.
- `docs/releases/proteus/purge-action-debt-contract.md`.

## Zielkarten

- `onr_proteus_001_ai-board-member` AI Board Member
- `onr_proteus_006_please-dont-choke-anyone` Please Don't Choke Anyone
- `onr_proteus_007_project-venice` Project Venice
- `onr_proteus_046_corporate-guard-r-temps` Corporate Guard(R) Temps
- `onr_proteus_131_bargain-with-viacox` Bargain with Viacox
- `onr_proteus_144_lucidrinetm-drip-feed` Lucidrine™ Drip Feed

## Scope

- Zusätzliche, entzogene oder künftig zu forgende Aktionen als StateHash-relevante Engine-Fakten.
- LegalAction-Filterung und deterministische Action-Debt-Abzahlung.
- PublicPayloads ohne private Hand-/Deck-/Choice-Leaks.

## Nicht im Scope

- Keine Random-Karten aus 9a.
- Keine Hidden-Zone-Search aus 9c.
- Keine UI-Regelautorität, Decklegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Action-Economy-/Debt-Fakten sind strukturiert, StateHash-relevant und replaystabil.
- [ ] LegalActions werden für Seite, Timing, Kosten, Ziele und verfügbare Aktionen revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Action-Debt- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
