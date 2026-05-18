# Multiplayer API Spec MVP 0.2

Status: Phase 0.2 requirements freeze candidate  
Stand: 2026-05-03

## REST

| ID | Methode | Pfad | Zweck | Requirements |
|---|---|---|---|---|
| API2-001 | `POST` | `/api/matches` | Privates Match erstellen. | MR-002, MR-003 |
| API2-002 | `GET` | `/api/matches/:matchId/join-info` | Minimale Join-Info ohne private Daten. | MR-004, MR-010 |
| API2-003 | `POST` | `/api/matches/:matchId/join` | Join-Token validieren und freie Seite zuweisen. | MR-004, MR-007 |
| API2-004 | `POST` | `/api/matches/:matchId/reconnect` | Seitensession wiederherstellen. | MR-007, MR-016 |
| API2-005 | `GET` | `/api/matches/:matchId/bootstrap` | PlayerView, LegalActions und EventTail nach Auth laden. | MR-010, MR-016 |

## Create Match Request

```ts
type CreateMatchRequest = {
  hostSide: "runner" | "corp" | "random"
  displayName?: string
  seed?: string
  settings?: Partial<MatchSettings>
}
```

Response enthält:

- `matchId`
- `hostSide`
- `hostSessionToken`
- `hostReconnectToken`
- `joinUrl`
- `baseline`
- `playerView`

Keine Response enthält Full GameState, TokenHash oder gegnerische verdeckte Daten.

## Join Request

```ts
type JoinMatchRequest = {
  token: string
  displayName?: string
}
```

Response enthält `sessionToken`, `reconnectToken`, `side`, `playerView`, `legalActions` und WebSocket-URL. Fehler bleiben generisch.

## Action Pipeline

REST reicht keine laufenden Spielactions ein. Laufende Actions gehen über WebSocket `submit_action`. REST dient Start, Join, Reconnect und Bootstrap.

