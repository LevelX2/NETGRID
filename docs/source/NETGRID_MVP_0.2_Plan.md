# NETGRID-Webapplikation – MVP 0.2 Plan

**Status:** Planungsfassung für Entwicklung  
**Stand:** 03.05.2026  
**Primärer Fokus:** Private Human-vs-Human-Partie über Internet  
**Dokumenttyp:** detaillierter Scope-, Architektur-, Umsetzungs- und Testplan  
**Voraussetzung:** MVP 0.1 ist nach den definierten Gates abgeschlossen oder in den für Multiplayer relevanten Teilen stabil genug.

---

## Inhaltsverzeichnis

- 1. Kurzentscheidung
- 2. Ziel von MVP 0.2
- 3. Ausgangslage aus MVP 0.1
- 4. Nicht-Ziele für MVP 0.2
- 5. Leitprinzipien
- 6. Zielnutzer und Nutzungsszenarien
- 7. Verbindliche Voraussetzungen vor Start
- 8. Versionierte Baseline für MVP 0.2
- 9. Produktumfang
- 10. Match-Lifecycle
- 11. Rollen, Controller, Sessions und Tokens
- 12. REST-Schnittstellen
- 13. WebSocket-Protokoll
- 14. Serverautorität und Action-Pipeline
- 15. PlayerViews und Visibility-Härtung
- 16. Reconnect und Disconnect
- 17. Pass, Priority und ChoiceRequests
- 18. Undo mit Zustimmung
- 19. Persistenz, Snapshots und Migration
- 20. UI-/UX-Plan
- 21. Sicherheits- und Betriebsplan
- 22. Teststrategie für Multiplayer
- 23. Akzeptanzkriterien
- 24. Definition of Done
- 25. Arbeitspakete
- 26. Minimaler Backlog
- 27. Umsetzungsetappen
- 28. Risiken und Gegenmaßnahmen
- 29. Offene Entscheidungen
- 30. Konsolidierte Kernformel

---

## 1. Kurzentscheidung

MVP 0.2 erweitert MVP 0.1 nicht primär durch neue Karten, neue Regeln oder stärkere KI. MVP 0.2 erweitert die Anwendung um eine private Human-vs-Human-Partie über Internet.

Die zentrale Entscheidung lautet:

> MVP 0.2 baut einen serverautoritativen Multiplayer-Match-Server mit privaten Einladungslinks, WebSocket-Synchronisation, getrennten PlayerViews, Reconnect und kontrolliertem Undo. Die Rules Engine bleibt die alleinige Regelautorität.

Damit wird v0.2 zu einer Netzwerk-, Synchronisations-, Visibility- und Persistenzstufe. Der Kartenpool bleibt bewusst klein und kontrolliert. Die Demo-Decks aus 0.1 bleiben die primäre Spielbasis, damit nicht gleichzeitig Multiplayer und ein breiter Kartenpool stabilisiert werden müssen.

Die wichtigsten technischen Konsequenzen:

- Der vollständige GameState bleibt ausschließlich serverseitig bzw. engine-intern autoritativ.
- Beide Clients erhalten nach jeder Transition nur ihre jeweilige PlayerView.
- WebSocket-Nachrichten dürfen keine verdeckten Informationen enthalten.
- Jede PlayerAction wird gegen Match-Version, StateVersion, Seite, Token, Timingpunkt, Kosten und Targets validiert.
- Actions werden pro Match strikt sequenziell verarbeitet.
- Jede Action besitzt einen Idempotency-Key.
- Reconnect liefert nur aktuelle PlayerView, LegalActions und zulässige öffentliche bzw. seitenspezifische Events.
- Undo ist nur nach Zustimmung beider Seiten erlaubt und wird nach relevantem Informationsgewinn blockiert oder streng begrenzt.
- Test- und Visibility-Gates sind für v0.2 wichtiger als UI-Politur.

---

## 2. Ziel von MVP 0.2

Ein Spieler kann privat ein Match erstellen, eine Seite wählen und einen Einladungslink an eine zweite Person senden. Die zweite Person kann über diesen Link beitreten, die freie Seite übernehmen und gemeinsam über das Internet eine regelgeführte Partie spielen.

Die Partie verwendet weiterhin die stabilen Demo-Decks und denselben Engine-Kern aus MVP 0.1. Die UI zeigt beiden Spielern denselben öffentlichen Spielzustand, aber jeweils nur die eigenen privaten Informationen. Aktionen werden über WebSocket eingereicht und durch die Engine verarbeitet. Nach jeder gültigen Aktion werden beide Clients aktualisiert.

MVP 0.2 ist erfolgreich, wenn eine vollständige private Partie zwischen zwei menschlichen Spielern ohne manuelle State-Korrektur spielbar ist und Multiplayer-spezifische Fehlerklassen durch Tests abgedeckt sind: falsche Seite, falscher Token, stale StateVersion, doppelte Action, Race Condition, Reconnect, Undo und Hidden-Info-Leak.

---

## 3. Ausgangslage aus MVP 0.1

MVP 0.1 liefert die notwendige Grundlage:

| Bereich | Erwarteter Stand aus 0.1 | Bedeutung für 0.2 |
|---|---|---|
| Engine | `createGame`, `getLegalActions`, `applyAction`, `getPlayerView`, `validateGameState`, `hashState`, `replayEvents` | 0.2 nutzt dieselbe Engine, statt Multiplayer-Regeln in UI oder Server zu duplizieren. |
| EventLog | Versionierte Events mit StateVersion und StateHash | Grundlage für Sync, Reconnect, Undo und Debugging. |
| PlayerViews | Getrennte Sicht pro Seite | Sicherheitskritisch für Human-vs-Human. |
| LegalActions | Engine liefert legale Aktionen pro Seite | UI und WebSocket-Clients wählen nur aus angebotenen Actions. |
| Demo-Decks | Runner Demo Deck 01 und Corp Demo Deck 01 | Multiplayer startet kontrolliert mit bekanntem Kartenpool. |
| Visibility-Tests | Keine verdeckten Daten in PlayerViews, PublicEvents, KI-Input oder Fehlern | Muss in 0.2 auf WebSocket, Reconnect und Undo erweitert werden. |
| Replay/StateHash | Reproduzierbare Beispielpartien | Wichtig für Multiplayer-Regressionen und Debugging. |
| Backend-Vorbereitung | Match-Struktur, Controller, Storage-Adapter optional | Wird in 0.2 konkretisiert und produktiv genutzt. |

MVP 0.2 darf erst beginnen, wenn die Engine-API stabil genug ist, um PlayerActions serverseitig transaktional zu verarbeiten. Falls einzelne 0.1-UI-Details noch unfertig sind, kann 0.2 trotzdem vorbereitet werden, solange Engine, PlayerViews, LegalActions und EventLog belastbar sind.

---

## 4. Nicht-Ziele für MVP 0.2

Für MVP 0.2 ausdrücklich nicht bauen:

- Kein öffentliches Matchmaking.
- Keine Lobby-Liste aller aktiven Spiele.
- Keine Ranglisten, Turniere, Moderation oder öffentliche Profile.
- Kein freier Deckbau als Muss-Kriterium.
- Keine Formatvalidierung, Rotation, Banlisten oder Einflussprüfung.
- Kein breiter Kartenpool.
- Keine neue starke KI als Schwerpunkt.
- Keine LLM-KI.
- Kein Zuschauer-Modus als Muss-Kriterium.
- Kein öffentlicher Replay-Browser.
- Kein Chat als Muss-Kriterium.
- Kein vollwertiges Accountsystem als Muss-Kriterium.
- Keine Smartphone-Optimierung als Abnahmekriterium.
- Keine komplexen Zeitregeln, Schachuhren oder Turnier-Disconnect-Regeln.
- Kein automatisches Regelverständnis aus Kartentexten.

Optional vorbereitbar, aber nicht abnahmekritisch:

- Account-Anbindung für spätere Versionen.
- Chat-Nachrichten im Match.
- Zuschauer-Link.
- Match-Passwort zusätzlich zum Token.
- Export einer Multiplayer-Partie als Replay-Datei.

---

## 5. Leitprinzipien

| Prinzip | Konsequenz für 0.2 |
|---|---|
| Engine bleibt Regelautorität | Der Server reicht PlayerActions an die Engine weiter; UI und WebSocket-Code interpretieren keine Regeln. |
| Serverautoritativer Multiplayer | Kein Client besitzt den vollständigen GameState. Clients senden Absichten, nicht Zustände. |
| Keine Hidden-Info-Leaks | WebSocket-Payloads, Reconnect-Payloads, Undo-Zustände, Fehler und Logs werden gefiltert. |
| Transaktionale Actions | Pro Match wird immer nur eine Engine-Transition gleichzeitig verarbeitet. |
| Idempotenz | Doppelte WebSocket-Sendungen dürfen keine doppelte Transition erzeugen. |
| Versionierung | Match-Version, StateVersion, Event-Schema und PlayerView-Schema sind explizit. |
| Reconnect statt Matchverlust | Kurzfristige Verbindungsabbrüche pausieren oder markieren das Match, zerstören aber nicht den State. |
| Undo nur kontrolliert | Undo darf keinen unfairen Vorteil durch bereits gesehene verdeckte Information erzeugen. |
| Tests vor Komfort | Multiplayer-Tests und Visibility-Tests sind Gates, nicht spätere Ergänzungen. |
| Kleiner Kartenpool | 0.2 stabilisiert Human-vs-Human, nicht Karteneffekt-Komplexität. |

---

## 6. Zielnutzer und Nutzungsszenarien

| Nutzerrolle | Bedarf | Relevanz für MVP 0.2 |
|---|---|---|
| Privater Host | Erstellt ein Match und verschickt den Link. | Primär. |
| Eingeladener Spieler | Tritt per Link bei und übernimmt die freie Seite. | Primär. |
| Entwickler | Reproduziert Multiplayer-Bugs, prüft Visibility und Reconnect. | Primär für Qualitätssicherung. |
| Lokaler Tester | Startet zwei Browserfenster und simuliert beide Spieler. | Wichtig für Entwicklung. |
| KI-Spieler | Nicht Ziel von 0.2, kann aber als späterer Controller weiter kompatibel bleiben. | Sekundär. |

### 6.1 Kern-User-Journey: Match erstellen und spielen

1. Spieler A öffnet die private Webapp.
2. Spieler A wählt „Neues privates Spiel“.
3. Spieler A wählt Seite: Corp, Runner oder zufällig.
4. Die App erzeugt ein Match mit festem Demo-Deckpaar und RulesBaseline.
5. Die App erzeugt einen privaten Einladungslink mit geheimem Join-Token.
6. Spieler A teilt den Link außerhalb der App.
7. Spieler B öffnet den Link.
8. Der Server validiert Token und Match-Status.
9. Spieler B übernimmt die freie Seite.
10. Beide Clients verbinden sich per WebSocket.
11. Der Server sendet beiden Clients ihre jeweilige PlayerView.
12. Die aktive Seite wählt eine LegalAction.
13. Der Server validiert, verarbeitet und protokolliert die Action.
14. Beide Clients erhalten aktualisierte PlayerViews, LegalActions und Events.
15. Bei Disconnect kann der betroffene Spieler über denselben Link reconnecten.
16. Das Match endet durch die in 0.1 unterstützten Siegbedingungen.

### 6.2 Debug-User-Journey

1. Entwickler startet ein lokales Match in zwei Browserfenstern.
2. Beide Fenster zeigen getrennte Side-Views.
3. Entwickler führt gezielt Actions aus, darunter Run, Access, Agenda-Steal und Agenda-Score.
4. Während der Partie werden WebSocket-Nachrichten im Debug-Panel sichtbar gemacht.
5. Das Debug-Panel zeigt nur erlaubte Daten für die jeweilige Seite.
6. Der Entwickler kann EventLog, StateVersion, Match-Version, StateHash und letzte Action prüfen.
7. Nach Reconnect wird kontrolliert, ob View und LegalActions identisch zur serverseitigen Wahrheit sind.

### 6.3 Reconnect-User-Journey

1. Spieler A verliert während einer Action Phase oder während eines Runs die Verbindung.
2. Der Server markiert die Session als disconnected.
3. Spieler B sieht einen Verbindungsstatus, aber keine privaten Daten von Spieler A.
4. Das Match bleibt aktiv oder wird in einen pausierten Anzeigezustand versetzt.
5. Spieler A öffnet denselben Link erneut.
6. Der Server validiert Token und Side-Berechtigung.
7. Spieler A erhält aktuelle PlayerView, LegalActions, EventLog-Auszug und PendingChoices.
8. Die Partie wird fortgesetzt.

---

## 7. Verbindliche Voraussetzungen vor Start

MVP 0.2 sollte erst in die eigentliche Implementierung gehen, wenn folgende Punkte aus 0.1 vorhanden sind:

| Voraussetzung | Mindestzustand |
|---|---|
| Engine-API | `applyAction` ist rein, deterministisch und validiert Actions erneut. |
| PlayerViews | `getPlayerView(gameState, side)` ist getestet und leakt keine verdeckten Daten. |
| LegalActions | LegalActions enthalten `side`, `actionId`, `timingPoint`, `costs`, `targetRequirements`, `expiresAtStateVersion`. |
| PlayerActions | PlayerActions enthalten `matchId`, `side`, `actionId`, `selectedTargets`, `selectedChoices`, `clientKnownStateVersion`, `idempotencyKey`. |
| EventLog | Jede Transition erzeugt Event mit StateVersion vorher/nachher und StateHash. |
| StateHash | Hash ist reproduzierbar über kanonische Serialisierung. |
| Demo-Decks | Beide Demo-Decks sind spielbar oder für Multiplayer-Spielbarkeit ausreichend stabil. |
| Visibility-Tests | Basistests gegen Hidden-Info-Leaks bestehen. |
| Storage-Adapter | Mindestens JSON- oder SQLite-Speicherung für Match, State, EventLog und Snapshots. |
| UI-Basis | Game Board kann LegalActions und ChoiceRequests anzeigen. |

Falls ein Punkt fehlt, wird er als 0.2-Vorarbeit eingeplant und nicht als optionaler Rest betrachtet.

---

## 8. Versionierte Baseline für MVP 0.2

MVP 0.2 verwendet eine eigene Baseline, die Replays, Multiplayer-Logs und spätere Migrationen nachvollziehbar macht.

```ts
type RulesBaseline = {
  rulesVersion: string
  cardTextSource: "netgriddb" | "local_snapshot" | "manual"
  cardTextSnapshotId: string
  engineSchemaVersion: string
  cardImplementationVersion: string
  deviationRegistryVersion: string
  multiplayerProtocolVersion: string
  playerViewSchemaVersion: string
}
```

Empfohlene Baseline:

```json
{
  "rulesVersion": "26.03",
  "cardTextSource": "manual",
  "cardTextSnapshotId": "mvp-0.1-demo",
  "engineSchemaVersion": "0.2.0",
  "cardImplementationVersion": "0.1.0",
  "deviationRegistryVersion": "0.2.0",
  "multiplayerProtocolVersion": "0.2.0",
  "playerViewSchemaVersion": "0.2.0"
}
```

Wichtige Entscheidung: `cardImplementationVersion` darf zunächst bei `0.1.0` bleiben, wenn keine neuen spielbaren Karten eingeführt werden. Das macht klar, dass 0.2 eine Multiplayer-Version ist und keine Kartenpool-Version.

---

## 9. Produktumfang

### 9.1 Enthalten in MVP 0.2

| Bereich | Umfang |
|---|---|
| Match-Erstellung | Neues privates Match mit fester RulesBaseline und Demo-Decks. |
| Seitenwahl | Host wählt Corp, Runner oder Random; Joiner übernimmt freie Seite. |
| Einladungslink | Geheimer Token-Link zum Beitritt. |
| Join | Zweiter Spieler kann freie Seite übernehmen. |
| Reconnect | Berechtigter Spieler kann dieselbe Seite wieder aufnehmen. |
| WebSocket | Bidirektionale Updates für PlayerView, LegalActions, Events, Choices, Fehler und Status. |
| Serverautorität | Server verarbeitet Actions seriell und nur über Engine. |
| Synchronisation | Beide Spieler erhalten nach jeder Transition konsistente, gefilterte Views. |
| Visibility | Automatische Leak-Tests für WebSocket, Reconnect, Undo und EventLog. |
| Pass/Priority | Notwendige Pass-Actions und Priority-Fortschritt für bestehende Timingpunkte. |
| Undo | Undo-Anfrage, Zustimmung, Ablehnung, Block nach Informationsgewinn. |
| Persistenz | Speicherung aktiver Matches, EventLogs und Snapshots. |
| Debug | Entwickleransicht für Match-Version, StateVersion, StateHash, Connections und letzte Events. |
| Deployment | Privater Betrieb lokal, im LAN oder auf privatem Server mit HTTPS/WSS außerhalb localhost. |

### 9.2 Weiterhin aus 0.1 übernommen

| Bereich | Verhalten in 0.2 |
|---|---|
| Demo-Decks | Weiterhin Runner Demo Deck 01 und Corp Demo Deck 01. |
| Kartenpool | Nur `playable_mvp` Karten aus dem Manifest. |
| Regelumfang | Kein Ausbau komplexer Regeln, außer sie sind für Multiplayer-Sync nötig. |
| Replay | Weiterhin Qualitätsinstrument; optional UI-Export. |
| KI | Kann für Testzwecke existieren, ist aber nicht Kern von 0.2. |

### 9.3 Bewusst nicht enthalten

| Bereich | Grund |
|---|---|
| Freier Deckbau | Würde Kartenpool, Validierung und UI stark erweitern. |
| Öffentliches Matchmaking | Nicht nötig für private Einladungslinks. |
| Accountsystem | Token-Links reichen für frühe private Spiele. |
| Vollständiger Chat | Kann später ergänzt werden. |
| Zuschaueransicht | Erhöht Visibility-Komplexität; nach stabiler Human-vs-Human-Basis. |
| Zeitkontrolle | Nicht nötig für private Lern- und Testpartien. |

---

## 10. Match-Lifecycle

### 10.1 Match-Status

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

### 10.2 Statusübergänge

| Von | Nach | Auslöser |
|---|---|---|
| `creating` | `waiting_for_second_player` | Match wurde mit Host-Seite und InviteToken erstellt. |
| `waiting_for_second_player` | `ready` | Joiner übernimmt freie Seite. |
| `ready` | `active` | Beide Seiten verbunden, Setup validiert, Spiel gestartet. |
| `active` | `paused_disconnect` | Aktiver oder nichtaktiver Spieler verliert Verbindung, je nach Einstellung. |
| `paused_disconnect` | `active` | Berechtigter Spieler reconnectet. |
| `active` | `finished` | Engine setzt Winner. |
| `waiting_for_second_player` | `abandoned` | Host bricht ab oder Match läuft ab. |
| `paused_disconnect` | `abandoned` | Optional manuelles Abbrechen im privaten Betrieb. |

### 10.3 Match-Modell

```ts
type Match = {
  id: string
  status: MatchStatus
  matchVersion: number
  baseline: RulesBaseline
  createdAt: string
  updatedAt: string
  expiresAt?: string
  settings: MatchSettings
  corpController: PlayerController
  runnerController: PlayerController
  sessions: PlayerSession[]
  inviteTokens: InviteToken[]
  gameState: GameState
  eventLog: GameEvent[]
  publicEventLog: PublicGameEvent[]
  snapshots: StateSnapshot[]
  actionReceipts: ActionReceipt[]
  pendingUndoRequest?: UndoRequest
}
```

### 10.4 MatchSettings

```ts
type MatchSettings = {
  mode: "human_vs_human_private"
  deckMode: "fixed_demo_decks"
  allowSpectators: false
  allowUndo: true
  pauseOnDisconnect: true
  autoStartWhenBothConnected: true
  maxEventLogTailForClient: number
  actionTimeoutMs?: number
  inviteTokenExpiresAt?: string
}
```

Empfohlene Defaults:

```json
{
  "mode": "human_vs_human_private",
  "deckMode": "fixed_demo_decks",
  "allowSpectators": false,
  "allowUndo": true,
  "pauseOnDisconnect": true,
  "autoStartWhenBothConnected": true,
  "maxEventLogTailForClient": 100
}
```

---

## 11. Rollen, Controller, Sessions und Tokens

### 11.1 PlayerController

```ts
type PlayerController = {
  controllerId: string
  side: "corp" | "runner"
  type: "human_remote" | "human_local" | "ai" | "replay"
  userId?: string
  displayName?: string
  connected: boolean
  sessionId?: string
  lastSeenAt?: string
}
```

Für MVP 0.2 sind `human_remote` und optional `human_local` relevant. `ai` und `replay` bleiben kompatibel, sind aber nicht Ziel.

### 11.2 PlayerSession

```ts
type PlayerSession = {
  sessionId: string
  matchId: string
  side: "corp" | "runner"
  tokenId: string
  connectionId?: string
  connected: boolean
  createdAt: string
  lastSeenAt: string
  userAgentHash?: string
  ipHash?: string
}
```

Die Session ist die kurzfristige Verbindung eines Spielers zu einem Match. Sie darf nicht als Regelquelle verwendet werden. Die Engine kennt keine Sessions.

### 11.3 InviteToken

```ts
type InviteToken = {
  tokenId: string
  tokenHash: string
  matchId: string
  allowedSide: "corp" | "runner" | "join_free_side" | "reconnect_existing_side"
  issuedToSide?: "corp" | "runner"
  createdAt: string
  expiresAt?: string
  revokedAt?: string
  usedAt?: string
  useCount: number
}
```

Empfehlung:

- Token wird nie im Klartext gespeichert, sondern nur gehasht.
- Link enthält Match-ID und Token.
- Der Host erhält einen eigenen Reconnect-Token.
- Der Join-Link erlaubt nur die freie Seite.
- Nach Join wird für den zweiten Spieler eine seitenspezifische Session erzeugt.
- Reconnect darf dieselbe Seite wieder aufnehmen, aber nicht die Gegenseite übernehmen.

### 11.4 Seitenwahl

| Auswahl des Hosts | Ergebnis |
|---|---|
| Host wählt Runner | Host erhält Runner-Session, Joiner erhält Corp. |
| Host wählt Corp | Host erhält Corp-Session, Joiner erhält Runner. |
| Host wählt Random | Server entscheidet per Seed, schreibt Ergebnis ins EventLog oder MatchLog. |

Die Seitenwahl ist keine Engine-Action, sondern Match-Setup. Sie wird vor `createGame` oder im Match-Setup verarbeitet.

---

## 12. REST-Schnittstellen

REST wird für Match-Erstellung, Join, initiale Ladezustände und optionalen Replay-/Exportzugriff genutzt. Laufende Actions laufen über WebSocket.

### 12.1 Endpunkte

| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/api/matches` | Privates Match erstellen. |
| `GET` | `/api/matches/:matchId/join-info` | Öffentliche, minimale Join-Info laden. |
| `POST` | `/api/matches/:matchId/join` | Token validieren und freie Seite übernehmen. |
| `POST` | `/api/matches/:matchId/reconnect` | Seitensession wiederherstellen. |
| `GET` | `/api/matches/:matchId/bootstrap` | Initiale PlayerView nach Token-Validierung laden. |
| `GET` | `/api/matches/:matchId/replay` | Optional: gefiltertes Replay oder Debug-Replay lokal laden. |

### 12.2 Match erstellen

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

Response:

```json
{
  "matchId": "match_abc123",
  "hostSide": "runner",
  "hostReconnectUrl": "/match/match_abc123?token=host_secret",
  "inviteUrl": "/match/match_abc123?token=join_secret",
  "status": "waiting_for_second_player"
}
```

### 12.3 Join-Info

Dieser Endpunkt darf keine privaten Kartendaten enthalten.

Response:

```json
{
  "matchId": "match_abc123",
  "status": "waiting_for_second_player",
  "availableSide": "corp",
  "rulesVersion": "26.03",
  "deckMode": "fixed_demo_decks",
  "requiresToken": true
}
```

### 12.4 Join

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

### 12.5 Bootstrap

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

`playerView` wird hier absichtlich nicht ausgeschrieben. Das konkrete Schema kommt aus der Engine bzw. Shared Types.

---

## 13. WebSocket-Protokoll

### 13.1 Grundsatz

WebSocket dient nur der laufenden Partie. Jede eingehende Nachricht wird authentifiziert, gegen Match und Seite geprüft und serverseitig verarbeitet. Jede ausgehende Nachricht ist seitenspezifisch gefiltert.

### 13.2 ClientMessage

```ts
type ClientMessage =
  | JoinMatchMessage
  | SubmitActionMessage
  | PassPriorityMessage
  | RequestUndoMessage
  | RespondUndoMessage
  | PingMessage
```

```ts
type JoinMatchMessage = {
  type: "join_match"
  matchId: string
  sessionToken: string
  clientProtocolVersion: string
}

type SubmitActionMessage = {
  type: "submit_action"
  matchId: string
  action: PlayerAction
}

type PassPriorityMessage = {
  type: "pass_priority"
  matchId: string
  clientKnownStateVersion: number
  idempotencyKey: string
}

type RequestUndoMessage = {
  type: "request_undo"
  matchId: string
  toEventId: string
  reason?: string
}

type RespondUndoMessage = {
  type: "respond_undo"
  matchId: string
  undoRequestId: string
  response: "accept" | "decline"
}

type PingMessage = {
  type: "ping"
  clientTime: string
}
```

### 13.3 ServerMessage

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

```ts
type MatchJoinedMessage = {
  type: "match_joined"
  matchId: string
  side: "corp" | "runner"
  matchVersion: number
  stateVersion: number
  protocolVersion: string
}

type StateUpdateMessage = {
  type: "state_update"
  matchId: string
  matchVersion: number
  stateVersion: number
  view: PlayerView
}

type LegalActionsMessage = {
  type: "legal_actions"
  matchId: string
  stateVersion: number
  actions: LegalAction[]
}

type EventLogUpdateMessage = {
  type: "event_log_update"
  matchId: string
  events: PublicOrSideFilteredGameEvent[]
}

type ChoiceRequestMessage = {
  type: "choice_request"
  matchId: string
  stateVersion: number
  choice: ChoiceRequest | null
}

type ActionReceiptMessage = {
  type: "action_receipt"
  matchId: string
  idempotencyKey: string
  accepted: boolean
  stateVersionBefore?: number
  stateVersionAfter?: number
  resultingEventIds?: string[]
}

type OpponentStatusMessage = {
  type: "opponent_status"
  matchId: string
  corp: "connected" | "disconnected"
  runner: "connected" | "disconnected"
}

type ErrorMessage = {
  type: "error"
  matchId?: string
  code: MultiplayerErrorCode
  message: string
  stateVersion?: number
  matchVersion?: number
}
```

### 13.4 Fehlercodes

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

Fehlermeldungen dürfen keine privaten Kartentitel, CardIds oder verdeckten Targets enthalten. Beispiel: Nicht „Du kannst unrezzed Simple Barrier ICE nicht rezzen, weil ...“ an den Runner senden, sondern „Die gewählte Aktion ist für diese Seite nicht legal.“

### 13.5 Versandregel nach Engine-Transition

Nach jeder gültigen Engine-Transition sendet der Server pro Seite:

1. `action_receipt` an den absendenden Client.
2. `state_update` mit `getPlayerView(gameState, side)`.
3. `legal_actions` für diese Seite, falls die Seite eine Entscheidung treffen kann oder UI-Aktualisierung nötig ist.
4. `choice_request` nur für die berechtigte Seite.
5. `event_log_update` mit seitenspezifisch gefilterten Events.
6. `opponent_status`, falls sich Connection-Zustände geändert haben.

---

## 14. Serverautorität und Action-Pipeline

### 14.1 Grundsatz

Der Client sendet keine Zustandsänderung, sondern eine Absicht. Der Server entscheidet nicht über Spielregeln, sondern validiert Authentifizierung, Match-Zustand und Nebenbedingungen und übergibt die Action an die Engine.

### 14.2 Pipeline

1. WebSocket-Nachricht empfangen.
2. SessionToken validieren.
3. Match laden.
4. Seite aus Session bestimmen.
5. Prüfen, ob Match aktiv bzw. fortsetzbar ist.
6. Prüfen, ob `action.side` zur Session-Seite passt.
7. Idempotency-Key prüfen.
8. Match-Lock erwerben.
9. StateVersion prüfen.
10. `applyAction(gameState, playerAction)` aufrufen.
11. EngineResult validieren.
12. GameState, EventLog, Snapshot-Position und ActionReceipt speichern.
13. Match-Version erhöhen.
14. PlayerViews neu berechnen.
15. Seitenspezifische WebSocket-Updates senden.
16. Match-Lock freigeben.

### 14.3 Locking

```ts
type MatchLock = {
  matchId: string
  acquiredAt: string
  owner: string
  expiresAt: string
}
```

Für MVP 0.2 reicht ein In-Memory-Lock, wenn nur ein Serverprozess betrieben wird. Sobald mehrere Prozesse oder mehrere Serverinstanzen möglich sind, muss der Lock in der Datenbank oder in einem dedizierten Lock-System liegen.

Empfehlung für 0.2:

- Lokal/privat: In-Memory-Lock akzeptabel.
- Persistenter privater Server: SQLite-Transaktion bevorzugt.
- Spätere Skalierung: PostgreSQL-Transaktion oder Redis-Lock.

### 14.4 Idempotency

```ts
type ActionReceipt = {
  idempotencyKey: string
  matchId: string
  side: "corp" | "runner"
  actionType: string
  receivedAt: string
  stateVersionBefore: number
  stateVersionAfter?: number
  accepted: boolean
  errorCode?: MultiplayerErrorCode
  resultingEventIds: string[]
}
```

Regel:

- Derselbe Idempotency-Key derselben Seite für dieselbe StateVersion darf nicht zweimal verarbeitet werden.
- Wenn dieselbe Nachricht erneut eintrifft, sendet der Server den gespeicherten Receipt erneut.
- Wenn derselbe Key mit anderem Inhalt eintrifft, wird die Action abgelehnt.

### 14.5 Stale Actions

Eine Action ist stale, wenn `clientKnownStateVersion` kleiner als die aktuelle `gameState.stateVersion` ist.

Serververhalten:

- Action ablehnen.
- Aktuelle PlayerView und LegalActions an den Client senden.
- Keine Engine-Transition erzeugen.
- Kein privates Detail in Fehlertext aufnehmen.

---

## 15. PlayerViews und Visibility-Härtung

### 15.1 Grundsatz

In 0.2 reicht es nicht, verdeckte Informationen in der UI auszublenden. Sie dürfen im falschen Payload gar nicht vorhanden sein. Das gilt für:

- `state_update`
- `legal_actions`
- `choice_request`
- `event_log_update`
- `action_receipt`
- Fehlermeldungen
- Reconnect-Bootstrap
- Undo-Vorschau
- Debug-Panel im normalen Spielerclient
- Clientseitige Logs

### 15.2 Sichtbarkeitsbereiche

| Information | Corp darf sehen | Runner darf sehen | PublicEvent darf enthalten |
|---|---:|---:|---:|
| Corp HQ Karten | Ja | Nein | Nein |
| Corp R&D Karten | Ja | Nein | Nein |
| Corp Archives faceup | Ja | Ja | Ja, falls öffentlich aufgedeckt |
| Corp Archives facedown | Ja | Nein bis Breach-Aufdeckung | Nein |
| Unrezzed ICE Titel | Ja | Nein | Nein |
| Unrezzed Root-Karten im Remote | Ja | Nein | Nein |
| Rezzed ICE Titel | Ja | Ja | Ja |
| Rezzed Asset/Upgrade | Ja | Ja | Ja |
| Runner Grip | Ja für Runner-Seite | Runner sieht eigene Hand; Corp nicht | Nein |
| Runner Stack Reihenfolge | Runner nicht vollständig, Corp nein | Nein | Nein |
| Runner Heap faceup | Ja | Ja | Ja |
| Score Areas | Ja | Ja | Ja |
| Credits/Clicks/Tags/Bad Publicity | Ja | Ja | Ja |
| PendingChoice private Optionen | Nur berechtigte Seite | Nur berechtigte Seite | Nein |

### 15.3 PlayerView-Schema

```ts
type PlayerViewEnvelope = {
  schemaVersion: string
  matchId: string
  side: "corp" | "runner"
  matchVersion: number
  stateVersion: number
  view: PlayerView
  legalActions: LegalAction[]
  pendingChoice: ChoiceRequest | null
  publicEventTail: PublicOrSideFilteredGameEvent[]
}
```

Wichtig: `LegalAction` selbst kann private Informationen enthalten, wenn sie z. B. eine Corp-Option zum Rezzen eines bestimmten unrezzed ICE beschreibt. Deshalb müssen LegalActions seitenbezogen berechnet und versendet werden.

### 15.4 Leak-Test-Regeln

Automatisierte Tests prüfen mindestens:

- Runner-WebSocket-Payload enthält keine Corp-HQ-Titel.
- Runner-WebSocket-Payload enthält keine R&D-Reihenfolge.
- Runner-WebSocket-Payload enthält keine Titel unrezzed ICE.
- Corp-WebSocket-Payload enthält keine Runner-Grip-Titel.
- PublicEvent nach HQ-Zugriff nennt keine nicht offengelegten HQ-Karten.
- Reconnect-Payload ist nicht detailreicher als normaler StateUpdate.
- Undo-Request nennt keinen verdeckten Informationsgrund.
- Fehlermeldungen nennen keine verdeckten CardIds.
- Browser-Debug-Panel im Spielerclient zeigt keinen Full-State.

### 15.5 Debug-Ausnahme

Ein Full-State-Debug darf nur in einem lokalen Entwicklerkontext verfügbar sein. Er muss klar vom Spielerclient getrennt sein:

```ts
type DebugAccessMode = "disabled" | "local_dev_only" | "server_console_only"
```

Für private Internetspiele gilt: `disabled` oder `server_console_only`.

---

## 16. Reconnect und Disconnect

### 16.1 Disconnect-Erkennung

Ein Spieler gilt als disconnected, wenn:

- WebSocket geschlossen wurde,
- Ping/Pong-Frist überschritten wurde,
- Serverprozess die Verbindung verloren hat.

```ts
type ConnectionState = {
  side: "corp" | "runner"
  status: "connected" | "disconnected"
  connectionId?: string
  lastSeenAt: string
  disconnectedAt?: string
}
```

### 16.2 Match-Verhalten bei Disconnect

Empfehlung für MVP 0.2:

- Wenn der nichtaktive Spieler disconnected, kann der aktive Spieler sichtbar warten; Actions, die eine Entscheidung des Gegners benötigen, blockieren ohnehin.
- Wenn der aktive Spieler disconnected, wird das Match als `paused_disconnect` angezeigt.
- Automatische Niederlage durch Disconnect wird nicht implementiert.
- Manuelles Abbrechen kann optional für private Tests angeboten werden, ist aber kein Regelereignis.

### 16.3 Reconnect-Ablauf

1. Client öffnet Match-URL mit Token oder SessionToken.
2. REST oder WebSocket validiert Token.
3. Server bestimmt Side.
4. Alte Connection dieser Side wird ersetzt oder als stale markiert.
5. Server sendet `match_joined`.
6. Server sendet aktuelle PlayerView.
7. Server sendet LegalActions und PendingChoice für diese Side.
8. Server sendet EventLog-Tail.
9. Gegner erhält `opponent_status`.

### 16.4 Reconnect während Run oder Access

Besonders kritisch sind Runs und Access-Schritte, weil dort viele temporäre Informationen und Choices entstehen.

Reconnect muss korrekt funktionieren bei:

- Runner wählt Server für Run.
- Corp soll ICE rezzen.
- Runner encountered ICE.
- Runner wählt Breaker-Fähigkeit.
- Ungebrochene Subroutinen werden aufgelöst.
- Breach ist gestartet.
- CurrentAccess ist offen.
- Runner muss Agenda stehlen oder Trash-Kosten zahlen.

Nach Reconnect muss dieselbe berechtigte Seite dieselbe PendingChoice erhalten, ohne zusätzliche verdeckte Informationen.

---

## 17. Pass, Priority und ChoiceRequests

### 17.1 Ziel für 0.2

MVP 0.2 muss nicht alle offiziellen Paid-Ability- und Priority-Fenster vollständig ausbauen. Es muss aber die vorhandenen Timingpunkte so synchronisieren, dass beide menschlichen Spieler korrekt Entscheidungen treffen können.

### 17.2 Pass-Priority als LegalAction

`pass_priority` sollte nicht als UI-Spezialfall behandelt werden, sondern als LegalAction oder klarer Multiplayer-Command, der engine-kompatibel ist.

Empfohlen:

```ts
type PassPriorityAction = {
  matchId: string
  side: Side
  actionId: string
  type: "pass_priority"
  clientKnownStateVersion: number
  idempotencyKey: string
}
```

### 17.3 ChoiceRequest

```ts
type ChoiceRequest = {
  choiceId: string
  side: "corp" | "runner"
  timingPoint: TimingPointId
  prompt: string
  options: ChoiceOption[]
  required: boolean
  expiresAtStateVersion: number
}
```

ChoiceRequests müssen seitengebunden sein. Der gegnerische Client darf nur sehen, dass auf den Gegner gewartet wird, aber nicht welche verdeckten Optionen verfügbar sind.

### 17.4 UI-Wartezustände

| Situation | Anzeige aktive Seite | Anzeige Gegenseite |
|---|---|---|
| Eigene Action erforderlich | LegalActions/Choice sichtbar | „Wartet auf Gegner“ |
| Gegnerische Action erforderlich | „Wartet auf Gegner“ | LegalActions/Choice sichtbar |
| Server verarbeitet Action | Kurzer Processing-Zustand | Kurzer Processing-Zustand |
| Gegner disconnected | Disconnect-Hinweis | Reconnect-Hinweis oder eigener Status |
| Match pausiert | Pausenhinweis | Pausenhinweis |

---

## 18. Undo mit Zustimmung

### 18.1 Grundsatz

Undo ist in privaten Lernpartien nützlich, aber bei Hidden Information riskant. MVP 0.2 implementiert Undo daher konservativ.

Regel:

> Undo ist nur möglich, wenn beide Seiten zustimmen und seit dem Zielereignis keine relevante neue verdeckte Information offengelegt wurde.

### 18.2 UndoRequest

```ts
type UndoRequest = {
  undoRequestId: string
  matchId: string
  requestedBy: "corp" | "runner"
  targetEventId: string
  targetStateVersion: number
  createdAt: string
  reason?: string
  status: "pending" | "accepted" | "declined" | "blocked" | "expired"
  blockReason?: UndoBlockReason
}

type UndoBlockReason =
  | "hidden_information_revealed"
  | "random_access_performed"
  | "deck_order_changed_and_seen"
  | "access_card_seen"
  | "opponent_declined"
  | "snapshot_not_available"
  | "match_finished"
```

### 18.3 Hidden-Info-Barrier

Die Engine oder der Match-Server muss Events markieren, nach denen Undo eingeschränkt ist.

```ts
type GameEvent = {
  eventId: string
  stateVersionBefore: number
  stateVersionAfter: number
  publicText: string
  hiddenInformationBarrier?: boolean
  hiddenInformationBarrierReason?: string
  resultingStateHash: string
}
```

Events mit Barrier-Beispielen:

- Runner accessed zufällige HQ-Karte.
- Runner sah oberste R&D-Karte.
- Archives facedown Karten wurden aufgedeckt.
- Corp sah zufällige oder verdeckte Runner-Information, falls spätere Karten das ermöglichen.
- Shuffle/Draw-Ereignis, dessen Ergebnis bereits sichtbar wurde.

### 18.4 Undo-Verfahren

1. Spieler fordert Undo bis zu einem Event an.
2. Server prüft, ob Snapshot oder Replay-Punkt verfügbar ist.
3. Server prüft, ob zwischen Zielpunkt und aktuellem State eine Hidden-Info-Barrier liegt.
4. Falls Barrier vorhanden: blockieren oder nur in lokalem Debugmodus erlauben.
5. Falls keine Barrier: Gegner erhält Undo-Anfrage.
6. Gegner akzeptiert oder lehnt ab.
7. Bei Akzeptanz stellt Server Snapshot wieder her oder replayt bis Zielzustand.
8. Server schreibt ein Undo-Systemevent.
9. Beide Clients erhalten neue PlayerViews und LegalActions.

### 18.5 Undo-UI

Mindestfunktionen:

- Button „Undo anfragen“ neben EventLog-Einträgen, wenn grundsätzlich möglich.
- Dialog mit Ziel-Event und optionalem Grund.
- Gegner sieht Anfrage mit akzeptieren/ablehnen.
- Bei Block: klare, nicht private Begründung, z. B. „Undo blockiert, weil seitdem verdeckte Information offengelegt wurde.“

---

## 19. Persistenz, Snapshots und Migration

### 19.1 Warum Persistenz in 0.2 wichtiger wird

In 0.1 kann eine lokale Partie notfalls im Speicher laufen. In 0.2 müssen Matches Disconnect, Reconnect und Serverneustart zumindest pragmatisch überstehen. Deshalb wird Persistenz ab 0.2 zum Muss-Kriterium.

### 19.2 Empfohlene Persistenzentscheidung

| Option | Bewertung |
|---|---|
| JSON-Dateien | Für schnelle lokale Tests ausreichend, aber fehleranfälliger bei gleichzeitigen Actions. |
| SQLite | Empfohlen für MVP 0.2: lokal, transaktional, einfach zu sichern. |
| PostgreSQL | Für spätere private/stabile Plattform, in 0.2 noch nicht nötig. |

Empfehlung: SQLite als Standard für 0.2, JSON nur noch als Dev-/Debug-Adapter.

### 19.3 Tabellenmodell für SQLite

```sql
matches(
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  match_version INTEGER NOT NULL,
  baseline_json TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
)

match_states(
  match_id TEXT PRIMARY KEY,
  state_version INTEGER NOT NULL,
  game_state_json TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL
)

events(
  event_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  state_version_before INTEGER NOT NULL,
  state_version_after INTEGER NOT NULL,
  event_json TEXT NOT NULL,
  public_event_json TEXT NOT NULL,
  resulting_state_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
)

snapshots(
  snapshot_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  state_version INTEGER NOT NULL,
  event_id TEXT,
  game_state_json TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
)

sessions(
  session_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  side TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  connected INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
)

action_receipts(
  idempotency_key TEXT NOT NULL,
  match_id TEXT NOT NULL,
  side TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (match_id, side, idempotency_key)
)
```

### 19.4 Snapshot-Regeln

Snapshots werden gespeichert:

- bei Spielstart,
- alle N Events,
- vor oder nach Hidden-Info-Barrier-Events,
- bei Match-Ende,
- optional vor Undo-fähigen UI-Markern.

Empfohlene Einstellung:

```json
{
  "snapshotEveryEvents": 10,
  "snapshotOnHiddenInformationBarrier": true,
  "snapshotOnMatchEnd": true
}
```

### 19.5 Migration

MVP 0.2 führt mindestens folgende Schema-Marker ein:

- `engineSchemaVersion: 0.2.0`
- `multiplayerProtocolVersion: 0.2.0`
- `playerViewSchemaVersion: 0.2.0`

Alte 0.1-Replays können als read-only markiert werden, falls sie nicht vollständig migriert werden.

---

## 20. UI-/UX-Plan

### 20.1 Screens

| Screen | Mindestfunktion |
|---|---|
| Start | Neues privates Spiel erstellen, Seite wählen, Seed optional setzen. |
| Waiting Lobby | Invite-Link anzeigen, Host-Seite anzeigen, Match-Status anzeigen. |
| Join | Token prüfen, freie Seite anzeigen, Beitritt bestätigen. |
| Game Board | Spieleransicht mit eigener PlayerView, LegalActions, ChoiceRequests, EventLog. |
| Connection Status | Beide Seiten verbunden/disconnected anzeigen. |
| Undo Dialog | Undo anfragen, akzeptieren, ablehnen, blockierte Undo-Gründe anzeigen. |
| Reconnect | Session wieder aufnehmen, aktuellen State laden. |
| Debug Panel | Lokal: MatchVersion, StateVersion, StateHash, TimingPoint, ConnectionIds, letzte Events. |

### 20.2 Game Board Änderungen gegenüber 0.1

0.1 kann UI-seitig noch lokal oder gegen KI gedacht sein. 0.2 benötigt:

- Anzeige der eigenen Seite und des eigenen Session-Status.
- Anzeige des Gegners ohne private Daten.
- Wartezustand, wenn Gegner entscheiden muss.
- Deaktivierung von Actions während Serververarbeitung.
- Anzeige bei stale Action und anschließender Resynchronisierung.
- Reconnect-Banner.
- Undo-Statusanzeige.
- EventLog mit Undo-fähigen und nicht Undo-fähigen Markern.

### 20.3 LegalActions-Panel

Das LegalActions-Panel bleibt zentrale Eingabequelle. Es sollte für 0.2 folgende Zustände klar anzeigen:

| Zustand | UI-Verhalten |
|---|---|
| Action legal | Button aktiv. |
| Action wird gesendet | Button deaktiviert, pending Anzeige. |
| State stale | Actions kurz deaktivieren, neue LegalActions laden. |
| Gegner am Zug | Keine eigenen Action Buttons außer erlaubte Reactions/Pass. |
| ChoiceRequest offen | Nur Choice-Optionen anzeigen, keine irrelevanten Grundaktionen. |
| Disconnected | Eingaben blockieren oder als nicht sendbar markieren. |

### 20.4 EventLog

MVP 0.2-EventLog zeigt:

- öffentliche Aktionen,
- eigene private Detailtexte,
- StateVersion nach Event,
- Undo-Verfügbarkeit,
- Hidden-Info-Barrier-Marker nur allgemein,
- Connection-Systemevents.

Nicht zeigen:

- private Kartentitel des Gegners,
- interne CardInstanceIds für verdeckte Karten,
- vollständigen GameState,
- Token oder Sessiondaten.

### 20.5 Einladung und Token

Der Invite-Link sollte kopierbar sein. Der Token selbst sollte nach Möglichkeit nicht separat sichtbar gemacht werden. Beispiel-UI:

```txt
Privates Match erstellt
Du spielst: Runner
Einladungslink: [Kopieren]
Status: Wartet auf Corp-Spieler
```

### 20.6 UI-Akzeptanz

Eine Partie muss in zwei Browserfenstern oder auf zwei Geräten spielbar sein. Optische Perfektion ist kein Gate. Klare Zustände und fehlerfreie Synchronisierung sind wichtiger.

---

## 21. Sicherheits- und Betriebsplan

### 21.1 Mindeststandards

| Bereich | Standard für 0.2 |
|---|---|
| Transport | Localhost ohne TLS zulässig; außerhalb localhost HTTPS/WSS verwenden. |
| Tokens | Hohe Entropie, nur gehasht speichern, nicht in Logs schreiben. |
| Session | SessionToken seitenspezifisch; keine Seitenübernahme. |
| Logs | Keine privaten Kartendaten, keine Tokens, keine Full-State-Logs im normalen Betrieb. |
| Rate Limits | Begrenzung für Match-Erstellung, Join, Action Submit, Reconnect. |
| CORS/Origin | Private Server sollten erlaubte Origins einschränken. |
| Debug | Full-State-Debug nur lokal oder serverseitig. |
| Backups | SQLite-Datei oder Matchdaten sicherbar. |
| Crash Recovery | Match aus Snapshot + EventLog wiederherstellen oder sauber pausieren. |

### 21.2 Token-Regeln

- Tokenlänge mindestens 128 Bit Entropie, besser 192 oder 256 Bit.
- Token nur einmal im Link ausgeben.
- Speicherung nur als Hash.
- Optional Ablaufzeit, z. B. 24 Stunden für ungenutzte Join-Links.
- Reconnect-Token nicht als PublicEvent ausgeben.
- Bei Tokenfehlern keine Details über gültige Seiten oder Sessionstruktur verraten.

### 21.3 Rate Limits

Empfohlene pragmatische Limits für private Version:

| Aktion | Limit |
|---|---:|
| Match erstellen | 10 pro Stunde/IP im privaten Betrieb ausreichend. |
| Join-Versuche | 20 pro Stunde/Match oder IP. |
| WebSocket Join | 30 pro Stunde/Match. |
| Submit Action | 5 pro Sekunde/Session, plus Idempotency. |
| Reconnect | 30 pro Stunde/Session. |

Diese Limits dienen weniger dem öffentlichen Missbrauchsschutz, sondern der Vermeidung von Bugs durch Spam und versehentliche Mehrfachsendungen.

### 21.4 Privater Betrieb

MVP 0.2 sollte mindestens folgende Betriebsarten unterstützen:

| Betriebsart | Erwartung |
|---|---|
| Lokal zwei Browserfenster | Entwicklung und Tests. |
| LAN | Zwei Geräte im lokalen Netzwerk. |
| Privater Server | HTTPS/WSS, SQLite, Umgebungsvariablen, keine öffentlichen Plattformfunktionen. |
| Docker | Optional, aber empfohlen für reproduzierbaren Start. |

---

## 22. Teststrategie für Multiplayer

### 22.1 Testarten

| Testart | Ziel |
|---|---|
| Unit Tests | Tokenvalidierung, Session-Zuordnung, Message-Filter, Idempotency, Locking. |
| Integration Tests | Match erstellen, Join, WebSocket verbinden, Action submitten, Views aktualisieren. |
| Concurrency Tests | Gleichzeitige Actions, doppelte Messages, stale StateVersion. |
| Visibility Tests | Keine Hidden-Info-Leaks über WebSocket, Reconnect, Undo, Error, EventLog. |
| Reconnect Tests | Disconnect und Reconnect in Action Phase, Run, Encounter, Access. |
| Undo Tests | Zustimmung, Ablehnung, Block nach Hidden Information, Snapshot-Restore. |
| Replay Tests | Multiplayer-EventLog reproduziert finalen StateHash. |
| E2E Tests | Zwei Browser-Kontexte spielen eine Beispielpartie. |
| Regression Tests | 0.1-Demo-Decks bleiben spielbar. |

### 22.2 Multiplayer-Testmatrix

| Szenario | Erwartung |
|---|---|
| Host erstellt Match als Runner | Match wartet auf Corp, Invite-Link erzeugt. |
| Joiner tritt als freie Seite bei | Corp-Session wird erzeugt, Host bleibt Runner. |
| Falscher Token | Join wird abgelehnt, keine Matchdetails leaken. |
| Token versucht falsche Seite | Join/Reconnect wird abgelehnt. |
| Beide Spieler verbinden WebSocket | Beide erhalten nur eigene PlayerView. |
| Runner submit Action im Runner-Timing | Action wird akzeptiert und beide Views aktualisiert. |
| Corp submit Action im Runner-only-Timing | Action wird abgelehnt. |
| Doppelte Action mit gleichem Idempotency-Key | Nur eine Transition, zweiter Receipt identisch. |
| Zwei Actions gleichzeitig | Nur eine Transition; zweite wird stale oder nach Lock neu bewertet. |
| Stale StateVersion | Action wird abgelehnt, Client resynchronisiert. |
| Runner reconnectet während Corp wartet | Runner erhält korrekte PlayerView, keine Corp-HQ-Daten. |
| Corp reconnectet bei Rez-Choice | Corp erhält dieselbe Rez-Choice, Runner nicht. |
| Undo vor Hidden Info | Gegner kann zustimmen; State wird zurückgesetzt. |
| Undo nach HQ random access | Undo wird blockiert oder streng nach Regel abgelehnt. |
| Match endet | Beide erhalten Winner und keine weiteren Actions. |

### 22.3 Visibility-Testbeispiele

```ts
describe("multiplayer visibility", () => {
  it("runner websocket payload does not contain corp HQ card titles", async () => {})
  it("runner reconnect payload does not contain unrezzed ICE titles", async () => {})
  it("corp websocket payload does not contain runner grip titles", async () => {})
  it("public event after random HQ access does not leak non-accessed cards", async () => {})
  it("undo request after hidden information does not reveal which card caused the block", async () => {})
})
```

### 22.4 Concurrency-Testbeispiele

```ts
describe("multiplayer concurrency", () => {
  it("processes only one action per match at a time", async () => {})
  it("rejects stale state version with fresh player view", async () => {})
  it("returns stored receipt for duplicate idempotency key", async () => {})
  it("does not apply two transitions for rapid double click", async () => {})
})
```

### 22.5 Reconnect-Testbeispiele

```ts
describe("reconnect", () => {
  it("restores current player view after disconnect during action phase", async () => {})
  it("restores corp rez choice after reconnect", async () => {})
  it("restores runner access choice without extra information", async () => {})
  it("replaces old connection for same side", async () => {})
})
```

### 22.6 E2E-Abnahmeszenario

Eine vollständige E2E-Beispielpartie sollte mindestens folgende Schritte enthalten:

1. Host erstellt Match als Runner.
2. Joiner tritt als Corp bei.
3. Beide WebSockets verbinden.
4. Runner nimmt Credits und beendet Zug.
5. Corp installiert ICE vor R&D und beendet Zug.
6. Runner startet Run auf R&D.
7. Corp rezzt ICE.
8. Runner nutzt passenden Breaker oder Run endet durch Subroutine.
9. Später greift Runner auf eine Agenda zu und stiehlt sie.
10. Corp installiert und scored eine Agenda in einem Remote.
11. Ein Spieler disconnectet und reconnectet während einer Entscheidung.
12. Eine Undo-Anfrage vor Hidden Info wird akzeptiert.
13. Eine Undo-Anfrage nach Hidden Info wird blockiert.
14. Spiel endet durch Agenda-Sieg oder konfigurierten Test-Siegwert.
15. Replay reproduziert finalen StateHash.

---

## 23. Akzeptanzkriterien

| Kriterium | Pass/Fail-Bedingung |
|---|---|
| Match-Erstellung | Ein privates Match kann erstellt werden; Host erhält seitenspezifische Session und Invite-Link. |
| Join | Join-Link erlaubt genau den Beitritt zur freien Seite. |
| Token-Sicherheit | Falsche, abgelaufene oder widerrufene Tokens werden abgelehnt, ohne private Informationen auszugeben. |
| WebSocket-Verbindung | Beide Seiten können verbinden und erhalten ihre eigene PlayerView. |
| Serverautorität | Clients können keinen GameState setzen oder Regeln umgehen. |
| Action-Validierung | Falsche Seite, falscher Timingpunkt, illegale Action und stale StateVersion werden abgelehnt. |
| Idempotency | Doppelte Sendung derselben Action erzeugt keine doppelte Transition. |
| Concurrency | Gleichzeitige Actions erzeugen keinen inkonsistenten State. |
| Synchronisation | Nach jeder gültigen Action haben beide Clients dieselbe StateVersion, aber unterschiedliche gefilterte PlayerViews. |
| Visibility | WebSocket, Reconnect, EventLog, Undo und Errors enthalten keine verbotenen verdeckten Informationen. |
| Reconnect | Reconnect während Action Phase, Run, Encounter und Access stellt korrekte PlayerView und LegalActions wieder her. |
| Undo | Undo funktioniert vor Informationsgewinn mit Zustimmung und wird nach Hidden-Info-Barrier blockiert. |
| Persistenz | Aktive Matches überleben Serverneustart oder werden aus Snapshot/EventLog sauber wiederhergestellt bzw. pausiert. |
| UI | Zwei Menschen können über zwei Browserfenster oder Geräte eine Partie spielen. |
| Replay | Multiplayer-Partie kann aus Snapshot/EventLog reproduziert werden; StateHashes stimmen. |
| CI | Multiplayer-, Visibility-, Reconnect-, Undo- und Regressionstests bestehen. |

---

## 24. Definition of Done

MVP 0.2 ist fertig, wenn alle folgenden Bedingungen erfüllt sind:

- Alle Akzeptanzkriterien aus Abschnitt 23 bestehen.
- Eine vollständige private Human-vs-Human-Partie ist spielbar.
- Der Server verarbeitet Actions ausschließlich über die Engine.
- Jede eingehende Action wird gegen Seite, Token, MatchStatus, StateVersion, Idempotency-Key und Engine-Legalität validiert.
- Pro Match kann nur eine Engine-Transition gleichzeitig verarbeitet werden.
- Beide Clients erhalten nach jeder Transition konsistente, gefilterte PlayerViews.
- Reconnect funktioniert in mindestens Action Phase, Run, Encounter und Access.
- Undo mit Zustimmung funktioniert vor Hidden-Info-Barrier.
- Undo nach relevanter Hidden-Info-Barrier wird blockiert oder nachvollziehbar abgelehnt.
- Keine bekannten Hidden-Info-Leaks in WebSocket-Payloads, Reconnect, EventLog, Error Messages oder Undo.
- Persistenz speichert Match, GameState, EventLog, Snapshots, Sessions und ActionReceipts.
- Ein Multiplayer-E2E-Test läuft deterministisch durch.
- Die App ist lokal und privat startbar, idealerweise per Docker.
- Scope-Grenzen und bekannte Einschränkungen werden in der UI oder Dokumentation sichtbar gemacht.

---

## 25. Arbeitspakete

### Paket A – 0.1-Gate-Härtung

| Ergebnis | Gate |
|---|---|
| Engine-API für Multiplayer validiert. | `applyAction` akzeptiert keine manipulierte Action. |
| PlayerViews leakfrei. | Visibility-Basistests bestehen. |
| EventLog und StateHash stabil. | Replay-Test mit StateHash besteht. |
| Demo-Decks spielbar genug. | Mindestens Runner-Run und Corp-Score funktionieren. |

### Paket B – Storage und Schema 0.2

| Ergebnis | Gate |
|---|---|
| SQLite-Adapter oder stabiler JSON-Adapter. | Match kann gespeichert und geladen werden. |
| Match-, Session-, Event- und Snapshot-Schema. | Migrationstest besteht. |
| ActionReceipts gespeichert. | Duplicate-Action-Test besteht. |
| Baseline um Multiplayer-Versionen ergänzt. | Snapshot enthält vollständige Baseline. |

### Paket C – Match-Erstellung und Einladungslinks

| Ergebnis | Gate |
|---|---|
| REST `POST /api/matches`. | Host erhält Session und Invite-Link. |
| Token-Erzeugung und Hash-Speicherung. | Klartexttoken nicht in DB/Logs. |
| Seitenwahl. | Host/Joiner-Zuordnung korrekt. |
| Join-Flow. | Joiner kann freie Seite übernehmen. |

### Paket D – WebSocket-Verbindung

| Ergebnis | Gate |
|---|---|
| `join_match` validiert SessionToken. | Falscher Token abgelehnt. |
| Seitenspezifische Verbindung. | Runner und Corp korrekt zugeordnet. |
| Initiale PlayerView. | Beide Seiten erhalten gefilterte Views. |
| OpponentStatus. | Disconnect/Connect sichtbar. |

### Paket E – Action Submit und Transaktionen

| Ergebnis | Gate |
|---|---|
| `submit_action` verarbeitet PlayerAction. | Gültige Actions ändern State. |
| Match-Lock. | Gleichzeitige Actions verursachen keinen Konflikt. |
| Idempotency. | Doppelklick erzeugt nur eine Transition. |
| Stale State Handling. | Client erhält frische View. |

### Paket F – PlayerView- und Event-Filterung

| Ergebnis | Gate |
|---|---|
| Side-filtered StateUpdate. | Keine versteckten Kartendaten. |
| Side-filtered LegalActions. | Gegner sieht keine privaten Choices. |
| Side-filtered EventLog. | PublicEvents bleiben sauber. |
| Error-Filter. | Fehler leaken keine CardIds. |

### Paket G – Reconnect

| Ergebnis | Gate |
|---|---|
| Session wiederherstellen. | Spieler erhält gleiche Seite zurück. |
| Alte Connection ersetzen. | Keine Doppelverbindung mit divergierenden Views. |
| Reconnect in Run/Access. | PendingChoice korrekt wiederhergestellt. |
| Persistenz nach Neustart. | Match wird geladen oder pausiert. |

### Paket H – Undo

| Ergebnis | Gate |
|---|---|
| UndoRequest erstellen. | Gegner erhält Anfrage. |
| Accept/Decline. | Zustimmung/Ablehnung verarbeitet. |
| Snapshot-Restore. | StateVersion und Views korrekt. |
| Hidden-Info-Barrier. | Undo nach Info-Gewinn blockiert. |

### Paket I – UI-Anpassung

| Ergebnis | Gate |
|---|---|
| Create-Match-Screen. | Link kopierbar. |
| Join-Screen. | Freie Seite sichtbar, Join möglich. |
| Multiplayer-Board. | Zwei Browserfenster spielbar. |
| Connection-/Undo-Anzeigen. | Zustände klar sichtbar. |

### Paket J – Test- und CI-Ausbau

| Ergebnis | Gate |
|---|---|
| Multiplayer-Integrationstests. | Match/Join/Action bestehen. |
| Visibility-Tests. | Keine Leak-Assertions schlagen fehl. |
| Concurrency-Tests. | Race Conditions abgefangen. |
| E2E-Test. | Beispielpartie läuft durch. |

### Paket K – Privates Deployment

| Ergebnis | Gate |
|---|---|
| Konfiguration über Environment Variables. | Keine Secrets im Repo. |
| Docker optional. | App privat startbar. |
| HTTPS/WSS-Hinweis. | Betrieb außerhalb localhost dokumentiert. |
| Backup-Hinweis. | SQLite/Storage sicherbar. |

---

## 26. Minimaler Backlog

### Must

| Priorität | Eintrag |
|---|---|
| Must | Multiplayer-Baseline `0.2.0` definieren. |
| Must | MatchStatus und MatchVersion einführen. |
| Must | PlayerSession und InviteToken implementieren. |
| Must | Token sicher erzeugen, hashen und validieren. |
| Must | REST-Endpunkt zum Match-Erstellen. |
| Must | REST-Endpunkt zum Join. |
| Must | WebSocket `join_match`. |
| Must | WebSocket `submit_action`. |
| Must | Per-Match-Lock oder transaktionale Verarbeitung. |
| Must | Idempotency-Key mit ActionReceipt. |
| Must | Stale-State-Behandlung. |
| Must | Seitenspezifische StateUpdates. |
| Must | Seitenspezifische LegalActions. |
| Must | Seitenspezifische ChoiceRequests. |
| Must | Reconnect mit aktueller PlayerView. |
| Must | Disconnect-Status im Match. |
| Must | Undo Request/Accept/Decline. |
| Must | Hidden-Info-Barrier für Undo. |
| Must | SQLite- oder stabiler Storage-Adapter. |
| Must | Multiplayer-Visibility-Tests. |
| Must | Concurrency-Tests. |
| Must | Reconnect-Tests. |
| Must | E2E-Test für zwei Spieler. |

### Should

| Priorität | Eintrag |
|---|---|
| Should | Docker-Setup für privaten Server. |
| Should | Debug-Panel für MatchVersion, StateVersion, StateHash. |
| Should | EventLog mit Undo-Markern. |
| Should | Copy-Link-Komfort im Lobby-Screen. |
| Should | Reconnect-Banner mit Status. |
| Should | Optionaler Seed im Match-Create-Screen. |
| Should | Snapshot alle 10 Events. |
| Should | Export des EventLogs als JSON. |

### Could

| Priorität | Eintrag |
|---|---|
| Could | Einfacher Match-Chat. |
| Could | Zuschauer-Link für lokale Entwickler. |
| Could | Match-Passwort zusätzlich zum Token. |
| Could | Manuelles Match-Abbrechen. |
| Could | Anzeigename je Spieler. |
| Could | Lokaler Hotseat-Modus auf gleicher Engine-Struktur. |

### Won't for 0.2

| Priorität | Eintrag |
|---|---|
| Won't | Freier Deckbuilder. |
| Won't | Öffentliche Lobby. |
| Won't | Matchmaking. |
| Won't | Ranglisten. |
| Won't | Turniermodus. |
| Won't | Breiter Kartenpool. |
| Won't | Starke KI/LLM-KI. |
| Won't | Vollständige Smartphone-Optimierung. |

---

## 27. Umsetzungsetappen

### Etappe 0.2-pre – Multiplayer-Readiness

Ziel: Sicherstellen, dass 0.1-Engine und Views robust genug für zwei Menschen sind.

Ergebnisse:

- Engine-Actions sind vollständig serverseitig validierbar.
- PlayerViews sind testbar und deterministisch.
- EventLog, Replay und StateHash funktionieren.
- Demo-Decks sind für eine Beispielpartie ausreichend stabil.

Gate:

- 0.1-Akzeptanztests bestehen oder Abweichungen sind dokumentiert und für 0.2 nicht blockierend.

### Etappe 0.2.1 – Match und Storage

Ziel: Match-Objekte, Sessions, Tokens und Persistenz einführen.

Ergebnisse:

- SQLite-/Storage-Schema.
- Match-Erstellung.
- Token-Erzeugung und Hashing.
- Snapshots und ActionReceipts.

Gate:

- Match kann erstellt, gespeichert, geladen und mit Baseline geprüft werden.

### Etappe 0.2.2 – Join und Lobby

Ziel: Zwei Spieler können einem Match zugeordnet werden.

Ergebnisse:

- Join-Link.
- Host-/Joiner-Seitenlogik.
- Waiting Lobby.
- Join-Screen.

Gate:

- Zwei Browserfenster können als Runner und Corp in dasselbe Match eintreten.

### Etappe 0.2.3 – WebSocket Sync

Ziel: Live-Synchronisation mit PlayerViews.

Ergebnisse:

- WebSocket join.
- StateUpdate, LegalActions, ChoiceRequest, EventLogUpdate.
- Action Submit.
- Match-Lock und Idempotency.

Gate:

- Eine einfache Action wird von einem Client gesendet und beide Clients erhalten korrekte Views.

### Etappe 0.2.4 – Multiplayer-Run-Stabilisierung

Ziel: Human-vs-Human läuft durch Run, Encounter, Breach und Access.

Ergebnisse:

- Corp-Rez-Choice über WebSocket.
- Runner-Breaker-Choices über WebSocket.
- Access-Choices über WebSocket.
- Wartezustände im UI.

Gate:

- Geschützter und ungeschützter Run funktionieren zwischen zwei Browserfenstern.

### Etappe 0.2.5 – Reconnect

Ziel: Verbindungsabbrüche zerstören das Match nicht.

Ergebnisse:

- Disconnect-Erkennung.
- Reconnect mit SessionToken.
- Wiederherstellung von PendingChoices.
- OpponentStatus.

Gate:

- Reconnect während Action Phase, Rez-Choice und Access funktioniert.

### Etappe 0.2.6 – Undo

Ziel: Lernfreundliches Undo ohne Hidden-Info-Bruch.

Ergebnisse:

- Undo-Anfrage.
- Zustimmung/Ablehnung.
- Snapshot-Restore.
- Hidden-Info-Barrier.

Gate:

- Undo vor Hidden Info funktioniert; Undo nach Hidden Info wird blockiert.

### Etappe 0.2.7 – Abnahme und privater Betrieb

Ziel: Stabiler privater Testbetrieb.

Ergebnisse:

- Multiplayer-E2E-Test.
- CI-Gates.
- Docker/Startdokumentation.
- Scope- und Limitierungsanzeige.

Gate:

- Vollständige Human-vs-Human-Beispielpartie erfolgreich.

---

## 28. Risiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Hidden-Info-Leak über WebSocket | Multiplayer unfair oder unbrauchbar. | Payload-Filter zentralisieren, Leak-Tests für alle Message-Typen. |
| Race Conditions | Doppelaktionen, inkonsistenter State. | Per-Match-Lock, Transaktionen, Idempotency. |
| Stale Client State | Spieler sendet alte Action. | StateVersion erzwingen, aktuelle View zurücksenden. |
| Undo nach Informationsgewinn | Unfairer Vorteil. | Hidden-Info-Barrier und konservative Blockregel. |
| Reconnect verliert PendingChoice | Partie hängt. | ChoiceRequests im GameState speichern und beim Bootstrap erneut senden. |
| Persistenz zu spät | Serverneustart zerstört Matches. | SQLite/Storage früh in 0.2 einplanen. |
| UI zeigt Full-State im Debug | Verdeckte Information sichtbar. | Debug-Modus lokal/serverseitig trennen. |
| Token in Logs | Seitenübernahme möglich. | Token hashen, Logging filtern. |
| Kartenpool-Erweiterung parallel zu Multiplayer | Fehler schwer zu isolieren. | Kartenpool in 0.2 stabil halten. |
| Zu viele Komfortfeatures | Verzögerung des Kernziels. | Chat, Zuschauer, Deckbuilder und Matchmaking zurückstellen. |

---

## 29. Offene Entscheidungen

| Entscheidung | Empfehlung für MVP 0.2 |
|---|---|
| Persistenz | SQLite als Standard, JSON nur für Dev. |
| Token-Ablauf | Join-Link optional 24h gültig; aktive Sessions länger. |
| Reconnect-Token | Seitenspezifisch und wiederverwendbar für private Partie. |
| Host kann Seite wechseln? | Nein, nach Match-Erstellung fixieren. |
| Random-Seitenwahl | Server entscheidet per Seed und speichert Ergebnis. |
| Pause bei Disconnect | Ja, mindestens wenn aktive Seite disconnected. |
| Automatische Niederlage bei Disconnect | Nein. |
| Undo nach Hidden Info | Standardmäßig blockieren. |
| Chat | Nicht für 0.2. |
| Zuschauer | Nicht für 0.2. |
| Accountsystem | Nicht für 0.2; Token-Link reicht. |
| Kartenpool | Keine neuen Pflichtkarten; Demo-Decks bleiben. |
| WebSocket-Library | Native `ws` oder Socket.io; wichtiger ist klares Protokoll. |
| Debug-Full-State | Nur lokal oder serverseitig, nie im normalen Spielerclient. |

---

## 30. Konsolidierte Kernformel

MVP 0.2 ist nicht „mehr NETGRID-Regeln“. MVP 0.2 ist die private Multiplayer-Schicht über der 0.1-Engine.

Die Fassung ist dann erfolgreich, wenn zwei Menschen über einen privaten Link spielen können, ohne dass Clients Regeln auslegen, ohne dass verdeckte Informationen leaken, ohne dass doppelte oder gleichzeitige Actions den State beschädigen, und ohne dass ein Disconnect die Partie unrettbar macht.

Die Kurzformel lautet:

> Kleine stabile Kartenbasis, gleiche Engine, zwei getrennte PlayerViews, serverautoritatives WebSocket-Match, Reconnect, kontrolliertes Undo und harte Multiplayer-Visibility-Tests.
