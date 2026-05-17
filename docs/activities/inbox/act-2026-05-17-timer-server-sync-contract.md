---
activityId: act-2026-05-17-timer-server-sync-contract
status: inbox
kind: architecture
area: server
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - docs/derived/VISIBLE_MATCH_TIMER_SYSTEM_CONCEPT_2026_05_17.md
resultArtifacts: []
checks: []
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

- [ ] Timer-Snapshot-Felder und Redaction-Grenzen sind dokumentiert.
- [ ] Reconnect und WebSocket-Live-Sync sind konsistent beschrieben.
- [ ] Timerdaten bleiben getrennt von GameEvents, Replay, StateHash und KI.
- [ ] Warnungen sind konfigurierbar, aber noch ohne Regelwirkung.
- [ ] Umsetzungshandoff für einen kleinen Server-/Shared-Slice ist möglich.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Ergebnis sollte als `docs/derived/`-Vertrag oder Ergänzung zum Timer-Konzept entstehen.

## Ergebnisnotiz

Noch offen.
