# WebSocket Protocol Spec MVP 0.2

Status: Phase 0.2 requirements freeze candidate  
Stand: 2026-05-03

## Client to Server

| Type | Payload | Requirements |
|---|---|---|
| `join_match` | `{ matchId, sessionToken, side }` | MR-008 |
| `submit_action` | `{ matchId, side, actionId, clientKnownStateVersion, idempotencyKey, selectedTargets?, selectedChoices? }` | MR-011 bis MR-015 |
| `request_undo` | `{ targetEventId, reason? }` | MR-018 |
| `accept_undo` | `{ undoRequestId }` | MR-019 |
| `decline_undo` | `{ undoRequestId }` | MR-018 |
| `ping` | `{ clientTime }` | MR-007 |

## Server to Client

| Type | Payload | Visibility |
|---|---|---|
| `state_update` | `{ matchVersion, playerView }` | Nur side-gefilterte PlayerView. |
| `legal_actions` | `{ stateVersion, legalActions }` | Nur Aktionen der eigenen Seite. |
| `choice_request` | `{ choice }` | Nur berechtigter Spieler. |
| `event_log_update` | `{ events }` | PublicEvents plus erlaubte SideEvents. |
| `action_receipt` | `{ idempotencyKey, accepted, stateVersionBefore, stateVersionAfter, stateHashAfter }` | Keine privaten Karten. |
| `opponent_status` | `{ side, connected }` | Keine Session-/Token-Details. |
| `undo_request` | `{ undoRequestId, requestedBy, targetEventId, reason? }` | Keine verdeckte Barrier-Details. |
| `match_finished` | `{ winner, finalStateHash }` | Öffentlich. |
| `error` | `{ code, message, currentStateVersion?, playerView? }` | Generisch und side-sicher. |

## Verarbeitung

1. Session prüfen.
2. MatchStatus prüfen.
3. IdempotencyKey prüfen.
4. Per-Match-Lock nehmen.
5. StateVersion prüfen.
6. Engine `applyAction` ausführen.
7. State, EventLog, Snapshot/Receipt speichern.
8. Side-gefiltert broadcasten.
9. Lock freigeben.

