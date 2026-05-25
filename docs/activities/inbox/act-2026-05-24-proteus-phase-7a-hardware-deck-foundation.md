---
activityId: act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
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
releaseTarget: Proteus Phase 7a
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 7a: Hardware/Deck Foundation

## Ziel

Die Deck-Hardware-Grundlage für `Deck, The` oder foundation-only umsetzen und klären, ob Base-Link/Trace in 7d getrennt bleiben muss.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7a Hardware/Deck Foundation`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 7.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Bestehende Hardware-, Modifier-, Unique- und Restricted-Credit-CardImplementations.

## Zielkarten

- `onr_proteus_138_deck-the` Deck, The, falls die vorhandene Grundlage reicht.

## Scope

- Deck-Hardware-Einzigartigkeit.
- Deterministisches Trashen älterer Deck-Hardware beim Installieren eines neuen Decks.
- MU-/Hand-/Link-Modifier und source-bound Zustand, soweit für `Deck, The` nötig.
- Kein Proteus-ID-Branch außerhalb deklarativer CardImplementation.

## Nicht im Scope

- Keine Icebreaker-/Program-Restricted-Credit-Decks aus 7b.
- Keine Damage-/Prevention-Hardware aus 7c.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] `Deck, The` besitzt eine eigene CardImplementation-Datei oder der Foundation-only-Blocker ist dokumentiert.
- [ ] Deck-Einzigkeit, Trash-Reihenfolge und Modifier-Cleanup sind LegalAction-/`applyAction`-seitig abgesichert.
- [ ] MU-/Hand-/Link-Projektion ist public-safe und replay-/statehash-stabil.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel- und Hidden-Info-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
