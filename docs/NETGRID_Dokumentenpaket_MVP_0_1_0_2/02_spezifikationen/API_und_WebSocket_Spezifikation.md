# NETGRID-Webapplikation – API- und WebSocket-Spezifikation

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.2, mit Rücksicht auf MVP 0.1  
**Protokollversion:** `0.2.0`  
**Primäres Ziel:** eindeutige Verträge zwischen Frontend, Backend, Engine und Tests

## 1. Zweck

Dieses Dokument spezifiziert die REST- und WebSocket-Schnittstellen für private Human-vs-Human-Partien. Es legt Nachrichtenformate, Authentifizierung, Fehlercodes, Idempotency, StateVersion-Verhalten, Reconnect und Visibility-Regeln fest.

Die Schnittstellen sind bewusst minimal. Laufende Spielaktionen erfolgen über WebSocket. REST wird für Match-Erstellung, Join, Reconnect-Bootstrap und optionale Replay-/Exportfunktionen genutzt.

## 2. Grundsätze

1. Der Client sendet Absichten, keine Zustandsänderungen.
2. Jede Action enthält `clientKnownStateVersion` und `idempotencyKey`.
3. Der Server validiert Token, Seite, MatchStatus, StateVersion und Idempotency.
4. Die Engine validiert ActionId, Seite, TimingPoint, Kosten und Targets erneut.
5. Jede ausgehende Spielnachricht ist seitenspezifisch gefiltert.
6. Fehlernachrichten dürfen keine verdeckten Kartendaten oder internen CardInstanceIds enthalten.
7. Reconnect darf nie mehr Informationen liefern als ein normaler StateUpdate derselben Seite.
8. Pro Match darf nur eine Engine-Transition gleichzeitig verarbeitet werden.

## 3. Gemeinsame Konventionen

### 3.1 Transport

| Bereich | Festlegung |
|---|---|
| REST | JSON über HTTP. |
| WebSocket | JSON Messages über WebSocket. |
| Zeitformat | ISO-8601 UTC String. |
| IDs | Stabile string IDs mit Präfix, z. B. `match_`, `evt_`, `sess_`. |
| Protokollversion | Client sendet Version; Server kann inkompatible Version ablehnen. |
| Authentifizierung | Tokenbasierte Match-/Sessionauthentifizierung, kein Accountsystem für MVP 0.2. |
| TLS | Localhost darf HTTP/WS verwenden; außerhalb localhost HTTPS/WSS. |

### 3.2 Basistypen

```ts
type Side = "corp" | "runner"
type ISODateTime = string
type MatchId = string
type EventId = string
type SessionToken = string
type IdempotencyKey = string
```

```ts
type MatchStatus =
  | "creating"
  | "waiting_for_second_player"
  | "ready"
  | "active"
  | "paused_disconnect"
  | "finished"
  | "abandoned"
```

### 3.3 Versionen

```ts
type ProtocolVersions = {
  multiplayerProtocolVersion: "0.2.0"
  engineSchemaVersion: "0.2.0"
  playerViewSchemaVersion: "0.2.0"
  eventSchemaVersion: "0.2.0"
}
```

Der Server muss inkompatible Clients mit `PROTOCOL_VERSION_UNSUPPORTED` ablehnen. Kleine UI-Versionen dürfen kompatibel sein, solange die Message-Schemas unverändert bleiben.

### 3.4 Request-ID und Korrelation

REST-Responses und WebSocket-Fehler sollen optional eine `requestId` bzw. `clientMessageId` enthalten. Diese IDs dienen Debugging und dürfen keine privaten Spielinformationen enthalten.

```ts
type RequestMeta = {
  requestId?: string
  clientMessageId?: string
}
```

## 4. REST API

### 4.1 Übersicht

| Methode | Pfad | Zweck | Auth |
|---|---|---|---|
| `POST` | `/api/matches` | Privates Match erstellen | keine Accountauth; erzeugt Token |
| `GET` | `/api/matches/:matchId/join-info` | Minimale öffentliche Join-Info | optional Token, keine privaten Daten |
| `POST` | `/api/matches/:matchId/join` | Join-Token validieren und freie Seite übernehmen | Join-Token |
| `POST` | `/api/matches/:matchId/reconnect` | Seitensession wiederherstellen | Session-/Reconnect-Token |
| `GET` | `/api/matches/:matchId/bootstrap` | Initiale PlayerView laden | SessionToken |
| `GET` | `/api/matches/:matchId/replay` | Optional: gefilterter Replay-/Debug-Export | SessionToken oder lokaler Debug |
| `GET` | `/api/health` | Betriebsstatus ohne Matchdaten | keine privaten Daten |

### 4.2 Fehler-Envelope

REST-Fehler verwenden ein einheitliches Format.

```ts
type ApiErrorResponse = {
  error: {
    code: MultiplayerErrorCode
    message: string
    requestId?: string
    matchId?: string
    stateVersion?: number
    matchVersion?: number
  }
}
```

Fehlertexte sind generisch. Beispiele:

- erlaubt: `"Die Aktion ist für den aktuellen Zustand nicht legal."`
- verboten: `"Du kannst Simple Barrier ICE nicht rezzen, weil es verdeckt vor R&D liegt."` an den Runner
- verboten: `"Token sess_xxx ist gültig für Corp."`

### 4.3 `POST /api/matches`

Erstellt ein privates Match mit festen Demo-Decks.

Request:

```json
{
  "hostSide": "runner",
  "displayName": "Player A",
  "seed": "optional-seed",
  "settings": {
    "allowUndo": true,
    "pauseOnDisconnect": true
  }
}
```

Validierung:

| Feld | Regel |
|---|---|
| `hostSide` | `corp`, `runner` oder optional `random`. |
| `displayName` | Optional; Länge begrenzen; nicht als Authentifizierungsmerkmal verwenden. |
| `seed` | Optional; falls leer, serverseitig erzeugen. |
| `settings.allowUndo` | Default `true`. |
| `settings.pauseOnDisconnect` | Default `true`. |

Response:

```json
{
  "matchId": "match_abc123",
  "hostSide": "runner",
  "hostReconnectUrl": "/match/match_abc123?token=host_secret",
  "inviteUrl": "/match/match_abc123?token=join_secret",
  "status": "waiting_for_second_player",
  "versions": {
    "multiplayerProtocolVersion": "0.2.0",
    "engineSchemaVersion": "0.2.0",
    "playerViewSchemaVersion": "0.2.0",
    "eventSchemaVersion": "0.2.0"
  }
}
```

Sicherheitsregeln:

- Klartexttoken wird nur in dieser Response bzw. im Link ausgegeben.
- Token wird nicht im Klartext gespeichert.
- Token wird nicht im Serverlog ausgegeben.
- Invite-Link erlaubt nur die freie Seite.
- Host-Seite ist nach Erstellung fixiert.

### 4.4 `GET /api/matches/:matchId/join-info`

Lädt minimale Informationen, die auf der Join-Seite angezeigt werden dürfen.

Response:

```json
{
  "matchId": "match_abc123",
  "status": "waiting_for_second_player",
  "availableSide": "corp",
  "rulesVersion": "26.03",
  "deckMode": "fixed_demo_decks",
  "requiresToken": true,
  "hostDisplayName": "Player A"
}
```

Nicht enthalten sein dürfen:

- Deckreihenfolgen,
- Handkarten,
- GameState,
- Sessiondetails,
- Tokenhashes,
- Host-Reconnect-Token,
- interne ControllerIds, falls nicht erforderlich.

### 4.5 `POST /api/matches/:matchId/join`

Validiert den Join-Token und erzeugt eine seitenspezifische Session für die freie Seite.

Request:

```json
{
  "token": "join_secret",
  "displayName": "Player B"
}
```

Response:

```json
{
  "matchId": "match_abc123",
  "side": "corp",
  "sessionToken": "side_specific_secret",
  "webSocketUrl": "/ws/matches/match_abc123",
  "status": "ready"
}
```

Fehlerfälle:

| Fall | Code | Verhalten |
|---|---|---|
| Match existiert nicht | `MATCH_NOT_FOUND` | Keine Details über Tokens. |
| Token ungültig | `AUTH_INVALID_TOKEN` | Keine Angabe, ob Match gültig wäre. |
| Token falsche Seite | `AUTH_WRONG_SIDE` | Generische Meldung. |
| Match bereits voll | `MATCH_NOT_ACTIVE` | Keine Session erzeugen. |
| Token abgelaufen | `AUTH_INVALID_TOKEN` | Optional generisch als ungültig behandeln. |

### 4.6 `POST /api/matches/:matchId/reconnect`

Stellt eine bestehende seitenspezifische Session wieder her.

Request:

```json
{
  "token": "side_specific_or_reconnect_secret",
  "clientProtocolVersion": "0.2.0"
}
```

Response:

```json
{
  "matchId": "match_abc123",
  "side": "runner",
  "sessionToken": "possibly_rotated_secret",
  "webSocketUrl": "/ws/matches/match_abc123",
  "status": "active",
  "matchVersion": 17,
  "stateVersion": 42
}
```

Regeln:

- Der Server bestimmt die Seite aus dem Token.
- Der Client darf keine Seite behaupten.
- Eine alte Verbindung derselben Seite wird ersetzt oder als stale markiert.
- Reconnect erzeugt kein Spielregelereignis, aber optional ein Match-Systemevent.

### 4.7 `GET /api/matches/:matchId/bootstrap`

Lädt den aktuellen seitenspezifischen Startzustand nach Tokenvalidierung.

Header oder Query:

```text
Authorization: Bearer <sessionToken>
```

Response:

```json
{
  "matchId": "match_abc123",
  "side": "runner",
  "matchVersion": 12,
  "stateVersion": 48,
  "playerView": {},
  "legalActions": [],
  "eventLogTail": [],
  "pendingChoice": null,
  "connectionStatus": {
    "corp": "connected",
    "runner": "connected"
  }
}
```

`playerView`, `legalActions`, `eventLogTail` und `pendingChoice` sind exakt so gefiltert wie über WebSocket.

### 4.8 `GET /api/matches/:matchId/replay`

Optionaler Endpoint für Export und Debugging.

Modi:

| Modus | Zugriff | Inhalt |
|---|---|---|
| `player` | SessionToken | Sichtgefilterter EventLog-Ausschnitt der eigenen Seite. |
| `public` | Optional | Nur öffentliche Events ohne private Details. |
| `debug` | Nur lokaler Entwickler- oder Serverkonsolenmodus | Vollständiger EventLog und StateHash-Prüfung. |

Der Debug-Modus darf im normalen privaten Internetbetrieb nicht über den Spielerclient erreichbar sein.

### 4.9 `GET /api/health`

Response:

```json
{
  "status": "ok",
  "version": "0.2.0",
  "storage": "ok",
  "time": "2026-05-03T00:00:00.000Z"
}
```

Nicht enthalten sein dürfen Match-IDs, Tokens, PlayerViews oder StateHashes aktiver Partien.

## 5. WebSocket-Protokoll

### 5.1 Verbindung

Endpoint:

```text
/ws/matches/:matchId
```

Der Client verbindet und sendet unmittelbar `join_match`. Der Server verarbeitet keine Spielnachrichten vor erfolgreichem Join.

### 5.2 Message Envelope

Alle WebSocket-Nachrichten enthalten mindestens `type`. Clientnachrichten sollen zusätzlich `clientMessageId` enthalten.

```ts
type ClientEnvelope<TType extends string, TPayload> = {
  type: TType
  clientMessageId?: string
} & TPayload
```

```ts
type ServerEnvelope<TType extends string, TPayload> = {
  type: TType
  serverMessageId?: string
  sentAt: string
} & TPayload
```

### 5.3 ClientMessage

```ts
type ClientMessage =
  | JoinMatchMessage
  | SubmitActionMessage
  | PassPriorityMessage
  | RequestUndoMessage
  | RespondUndoMessage
  | PingMessage
```

#### 5.3.1 `join_match`

```ts
type JoinMatchMessage = {
  type: "join_match"
  clientMessageId?: string
  matchId: string
  sessionToken: string
  clientProtocolVersion: string
}
```

Erfolg führt zu `match_joined`, danach `state_update`, `legal_actions`, `choice_request`, `event_log_update` und `opponent_status`.

#### 5.3.2 `submit_action`

```ts
type SubmitActionMessage = {
  type: "submit_action"
  clientMessageId?: string
  matchId: string
  action: PlayerAction
}
```

```ts
type PlayerAction = {
  matchId: string
  side: Side
  actionId: string
  selectedTargets: Record<string, string>
  selectedChoices: Record<string, unknown>
  clientKnownStateVersion: number
  idempotencyKey: string
}
```

Regeln:

- `action.side` muss zur Sessionseite passen.
- `matchId` in Envelope und Action muss übereinstimmen.
- `clientKnownStateVersion` muss zur aktuellen StateVersion passen, außer die Action ist ausdrücklich als idempotente Wiederholung bekannt.
- `idempotencyKey` muss pro Seite und StateVersion eindeutig sein.
- Choices werden bevorzugt ebenfalls als `submit_action` modelliert, wenn sie aus `LegalActions` stammen.

#### 5.3.3 `pass_priority`

```ts
type PassPriorityMessage = {
  type: "pass_priority"
  clientMessageId?: string
  matchId: string
  clientKnownStateVersion: number
  idempotencyKey: string
}
```

`pass_priority` kann intern in eine Engine-kompatible `PlayerAction` übersetzt werden. Es darf kein UI-Sonderweg entstehen, der die Engine umgeht.

#### 5.3.4 `request_undo`

```ts
type RequestUndoMessage = {
  type: "request_undo"
  clientMessageId?: string
  matchId: string
  toEventId: string
  reason?: string
}
```

`reason` ist optional, wird begrenzt und darf nicht als regelrelevantes Feld verwendet werden.

#### 5.3.5 `respond_undo`

```ts
type RespondUndoMessage = {
  type: "respond_undo"
  clientMessageId?: string
  matchId: string
  undoRequestId: string
  response: "accept" | "decline"
}
```

Nur die Gegenseite der anfragenden Seite darf antworten.

#### 5.3.6 `ping`

```ts
type PingMessage = {
  type: "ping"
  clientMessageId?: string
  clientTime: string
}
```

Der Server antwortet mit `pong`.

### 5.4 ServerMessage

```ts
type ServerMessage =
  | MatchJoinedMessage
  | StateUpdateMessage
  | LegalActionsMessage
  | EventLogUpdateMessage
  | ChoiceRequestMessage
  | ActionReceiptMessage
  | OpponentStatusMessage
  | UndoRequestMessage
  | UndoResolvedMessage
  | ErrorMessage
  | PongMessage
```

#### 5.4.1 `match_joined`

```ts
type MatchJoinedMessage = {
  type: "match_joined"
  serverMessageId?: string
  sentAt: string
  matchId: string
  side: Side
  matchVersion: number
  stateVersion: number
  protocolVersion: "0.2.0"
}
```

#### 5.4.2 `state_update`

```ts
type StateUpdateMessage = {
  type: "state_update"
  serverMessageId?: string
  sentAt: string
  matchId: string
  matchVersion: number
  stateVersion: number
  view: PlayerView
}
```

`view` ist seitenspezifisch. Für denselben `stateVersion` können Corp und Runner unterschiedliche Views erhalten.

#### 5.4.3 `legal_actions`

```ts
type LegalActionsMessage = {
  type: "legal_actions"
  serverMessageId?: string
  sentAt: string
  matchId: string
  stateVersion: number
  actions: LegalAction[]
}
```

`LegalAction` kann private Informationen enthalten. Deshalb darf sie nur an die berechtigte Seite gesendet werden.

#### 5.4.4 `choice_request`

```ts
type ChoiceRequestMessage = {
  type: "choice_request"
  serverMessageId?: string
  sentAt: string
  matchId: string
  stateVersion: number
  choice: ChoiceRequest | null
}
```

Für die nicht berechtigte Seite wird entweder `choice: null` oder ein generischer Wartezustand gesendet. Private Optionen des Gegners dürfen nicht enthalten sein.

#### 5.4.5 `event_log_update`

```ts
type EventLogUpdateMessage = {
  type: "event_log_update"
  serverMessageId?: string
  sentAt: string
  matchId: string
  events: PublicOrSideFilteredGameEvent[]
}
```

Events enthalten nur erlaubte Details. Ein PublicEvent nach HQ-Zugriff darf zum Beispiel nicht die nicht gesehenen HQ-Karten nennen.

#### 5.4.6 `action_receipt`

```ts
type ActionReceiptMessage = {
  type: "action_receipt"
  serverMessageId?: string
  sentAt: string
  matchId: string
  idempotencyKey: string
  accepted: boolean
  stateVersionBefore?: number
  stateVersionAfter?: number
  resultingEventIds?: string[]
  errorCode?: MultiplayerErrorCode
}
```

Bei doppeltem Idempotency-Key wird der gespeicherte Receipt erneut gesendet, sofern Payload und Kontext identisch sind.

#### 5.4.7 `opponent_status`

```ts
type OpponentStatusMessage = {
  type: "opponent_status"
  serverMessageId?: string
  sentAt: string
  matchId: string
  corp: "connected" | "disconnected"
  runner: "connected" | "disconnected"
}
```

#### 5.4.8 `undo_requested`

```ts
type UndoRequestServerMessage = {
  type: "undo_requested"
  serverMessageId?: string
  sentAt: string
  matchId: string
  undoRequest: {
    undoRequestId: string
    requestedBy: Side
    targetEventId: string
    targetStateVersion: number
    reason?: string
    status: "pending"
  }
}
```

Die Nachricht darf keine private Begründung der Hidden-Info-Prüfung enthalten.

#### 5.4.9 `undo_resolved`

```ts
type UndoResolvedMessage = {
  type: "undo_resolved"
  serverMessageId?: string
  sentAt: string
  matchId: string
  undoRequestId: string
  status: "accepted" | "declined" | "blocked" | "expired"
  publicReason?: string
  matchVersion: number
  stateVersion: number
}
```

`publicReason` bleibt allgemein, z. B. `"Undo wurde blockiert, weil seitdem verdeckte Information offengelegt wurde."`

#### 5.4.10 `error`

```ts
type ErrorMessage = {
  type: "error"
  serverMessageId?: string
  sentAt: string
  matchId?: string
  code: MultiplayerErrorCode
  message: string
  stateVersion?: number
  matchVersion?: number
  clientMessageId?: string
}
```

#### 5.4.11 `pong`

```ts
type PongMessage = {
  type: "pong"
  serverMessageId?: string
  sentAt: string
  clientTime: string
  serverTime: string
}
```

## 6. Fehlercodes

```ts
type MultiplayerErrorCode =
  | "AUTH_INVALID_TOKEN"
  | "AUTH_WRONG_SIDE"
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_ACTIVE"
  | "PROTOCOL_VERSION_UNSUPPORTED"
  | "ACTION_STALE_STATE_VERSION"
  | "ACTION_WRONG_SIDE"
  | "ACTION_NOT_LEGAL"
  | "ACTION_DUPLICATE_IDEMPOTENCY_KEY"
  | "ACTION_PROCESSING_LOCKED"
  | "UNDO_NOT_AVAILABLE"
  | "UNDO_REQUIRES_OPPONENT"
  | "UNDO_BLOCKED_BY_HIDDEN_INFORMATION"
  | "INTERNAL_VALIDATION_FAILED"
```

| Code | Bedeutung | Clientverhalten |
|---|---|---|
| `AUTH_INVALID_TOKEN` | Token ungültig, abgelaufen oder widerrufen | Join/Reconnect abbrechen, generische Meldung. |
| `AUTH_WRONG_SIDE` | Token passt nicht zur behaupteten Seite | Verbindung schließen oder neu authentifizieren. |
| `MATCH_NOT_FOUND` | Match nicht vorhanden | Zur Startseite zurückführen. |
| `MATCH_NOT_ACTIVE` | Matchstatus erlaubt Aktion nicht | Status neu laden. |
| `PROTOCOL_VERSION_UNSUPPORTED` | Client/Server inkompatibel | Reload oder Update anzeigen. |
| `ACTION_STALE_STATE_VERSION` | Client arbeitet auf altem State | Frischen StateUpdate abwarten. |
| `ACTION_WRONG_SIDE` | Actionseite passt nicht zur Session | Action verwerfen; mögliche Manipulation. |
| `ACTION_NOT_LEGAL` | Engine lehnt Action ab | LegalActions neu laden. |
| `ACTION_DUPLICATE_IDEMPOTENCY_KEY` | Doppelte oder widersprüchliche Action | Gespeicherten Receipt verwenden oder ablehnen. |
| `ACTION_PROCESSING_LOCKED` | Match verarbeitet gerade andere Action | Kurz warten; keine zweite Transition. |
| `UNDO_NOT_AVAILABLE` | Kein geeigneter Zielpunkt oder Snapshot | Undo deaktivieren. |
| `UNDO_REQUIRES_OPPONENT` | Zustimmung der Gegenseite fehlt | Anfrage anzeigen. |
| `UNDO_BLOCKED_BY_HIDDEN_INFORMATION` | Hidden-Info-Barrier liegt dazwischen | Undo als blockiert anzeigen. |
| `INTERNAL_VALIDATION_FAILED` | Server-/Engine-Invariante fehlgeschlagen | Match pausieren und Debugdaten sichern. |

## 7. Versandregel nach Engine-Transition

Nach jeder gültigen Engine-Transition sendet der Server in dieser Reihenfolge:

1. `action_receipt` an den absendenden Client.
2. `state_update` an Corp und Runner, jeweils mit eigener PlayerView.
3. `legal_actions` an Corp und Runner, jeweils mit eigenen LegalActions.
4. `choice_request` nur mit erlaubten Details der berechtigten Seite.
5. `event_log_update` mit seitenspezifisch gefilterten Events.
6. `opponent_status`, falls Verbindungszustände betroffen sind.

Bei abgelehnten Actions:

1. `action_receipt` mit `accepted: false`.
2. `error` mit generischem Text.
3. Aktuelle `state_update` und `legal_actions`, falls der Client stale sein könnte.
4. Keine Engine-Transition und kein neues GameEvent, außer optionales nicht-regelrelevantes Systemlog.

## 8. Idempotency

```ts
type ActionReceipt = {
  idempotencyKey: string
  matchId: string
  side: Side
  actionType: string
  actionPayloadHash: string
  receivedAt: string
  stateVersionBefore: number
  stateVersionAfter?: number
  accepted: boolean
  errorCode?: MultiplayerErrorCode
  resultingEventIds: string[]
}
```

Regeln:

- Schlüsselraum ist `(matchId, side, idempotencyKey)`.
- Derselbe Key mit identischem Payload und identischer StateVersion liefert denselben Receipt.
- Derselbe Key mit anderem Payload wird abgelehnt.
- Ein Key darf nicht für spätere StateVersions wiederverwendet werden.
- Der Client erzeugt für jede neue UI-Action einen frischen Key.

## 9. Locking und Concurrency

Für MVP 0.2 ist ein per-Match-Lock Pflicht.

Mindestverhalten:

```text
acquire lock(matchId)
  load current match state
  verify stateVersion
  verify idempotency
  apply engine action
  persist state + event + receipt atomically
release lock(matchId)
```

Wenn der Lock nicht verfügbar ist, darf der Server kurz warten oder `ACTION_PROCESSING_LOCKED` senden. Wichtig ist, dass nie zwei Engine-Transitionen parallel auf demselben Ausgangszustand committen.

## 10. Stale-State-Verhalten

Eine Action ist stale, wenn `clientKnownStateVersion` kleiner ist als die aktuelle `gameState.stateVersion` und kein gespeicherter Idempotency-Receipt für genau diese Action vorliegt.

Serververhalten:

1. Action ablehnen.
2. `ACTION_STALE_STATE_VERSION` senden.
3. Aktuelle PlayerView und LegalActions senden.
4. Keine Engine-Transition erzeugen.

Der Client darf stale Actions nicht automatisch erneut senden. Er muss die neue LegalActions-Liste anzeigen.

## 11. Reconnect über WebSocket

Reconnect nutzt denselben `join_match`-Handshake. Der Server erkennt anhand des SessionTokens, ob eine bestehende Seite wieder verbunden wird.

Mindestnachrichten nach erfolgreichem Reconnect:

```text
match_joined
state_update
legal_actions
choice_request
event_log_update
opponent_status
```

Spezialfälle:

| Situation | Erwartung |
|---|---|
| Reconnect während Corp-Rez-Choice | Corp erhält dieselbe Rez-Choice; Runner sieht nur Wartezustand. |
| Reconnect während Runner-Access | Runner erhält aktuelle Access-Entscheidung; Corp erhält keine zusätzlichen Runner-Privatdaten. |
| Reconnect nach Serverneustart | Match wird aus Storage geladen oder sauber pausiert. |
| Zweite Verbindung derselben Seite | Alte Verbindung wird stale oder geschlossen; keine divergierenden Eingaben. |

## 12. Undo-Protokoll

Undo ist kein Engine-Action-Shortcut, sondern ein Match-Service-Verfahren mit Engine-State-Restore.

Ablauf:

1. Client sendet `request_undo`.
2. Server prüft Ziel-Event, Snapshot, MatchStatus und Hidden-Info-Barrier.
3. Bei blockiertem Undo sendet Server `undo_resolved` mit `blocked`.
4. Bei zulässigem Undo sendet Server `undo_requested` an die Gegenseite.
5. Gegenseite sendet `respond_undo`.
6. Bei Ablehnung sendet Server `undo_resolved` mit `declined`.
7. Bei Zustimmung stellt Server State wieder her, schreibt Undo-Systemevent und sendet neue StateUpdates.

Undo darf nicht möglich sein nach:

- zufälligem HQ-Access mit offengelegter Karte,
- R&D-Access mit gesehener oberster Karte,
- Aufdecken verdeckter Archives-Karten,
- sichtbar gewordenen Shuffle-/Draw-Ergebnissen,
- Match-Ende,
- fehlendem Snapshot/Replayschutz.

## 13. Visibility-Regeln im Protokoll

Folgende Nachrichtentypen müssen mit einem Visibility-Oracle getestet werden:

- `state_update`
- `legal_actions`
- `choice_request`
- `event_log_update`
- `action_receipt`
- `error`
- REST `bootstrap`
- REST `replay`
- `undo_requested`
- `undo_resolved`

Verboten in falschen Payloads sind insbesondere:

- Corp-HQ-Kartentitel an Runner,
- R&D-Reihenfolge an Runner,
- Stack-Reihenfolge an Corp,
- Runner-Grip-Kartentitel an Corp,
- unrezzed ICE-Titel an Runner,
- verdeckte Remote-Kartentitel an Runner,
- interne CardInstanceIds verdeckter Karten,
- Klartexttokens,
- Full-State-Dumps.

## 14. Beispiel: vollständiger Action-Zyklus

Runner nimmt einen Credit.

Client sendet:

```json
{
  "type": "submit_action",
  "clientMessageId": "cm_001",
  "matchId": "match_abc123",
  "action": {
    "matchId": "match_abc123",
    "side": "runner",
    "actionId": "act_gain_credit_001",
    "selectedTargets": {},
    "selectedChoices": {},
    "clientKnownStateVersion": 12,
    "idempotencyKey": "idem_runner_12_001"
  }
}
```

Server antwortet mindestens:

```json
{
  "type": "action_receipt",
  "sentAt": "2026-05-03T10:00:00.000Z",
  "matchId": "match_abc123",
  "idempotencyKey": "idem_runner_12_001",
  "accepted": true,
  "stateVersionBefore": 12,
  "stateVersionAfter": 13,
  "resultingEventIds": ["evt_013"]
}
```

Danach folgen seitenspezifische `state_update`, `legal_actions` und `event_log_update`.

## 15. Testpflichten für die Schnittstelle

Jede Implementierung dieser Spezifikation muss folgende Tests bestehen:

- Match erstellen erzeugt Host-Session und Invite-Link.
- Join-Link erlaubt genau freie Seite.
- Falscher Token leakt keine Matchdetails.
- WebSocket ohne `join_match` verarbeitet keine Actions.
- `submit_action` falscher Seite wird abgelehnt.
- Stale Action wird abgelehnt und resynchronisiert.
- Doppelte Action mit gleichem Idempotency-Key erzeugt eine Transition.
- Gleichzeitige Actions erzeugen keinen divergierenden State.
- Reconnect stellt PlayerView und PendingChoice korrekt wieder her.
- Undo vor Hidden Information funktioniert mit Zustimmung.
- Undo nach Hidden Information wird blockiert.
- Alle ausgehenden Messages bestehen Visibility-Oracle-Prüfung.
