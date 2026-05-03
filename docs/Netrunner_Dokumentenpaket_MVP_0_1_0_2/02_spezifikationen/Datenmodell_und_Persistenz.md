# Netrunner-Webapplikation – Datenmodell- und Persistenzspezifikation

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Empfohlener Storage für MVP 0.2:** SQLite  
**Primäres Ziel:** konsistenter, reproduzierbarer und reconnectfähiger Matchzustand

## 1. Zweck

Dieses Dokument definiert das fachliche Datenmodell und die Persistenzstrategie. Es beschreibt, welche Objekte im Engine-State, im Match-Server und im Storage existieren, wie sie versioniert werden und wie Recovery, Replay, Undo und Migration funktionieren.

MVP 0.1 kann für lokale Tests noch mit In-Memory- oder JSON-Storage arbeiten. MVP 0.2 benötigt einen stabilen transaktionalen Storage, weil Human-vs-Human, Reconnect, Idempotency und Undo sonst nicht zuverlässig sind.

## 2. Leitprinzipien

1. Der vollständige `GameState` ist autoritativ und serverseitig.
2. Zonen enthalten `CardInstanceRef`, keine duplizierten Card-Objekte.
3. Jede CardInstance existiert genau einmal.
4. Jede erfolgreiche Engine-Transition erzeugt ein Event mit `stateVersionBefore`, `stateVersionAfter` und `resultingStateHash`.
5. Persistenz speichert State, EventLog, Snapshots, Sessions und ActionReceipts konsistent.
6. Token werden nie im Klartext gespeichert.
7. Replay muss aus Snapshot plus EventLog denselben StateHash reproduzieren.
8. Migrationen werden versioniert; nicht migrierbare Replays werden als read-only markiert.

## 3. Domänenmodell

### 3.1 Überblick

```text
Match
  ├─ MatchSettings
  ├─ RulesBaseline
  ├─ PlayerController(corp)
  ├─ PlayerController(runner)
  ├─ PlayerSession[]
  ├─ InviteToken[]
  ├─ GameState
  ├─ GameEvent[]
  ├─ StateSnapshot[]
  ├─ ActionReceipt[]
  └─ UndoRequest?
```

### 3.2 `RulesBaseline`

```ts
type RulesBaseline = {
  rulesDocument: "Null Signal Games Comprehensive Rules"
  rulesVersion: "26.03"
  effectiveDate: "2026-03-02"
  engineSchemaVersion: "0.2.0"
  eventSchemaVersion: "0.2.0"
  playerViewSchemaVersion: "0.2.0"
  cardManifestVersion: string
  deckMode: "fixed_demo_decks"
}
```

Die Baseline ist Teil jedes Matchs und jedes Replays. Sie verhindert, dass alte EventLogs stillschweigend unter neuen Regeln interpretiert werden.

### 3.3 `Match`

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

`matchVersion` wird bei Match-Metadatenänderungen erhöht, also zum Beispiel bei Join, Disconnect, Reconnect, Undo-Status oder Statuswechsel. `stateVersion` liegt im GameState und ändert sich bei Engine-Transitionen.

### 3.4 `MatchSettings`

```ts
type MatchSettings = {
  mode: "human_vs_human_private" | "human_runner_vs_corp_ai"
  deckMode: "fixed_demo_decks"
  allowSpectators: false
  allowUndo: boolean
  pauseOnDisconnect: boolean
  autoStartWhenBothConnected: boolean
  maxEventLogTailForClient: number
  actionTimeoutMs?: number
  inviteTokenExpiresAt?: string
  agendaPointTarget?: number
}
```

Empfohlene MVP-0.2-Defaults:

```json
{
  "mode": "human_vs_human_private",
  "deckMode": "fixed_demo_decks",
  "allowSpectators": false,
  "allowUndo": true,
  "pauseOnDisconnect": true,
  "autoStartWhenBothConnected": true,
  "maxEventLogTailForClient": 100,
  "agendaPointTarget": 6
}
```

Der normale Netrunner-Agenda-Siegwert kann später verwendet werden. Für das reduzierte Demo-Deck darf der Zielwert konfigurierbar sein, damit Abnahmepartien erreichbar bleiben.

## 4. Controller, Sessions und Tokens

### 4.1 `PlayerController`

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

Der Controller beschreibt, wer eine Seite steuert. Er ist nicht identisch mit einer WebSocket-Verbindung.

### 4.2 `PlayerSession`

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
  disconnectedAt?: string
  userAgentHash?: string
  ipHash?: string
}
```

Die Session verbindet eine Seite mit einem Token und optional einer aktuellen WebSocket-Verbindung. Die Engine kennt keine Sessions.

### 4.3 `InviteToken`

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

Tokenregeln:

- Klartexttoken werden nie gespeichert.
- Hashing erfolgt mit ausreichend starker Hashfunktion und Server-Secret oder Salt.
- Join-Token erlauben nur die freie Seite.
- Session-/Reconnect-Token sind seitenspezifisch.
- Token werden nicht in Logs, Events, PlayerViews oder Error-Messages ausgegeben.

## 5. GameState-Modell

### 5.1 `GameState`

```ts
type GameState = {
  gameId: string
  seed: string
  randomCounter: number
  stateVersion: number
  turn: number
  activeSide: "corp" | "runner"
  phase: PhaseState
  timingPoint: TimingPointId
  priority: PriorityState | null
  corp: CorpState
  runner: RunnerState
  run: RunState | null
  pendingChoices: ChoiceRequest[]
  checkpoints: CheckpointState[]
  winner: "corp" | "runner" | "draw" | null
}
```

`stateVersion` wird nur durch Engine-Transitionen verändert. Match-Metadaten wie ConnectionStatus ändern `matchVersion`, nicht zwingend `stateVersion`.

### 5.2 `CorpState`

```ts
type CorpState = {
  identity: CardInstanceRef
  credits: number
  clicks: number
  maxHandSize: number
  badPublicity: number
  hq: CardInstanceRef[]
  rd: CardInstanceRef[]
  archives: CardInstanceRef[]
  scoreArea: CardInstanceRef[]
  servers: Server[]
}
```

### 5.3 `RunnerState`

```ts
type RunnerState = {
  identity: CardInstanceRef
  credits: number
  clicks: number
  maxHandSize: number
  tags: number
  memoryUsed: number
  memoryLimit: number
  grip: CardInstanceRef[]
  stack: CardInstanceRef[]
  heap: CardInstanceRef[]
  scoreArea: CardInstanceRef[]
  rig: RunnerRig
}
```

### 5.4 `Server`

```ts
type Server = {
  id: string
  type: "hq" | "rd" | "archives" | "remote"
  root: CardInstanceRef[]
  ice: CardInstanceRef[]
  createdByEventId?: string
}
```

Die ICE-Reihenfolge muss in der Implementierung eindeutig dokumentiert werden. Empfehlung: `ice[0]` ist outermost. Diese Entscheidung ist in Tests zu fixieren.

### 5.5 `CardDefinition`

```ts
type CardDefinition = {
  cardId: string
  printedCardCode?: string
  title: string
  side: "corp" | "runner"
  type: CardType
  subtypes: string[]
  faction?: string
  cost?: number
  rezCost?: number
  trashCost?: number
  advancementRequirement?: number
  agendaPoints?: number
  strength?: number
  memoryCost?: number
  text: string
  abilities: AbilityDefinition[]
}
```

### 5.6 `CardInstance`

```ts
type CardInstance = {
  instanceId: string
  cardId: string
  printedCardCode?: string
  owner: Side
  controller: Side
  zone: ZoneRef
  faceup: boolean
  rezzed?: boolean
  active: boolean
  installed: boolean
  order?: number
  advancementTokens: number
  counters: Record<string, number>
  hosted: CardInstanceRef[]
  host?: CardInstanceRef
  temporaryModifiers: ModifierRef[]
  lingeringEffects: LingeringEffectRef[]
  implementationStatus: CardImplementationStatus
}
```

`CardInstance` ist die einzige Stelle, an der der konkrete Zustand einer Karte gespeichert wird. Zonen referenzieren nur Instanzen.

## 6. Actions, Choices und Receipts

### 6.1 `LegalAction`

```ts
type LegalAction = {
  actionId: string
  side: Side
  type: ActionType
  label: string
  source: CardInstanceRef | "basic_action" | "game_rule"
  timingPoint: TimingPointId
  costs: Cost[]
  targetRequirements: TargetRequirement[]
  choices?: ChoiceSchema
  visibility: "public" | "private_to_actor"
  expiresAtStateVersion: number
}
```

### 6.2 `PlayerAction`

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

### 6.3 `ChoiceRequest`

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

ChoiceRequests sind Teil des GameState oder eines eindeutig daraus ableitbaren Pending-State. Sie müssen nach Reconnect wiederherstellbar sein.

### 6.4 `ActionReceipt`

```ts
type ActionReceipt = {
  idempotencyKey: string
  matchId: string
  side: "corp" | "runner"
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

Receipts sind für Doppelklick, Netzwerkwiederholungen und Race Conditions verpflichtend.

## 7. EventLog, Random und StateHash

### 7.1 `GameEvent`

```ts
type GameEvent = {
  eventId: string
  eventSchemaVersion: string
  stateVersionBefore: number
  stateVersionAfter: number
  timestamp: string
  side: Side | "system"
  actionType: string
  timingPoint: TimingPointId
  publicText: string
  privateText?: Partial<Record<Side, string>>
  publicPayload: unknown
  privatePayload?: Partial<Record<Side, unknown>>
  randomDraws?: RandomDrawRecord[]
  hiddenInformationBarrier?: boolean
  hiddenInformationBarrierReason?: HiddenInformationBarrierReason
  resultingStateHash: string
}
```

### 7.2 `RandomDrawRecord`

```ts
type RandomDrawRecord = {
  purpose: "shuffle" | "hq_access" | "other"
  counterBefore: number
  counterAfter: number
  seed: string
  resultHash: string
  publicDescription?: string
  privateResult?: Partial<Record<Side, unknown>>
}
```

Zufallsergebnisse müssen reproduzierbar, aber nicht automatisch öffentlich sein. Ein zufälliger HQ-Access kann für den Runner die gesehene Karte enthalten, aber nicht alle HQ-Kandidaten.

### 7.3 StateHash

`stateHash` wird aus kanonischer JSON-Serialisierung berechnet. Folgende Regeln gelten:

- Objektkeys werden deterministisch sortiert.
- Flüchtige Felder wie WebSocket-ConnectionIds gehören nicht in den GameStateHash.
- Timestamps können Eventbestandteil sein, dürfen aber Replay nicht nondeterministisch machen.
- Private Tokens gehören nie in den GameStateHash.
- Hashalgorithmus wird versioniert dokumentiert.

```ts
type StateSnapshot = {
  snapshotId: string
  matchId: string
  stateVersion: number
  eventId?: string
  gameState: GameState
  stateHash: string
  createdAt: string
  reason: "game_start" | "interval" | "hidden_info_barrier" | "match_end" | "undo_target" | "manual_debug"
}
```

## 8. Undo-Datenmodell

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
```

```ts
type UndoBlockReason =
  | "hidden_information_revealed"
  | "random_access_performed"
  | "deck_order_changed_and_seen"
  | "access_card_seen"
  | "opponent_declined"
  | "snapshot_not_available"
  | "match_finished"
```

Undo-Restore darf nur auf einen State erfolgen, der über Snapshot oder Replay verifizierbar ist. Nach Restore wird ein neues Systemevent geschrieben, damit die Historie nachvollziehbar bleibt.

## 9. SQLite-Schema für MVP 0.2

### 9.1 `schema_migrations`

```sql
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL,
  description TEXT NOT NULL
);
```

### 9.2 `matches`

```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  match_version INTEGER NOT NULL,
  baseline_json TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);
```

### 9.3 `match_states`

```sql
CREATE TABLE match_states (
  match_id TEXT PRIMARY KEY,
  state_version INTEGER NOT NULL,
  game_state_json TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

### 9.4 `events`

```sql
CREATE TABLE events (
  event_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  state_version_before INTEGER NOT NULL,
  state_version_after INTEGER NOT NULL,
  event_json TEXT NOT NULL,
  public_event_json TEXT NOT NULL,
  resulting_state_hash TEXT NOT NULL,
  hidden_information_barrier INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE INDEX idx_events_match_state_after
  ON events(match_id, state_version_after);
```

### 9.5 `snapshots`

```sql
CREATE TABLE snapshots (
  snapshot_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  state_version INTEGER NOT NULL,
  event_id TEXT,
  game_state_json TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE INDEX idx_snapshots_match_state
  ON snapshots(match_id, state_version);
```

### 9.6 `sessions`

```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  side TEXT NOT NULL,
  token_id TEXT NOT NULL,
  connected INTEGER NOT NULL,
  connection_id TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  disconnected_at TEXT,
  user_agent_hash TEXT,
  ip_hash TEXT,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE INDEX idx_sessions_match_side
  ON sessions(match_id, side);
```

### 9.7 `tokens`

```sql
CREATE TABLE tokens (
  token_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  match_id TEXT NOT NULL,
  allowed_side TEXT NOT NULL,
  issued_to_side TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  used_at TEXT,
  use_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

### 9.8 `action_receipts`

```sql
CREATE TABLE action_receipts (
  idempotency_key TEXT NOT NULL,
  match_id TEXT NOT NULL,
  side TEXT NOT NULL,
  action_payload_hash TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (match_id, side, idempotency_key),
  FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

### 9.9 `undo_requests`

```sql
CREATE TABLE undo_requests (
  undo_request_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  target_event_id TEXT NOT NULL,
  target_state_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  block_reason TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

### 9.10 Optional: `match_locks`

Bei einem einzigen Serverprozess kann ein In-Memory-Lock genügen. Für transaktionale Absicherung kann eine Lock-Tabelle verwendet werden.

```sql
CREATE TABLE match_locks (
  match_id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
```

## 10. Atomare Action-Transaktion

Mindestablauf innerhalb einer Transaktion oder eines äquivalenten kritischen Abschnitts:

1. Match-Lock erwerben.
2. Match und aktuellen State laden.
3. Session und Seite validieren.
4. Idempotency-Key prüfen.
5. StateVersion prüfen.
6. Engine `applyAction` ausführen.
7. EngineResult validieren.
8. Event(s) serialisieren und speichern.
9. `match_states` aktualisieren.
10. ActionReceipt speichern.
11. Snapshot-Regeln prüfen und Snapshot speichern.
12. MatchVersion und updatedAt aktualisieren.
13. Lock freigeben.
14. WebSocket-Updates nach Commit versenden.

Wenn Schritt 6 bis 12 fehlschlägt, darf keine Teiltransition sichtbar werden.

## 11. Snapshot-Regeln

Snapshots werden gespeichert:

- bei Spielstart,
- alle 10 Events,
- vor oder nach Hidden-Info-Barrier-Events,
- bei Match-Ende,
- vor Undo-fähigen Zielmarkern, falls sinnvoll,
- manuell im lokalen Debugmodus.

Empfohlene Konfiguration:

```json
{
  "snapshotEveryEvents": 10,
  "snapshotOnHiddenInformationBarrier": true,
  "snapshotOnMatchEnd": true,
  "snapshotBeforeUndoTarget": true
}
```

## 12. Recovery

### 12.1 Serverneustart

Beim Start des Servers:

1. Schema-Migrationen prüfen.
2. Unvollständige Locks verwerfen oder anhand Ablaufzeit bereinigen.
3. Aktive Matches laden.
4. StateHash des gespeicherten `match_states` prüfen.
5. Optional letzten Snapshot plus EventLog replayen.
6. Matches mit Fehlern als pausiert oder debugpflichtig markieren.

### 12.2 Crash während Action

Akzeptable Recovery-Zustände:

| Persistierter Zustand | Verhalten |
|---|---|
| Keine neuen Events, kein neuer State | Action gilt als nicht verarbeitet. |
| Event und State vollständig, Receipt fehlt | Receipt nachträglich aus Event rekonstruieren oder Action als verarbeitet markieren. |
| Receipt akzeptiert, State fehlt | Schwerer Fehler; Match pausieren und Debug-Recovery. |
| StateHash stimmt nicht | Match pausieren, Replay prüfen. |

Ziel ist, durch Transaktion zu vermeiden, dass solche Zwischenzustände entstehen.

## 13. Migration

Jedes persistierte Hauptobjekt enthält Schema- oder Baselineinformationen. Migrationen sind notwendig bei:

- Änderung des GameState-Schemas,
- Änderung des Event-Schemas,
- Änderung des PlayerView-Schemas,
- Änderung der CardImplementation-Daten,
- Änderung der StateHash-Kanonisierung.

Regeln:

- Migrationen sind vorwärtsgerichtet und versioniert.
- Aktive Matches dürfen nur migriert werden, wenn Replay- und Visibility-Tests bestehen.
- Nicht migrierbare Replays werden als `read_only_replay` markiert.
- Migration darf keine neuen verdeckten Informationen in öffentliche EventPayloads schreiben.

## 14. Datenklassifikation

| Datenart | Beispiel | Speicherung | Clientfreigabe |
|---|---|---|---|
| Öffentlich | Credits, Score Area, gerezzte Karten | Normal | Beide Seiten |
| Seitenspezifisch privat | Corp HQ, Runner Grip | GameState/Event privatePayload | Nur berechtigte Seite |
| Streng geheim | Tokens, Tokenhash Secrets | Hash/Secret Storage | Nie |
| Debugsensibel | Full-State, StateHash, interne IDs | Lokal/serverseitig | Nicht im normalen Client |
| Replay öffentlich | PublicEventLog | Gefiltert | Optional beide Seiten |

## 15. Persistenz-Abnahmekriterien

Die Persistenz gilt als MVP-0.2-tauglich, wenn:

- Match, State, Events, Snapshots, Sessions, Tokens, Receipts und UndoRequests gespeichert werden,
- Token nie im Klartext persistiert oder geloggt werden,
- Action-Transitionen atomar persistiert werden,
- Reconnect nach Serverneustart den korrekten State liefert oder Match sauber pausiert,
- Replay aus Snapshot plus EventLog denselben StateHash erzeugt,
- Undo-Restore StateVersion, PlayerViews und LegalActions korrekt wiederherstellt,
- Migrationen versioniert sind,
- Visibility-Tests alle aus Storage geladenen Bootstrap- und Replay-Payloads prüfen.
