---
activityId: act-2026-05-17-visible-match-timer-concept
status: done
kind: concept
area: engine
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md
  - docs/activities/inbox/act-2026-05-17-timer-ui-only-clock.md
  - docs/activities/inbox/act-2026-05-17-timer-server-sync-contract.md
  - docs/activities/inbox/act-2026-05-17-engine-hard-timeout-contract.md
checks:
  - rg-basierte Prüfung zu bestehenden Timer-/Timeout-/Chat-/Reconnect-/Replay-/StateHash-Begriffen
  - Dokumentprüfung gegen CODEX_STATUS, V2.2 Chat-Datenvertrag und Multiplayer-/API-Anker
  - git diff --check
---

# Sichtbares Timer-System für Chat und Spiel

## Ziel

Für NETGRID soll ein sichtbares Zeit-/Timer-System konzipiert werden, bevor Engine-, Multiplayer- und UI-Verträge umgesetzt werden.

## Kontext und Quellen

- Nutzeranforderung vom 2026-05-17: Laufende Uhr im Chat- oder Spielbereich; optional Maximalzeiten für Chat, Zug, Entscheidungsphase, Partie oder Aktionen.

## Scope

- Entscheiden, welche Timerarten benötigt werden: Spieler, Zug, Run, Entscheidungsphase, Aktion, Partie oder global.
- Multiplayer-Synchronisation, Serverautorität und Reconnect-Verhalten beschreiben.
- Regelbasierte Folgen modellieren: Warnung, Timeout, Auto-Pass, Aktionsverlust, Spielverlust.
- UI-Ort und Konfiguration als kleines Folgepaket schneiden.

## Nicht im Scope

- Keine direkte Implementierung harter Zeitregeln in diesem Konzeptpaket.
- Keine Änderung an `applyAction`-Regeln, bevor Timerautorität entschieden ist.

## Akzeptanzkriterien

- [x] Timerarten und Prioritäten sind entschieden oder als Varianten bewertet.
- [x] Server-/Engine-Autorität und Multiplayer-Sync sind beschrieben.
- [x] Warnungen und harte Limits haben ein konfigurierbares Modell.
- [x] Hidden-Info-, Replay- und StateHash-Folgen sind benannt.
- [x] Konkrete Implementierungs-Folgeactivities sind klein geschnitten.

## Umsetzungshinweise

- Harte Zeitfolgen betreffen Engine-Korrektheit und müssen replaybar sein; reine sichtbare Uhr kann als UI-Vorstufe getrennt werden.

## Ergebnisnotiz

Abgeschlossen. `docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md` bewertet Partie/global, Spieler, Zug, Run, Entscheidungsphase, Aktion und Chat-Cooldown. Der empfohlene Schnitt ist zuerst eine UI-only-Uhr ohne Regelwirkung, danach ein Server-/WebSocket-/Reconnect-Sync-Vertrag und erst anschließend ein harter Engine-Timeout-Vertrag.

Das Konzept hält fest: Serverzeit ist für Multiplayer-Snapshots führend; die UI darf nur anzeigen und lokal interpolieren; harte Folgen wie Auto-Pass, Aktionsverlust oder Spielverlust bleiben blockiert, bis sie als enginevalidierte Timeout-Auflösung mit Replay-/StateHash-Stabilität spezifiziert sind. Timerdaten dürfen keine Hidden-Info, Tokens, Deckdaten, `AIInput` oder `DecisionDebug` leaken und bleiben bei UI-only/Sync aus GameEvents, Replay und StateHash heraus.

Drei Folgeactivities wurden angelegt: `act-2026-05-17-timer-ui-only-clock`, `act-2026-05-17-timer-server-sync-contract` und `act-2026-05-17-engine-hard-timeout-contract`.
