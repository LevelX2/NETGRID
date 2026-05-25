---
activityId: act-2026-05-24-proteus-phase-7c-damage-prevention-hardware
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
releaseTarget: Proteus Phase 7c
blockedBy:
  - act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 7c: Damage/Prevention Hardware

## Ziel

`Cortical Stimulators` über generische Damage-/Prevention-/Replacement-Hardware-Bausteine umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7c Damage/Prevention Hardware`.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Bestehende `damagePreventionSources`- und Hardware-CardImplementations.

## Zielkarten

- `onr_proteus_135_cortical-stimulators` Cortical Stimulators

## Scope

- Damage-/Prevention-/Replacement-Hardware.
- Turn-/Source-Limits und redigierte Choice-Fenster.
- LegalAction-Projektion und `applyAction`-Revalidierung.

## Nicht im Scope

- Keine Icebreaker-/Program-Restricted-Credit-Decks aus 7b.
- Keine allgemeine Damage-Engine-Neugestaltung.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Die Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Prevention-/Replacement-Fenster sind generisch, source-bound und hidden-info-sicher.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
