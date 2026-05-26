---
activityId: act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup
status: blocked
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 5c
proReferences:
  - PRO005
  - PRO014
blockedBy:
  - runner_trash_subtype_history
  - runner_next_agenda_access_reward
  - base_link_trace_avoid_reward
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_103|onr_proteus_114|onr_proteus_118|onr_proteus_124|onr_proteus_130|onr_proteus_148\" data/cards/proteus-cards.json data/manifests/proteus-card-support.json docs/releases/proteus -S"
  - "rg -n \"gain_credits|draw_cards|trace_post_bid_link_window|base link|successful.*trace|accessed.*agenda\" packages/engine/src packages/engine/src/card-implementations -S"
  - "git diff --check"
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

Blockiert am 2026-05-24, ohne Kartenpromotion.

`Cruising for Netwatch` und `Stakeout` sind voraussichtlich über vorhandene `on_play`-Effekte mit `gain_credits` und `draw_cards` umsetzbar. Der vollständige Slice enthält aber vier Karten mit fehlenden generischen Zustands-/Timingbausteinen:

- `On the Fast Track` braucht Runner-Turn-History darüber, ob der Runner in diesem Zug eine Advertisement- oder Transactions-Karte getrasht hat. Der aktuelle generische Event-Baustein kennt keine wiederverwendbare, subtype-bezogene Trash-History für Runner-Economy-Events.
- `Prearranged Drop` braucht einen turngebundenen Delayed-Reward für den nächsten Agenda-Access in diesem Zug. Dafür fehlt ein generischer Runner-Event-Flag, der auf Access einer Agenda triggert, Credits auszahlt, genau einmal verbraucht wird und bei Turn-Ende deterministisch aufräumt.
- `Back Door to Rivals` und `Runner Sensei` brauchen Base-Link-Trace-Entscheidungen mit Exklusivität pro Trace, variablem Base-Link-/Pump-Creditpfad und anschließendem Credit-Gewinn, wenn genau diese Quelle erfolgreich zum Vermeiden einer Trace verwendet wurde. Das vorhandene `trace_post_bid_link_window`-Muster deckt einfache Link-Boosts ab, aber kein Base-Link-Auswahlfenster mit Source-Reward.

Keine Teilumsetzung wurde vorgenommen, weil der Slice alle sechs Zielkarten gemeinsam fordert und eine isolierte Promotion von `Cruising for Netwatch`/`Stakeout` die Activity-Akzeptanzkriterien für vollständigen Slice-, Registry-/Coverage-/Manifest- und Revalidierungsnachweis nicht erfüllen würde.
