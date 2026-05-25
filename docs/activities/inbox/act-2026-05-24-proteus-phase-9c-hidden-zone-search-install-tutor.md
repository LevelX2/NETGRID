---
activityId: act-2026-05-24-proteus-phase-9c-hidden-zone-search-install-tutor
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
releaseTarget: Proteus Phase 9c
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 9c: Hidden-Zone Search/Install/Tutor

## Ziel

`Hijack` und `Test Spin` mit side-privater Hidden-Zone-Suche, deterministischem Shuffle/Reorder und redigierten PublicEvents umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9c Hidden-Zone Search/Install/Tutor`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.
- V1.9.11 Hidden-Zone-Search-/Reveal-/Reorder-/Shuffle-Artefakte.

## Zielkarten

- `onr_proteus_110_hijack` Hijack
- `onr_proteus_126_test-spin` Test Spin

## Scope

- Side-private Kandidatenlisten und Choices.
- Install-/Tutor-Folgeaktionen mit `applyAction`-Revalidierung.
- Deterministisches Shuffle/Reorder ohne PublicEvent-Leaks.

## Nicht im Scope

- Keine Random/Dice-Karten aus 9a.
- Keine Action-Economy aus 9b.
- Keine Umsetzung von `Ice and Data Special Report` ohne Regelklärung.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Hidden-Zone-Kandidaten sind nur für die berechtigte Seite sichtbar.
- [ ] PublicPayload, PlayerView, Reconnect, Undo-Preview und Replay leaken keine privaten Kandidaten oder Reihenfolgen.
- [ ] LegalAction-Projektion und Revalidierung decken Seite, Timing, Kosten, Ziele und Choices ab.
- [ ] Hidden-Info-, wrong-side-, stale-action-, Shuffle-/Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
