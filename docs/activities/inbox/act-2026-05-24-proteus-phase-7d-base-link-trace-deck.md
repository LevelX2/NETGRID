---
activityId: act-2026-05-24-proteus-phase-7d-base-link-trace-deck
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
releaseTarget: Proteus Phase 7d
blockedBy:
  - act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 7d: Base-Link/Trace Deck

## Ziel

Den Base-Link-/Trace-Anteil von `Deck, The` umsetzen, falls er in 7a nicht vollständig und sauber enthalten war.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7d Base-Link/Trace Deck`.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Bestehende Trace-, Link- und PlayerView-Projektionsmuster.

## Zielkarten

- `onr_proteus_138_deck-the` Deck, The, falls Base-Link/Trace nach 7a offen bleibt.

## Scope

- Base-Link-/Trace-Modifier.
- PlayerView-Projektion und AIInput nur side-sichere öffentliche Werte.
- Replay-/StateHash-stabile Modifier-Anwendung ohne UI-Regelautorität.

## Nicht im Scope

- Keine erneute Umsetzung der Deck-Foundation aus 7a.
- Keine AI-Hints oder AI-Support-Promotion.
- Keine Decklegalität.

## Akzeptanzkriterien

- [ ] Base-Link-/Trace-Modifier sind entweder in 7a nachweislich erledigt oder hier generisch umgesetzt.
- [ ] Projektionen sind public-safe; Hidden-Info wird nicht geleakt.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Trace-/Link- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht oder Nichtbedarf dokumentiert.

## Ergebnisnotiz

Noch offen.
