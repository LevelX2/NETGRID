---
activityId: act-2026-05-24-proteus-phase-7b-icebreaker-credit-decks
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
releaseTarget: Proteus Phase 7b
blockedBy:
  - act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 7b: Icebreaker-Credit Decks

## Ziel

`Cortical Cybermodem` und `Sunburst Cranial Interface` mit source-bound Restricted Credits für Icebreaker-/Programmnutzung umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7b Icebreaker-Credit Decks`.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Existing CardImplementation-Familien für hosted/restricted credits, hardware decks und icebreaker payments.

## Zielkarten

- `onr_proteus_134_cortical-cybermodem` Cortical Cybermodem
- `onr_proteus_151_sunburst-cranial-interface` Sunburst Cranial Interface

## Scope

- Restricted Credits nur für Icebreaker-/Programmnutzung.
- Kostenprojektion in LegalActions und erneute `applyAction`-Revalidierung.
- Start-of-turn-Refresh, source-bound Counter und Sichtbarkeit.
- Sunburst-Noisy-Ausschluss nur, falls er generisch und regelkonform abbildbar ist.

## Nicht im Scope

- Keine allgemeine Payment-UI-Neugestaltung.
- Keine AI-Hints oder Decklegalität.
- Keine Damage-/Prevention-Hardware aus 7c.

## Akzeptanzkriterien

- [ ] Beide Zielkarten besitzen eigene CardImplementation-Dateien.
- [ ] Zweckgebundene Bits werden LegalAction- und `applyAction`-seitig source-bound revalidiert.
- [ ] Noisy-/Icebreaker-/Program-Zahlungseinschränkungen sind generisch und ohne Karten-ID-Branch umgesetzt oder präzise blockiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
