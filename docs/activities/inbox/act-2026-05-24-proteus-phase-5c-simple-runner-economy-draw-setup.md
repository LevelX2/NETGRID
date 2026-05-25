---
activityId: act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup
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
releaseTarget: Proteus Phase 5c
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 5c: Simple Runner Economy/Draw/Setup

## Ziel

Die einfachen sichtbaren Runner-Economy-, Draw- und Setup-Karten über bestehende Event-/Resource- und Trace-/Draw-/Credit-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5c Simple Runner Economy/Draw/Setup`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Runner-Event-/Resource-Implementierungen.

## Zielkarten

- `onr_proteus_103_cruising-for-netwatch` Cruising for Netwatch
- `onr_proteus_114_on-the-fast-track` On the Fast Track
- `onr_proteus_118_prearranged-drop` Prearranged Drop
- `onr_proteus_124_stakeout` Stakeout
- `onr_proteus_130_back-door-to-rivals` Back Door to Rivals
- `onr_proteus_148_runner-sensei` Runner Sensei

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Sichtbare Runner-Event-/Resource-Aktionen für Credits, Draw, Trace und Setup-Effekte.
- Ziel-, Kosten-, Timing- und Choice-Revalidierung ohne Hidden-Zone-Leaks.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Run-Event-Folgefenster aus Phase 5d.
- Keine Proteus-AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Kosten, Ziele, Choices und Timing werden in `applyAction` revalidiert.
- [ ] Hidden-Zone-/PlayerView-/PublicEvent-Redaction ist bei Stack-/Grip-/HQ-/R&D-Bezug abgesichert.
- [ ] Replay-/StateHash-Stabilität und Registry-/Coverage-/Manifest-Nachweis sind erbracht.

## Ergebnisnotiz

Noch offen.
