---
activityId: act-2026-05-24-proteus-phase-5e-icebreaker-modifier-support-hardware
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
releaseTarget: Proteus Phase 5e
blockedBy:
  - act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break
resultArtifacts: []
checks: []
---

# Proteus Phase 5e: Icebreaker Modifier/Support Hardware

## Ziel

Die sichtbaren Breaker-Support-Karten über generische installierte Modifier, Zielbindung und source-bound Credit-/Boost-Logik umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5e Icebreaker Modifier/Support Hardware`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Phase 5a Breaker-Projektion.

## Zielkarten

- `onr_proteus_115_personal-touch-the` Personal Touch, The
- `onr_proteus_139_eurocorpse-tm-spin-chip` Eurocorpse (TM) Spin Chip

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Installierte Modifier auf Breaker, source-bound Credits oder temporäre Boosts.
- Zielbindung an installierte Programme und StateHash-stabile Attach-/Modifierdaten.

## Nicht im Scope

- Keine neuen Icebreaker-Basismatcher aus Phase 5a.
- Keine Cybernetics-/Deck-Hardware aus Phase 7.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Zielbindung, Kosten und Modifier werden in LegalActions und `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Ziel-, Kosten-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
