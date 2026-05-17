---
activityId: act-2026-05-17-timer-server-sync-contract
status: done
kind: architecture
area: server
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
releaseTarget:
blockedBy:
  - docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md
resultArtifacts:
  - docs/derived/TIMER_SERVER_SYNC_CONTRACT_2026_05_17.md
checks:
  - rg -n "timerSnapshot|ApiTimerSnapshot|timer_snapshot|hardLimitMs|deadlineId|AIInput|DecisionDebug|StateHash|Reconnect|WebSocket" docs/derived/TIMER_SERVER_SYNC_CONTRACT_2026_05_17.md docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md packages/shared/src/api-contracts.ts
  - rg -n "sessionToken|reconnectToken|joinToken|tokenHash|deckHash|privateDeckSnapshots|privatePayload|cardInstances|FullState|AIInput|DecisionDebug" docs/derived/TIMER_SERVER_SYNC_CONTRACT_2026_05_17.md
  - git diff --check
---

# Timer-Server-Sync-Vertrag

## Ziel

Vor harten Timerfolgen soll ein side-sicherer Server-/WebSocket-/Reconnect-Vertrag für Timer-Snapshots definiert werden.

## Kontext und Quellen

- `docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md`
- bestehende Multiplayer-, Reconnect- und API-Verträge unter `packages/shared/src/api-contracts.ts`

## Scope

- `timerSnapshot`-Felder für Matchlaufzeit, aktiven Scope, aktive Seite, StateVersion und Warnschwellen definieren.
- Serverzeit, Driftkorrektur, Periodik und Reconnect-Verhalten beschreiben.
- Hidden-Info-, Token-, Deckdaten-, Replay-, StateHash-, `AIInput`- und `DecisionDebug`-Grenzen festlegen.
- Testmatrix für Redaction, Reconnect und Multiplayer-Sync vorbereiten.

## Nicht im Scope

- Keine Engine-Timeout-Implementierung.
- Kein Auto-Pass, Aktionsverlust oder Forfeit.
- Keine UI-Detailumsetzung außer Vertragsbedarf.
- Keine Chat-Retention oder Moderation.

## Akzeptanzkriterien

- [x] Timer-Snapshot-Felder und Redaction-Grenzen sind dokumentiert.
- [x] Reconnect und WebSocket-Live-Sync sind konsistent beschrieben.
- [x] Timerdaten bleiben getrennt von GameEvents, Replay, StateHash und KI.
- [x] Warnungen sind konfigurierbar, aber noch ohne Regelwirkung.
- [x] Umsetzungshandoff für einen kleinen Server-/Shared-Slice ist möglich.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Ergebnis sollte als `docs/derived/`-Vertrag oder Ergänzung zum Timer-Konzept entstehen.

## Ergebnisnotiz

Abgeschlossen. Der Architekturvertrag `docs/derived/TIMER_SERVER_SYNC_CONTRACT_2026_05_17.md` definiert `ApiTimerSnapshot`, Scope-/Warnstufen, Serverzeit-/Drift-/Periodikregeln, WebSocket- und Reconnect-Verhalten, Redaction-Grenzen für Hidden Info, Tokens, Deckdaten, Replay, StateHash, `AIInput` und `DecisionDebug` sowie eine 20-Punkte-Testmatrix.

Es wurde bewusst keine Engine-Timeout-Implementierung, kein Auto-Pass/Forfeit, keine UI-Detailumsetzung und keine Chat-Retention beschrieben oder umgesetzt. Offene Umsetzungspunkte sind im Vertragsartefakt als Handoff-Risiken benannt: Speicherung von Match-/Scope-Startzeiten, Tick-Scheduler-Lifecycle, Disconnect-/Grace-Produktentscheidung und Warnschwellen-Feature-Flag.
