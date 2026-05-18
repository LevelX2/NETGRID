# Timer-Server-Sync-Vertrag

Stand: 2026-05-17
Status: Architekturvertrag für einen späteren kleinen Server-/Shared-Slice
Quelle: `docs/architecture/live-match/visible-match-timer-system-concept-2026-05-17.md`

## Zweck

Dieser Vertrag definiert die side-sichere Server-, WebSocket- und Reconnect-Projektion für sichtbare Timer-Snapshots. Er ergänzt das sichtbare Timer-Konzept, ohne eine Engine-Timeout-Implementierung freizugeben.

Der erste Umsetzungsslice darf nur Zeit anzeigen, Drift korrigieren und Warnstufen projizieren. Er darf keine `PlayerAction`, keine `LegalAction`, keinen `GameState`, kein Replay, keinen StateHash und keine KI-Entscheidung verändern.

## Architekturentscheidung

- Der Server ist die einzige Autorität für Timer-Snapshots.
- Die UI darf zwischen Snapshots lokal weiterzählen, aber daraus keine Regelwirkung ableiten.
- Die Rules Engine bleibt die einzige Regelautorität. Harte Zeitfolgen bleiben blockiert, bis ein eigener Engine-Timeout-Vertrag existiert.
- Timer-Snapshots sind API-/Transport-Metadaten. Sie sind keine `PublicGameEvent`, keine Replay-Quelle und kein Bestandteil des StateHash.
- Jeder Snapshot wird aus bereits side-sicher ableitbaren Match-, PlayerView- und Servermetadaten gebaut. Er darf keine FullState-, Hidden-Zone-, Token-, Deck- oder KI-Diagnosedaten enthalten.

## Zielintegration

Der spätere Shared-Slice ergänzt `packages/shared/src/api-contracts.ts` additiv:

- `ApiTimerSnapshot`
- `ApiTimerScope`
- `ApiTimerWarningLevel`
- optional `timerSnapshot?: ApiTimerSnapshot` auf `ApiSidePayload`, `ApiLobbyPayload`, `ApiCreateMatchResponse`, `ApiJoinMatchResponse`
- neuer WebSocket-Message-Typ `{ type: "timer_snapshot"; payload: ApiTimerSnapshot }`
- optionales `timerSnapshot?: ApiTimerSnapshot` in `state_update` und `lobby_update`, wenn der Server den Snapshot zusammen mit dem Zustand senden will

Für den ersten Slice reicht ein einzelner Snapshot pro REST-/Reconnect-Payload plus WebSocket-Update bei relevanten Matchänderungen und periodischen Ticks.

## Snapshot-Felder

```ts
export type ApiTimerScope =
  | "lobby"
  | "match"
  | "setup"
  | "turn"
  | "run"
  | "decision"
  | "finished";

export type ApiTimerWarningLevel = "none" | "info" | "soft" | "grace";

export type ApiTimerSnapshot = {
  schemaVersion: "timer-snapshot-v1";
  matchId: string;
  matchVersion: number;
  stateVersion?: number;
  serverNowMs: number;
  generatedAtIso: string;
  serverMonotonicSeq: number;
  matchStartedAtMs?: number;
  elapsedMatchMs: number;
  scope: ApiTimerScope;
  scopeStartedAtMs: number;
  elapsedScopeMs: number;
  activeSide?: Side;
  decisionOwnerSide?: Side;
  timingPoint?: TimingPointId;
  warningLevel: ApiTimerWarningLevel;
  warningThresholdsMs: number[];
  softLimitMs?: number;
  graceLimitMs?: number;
  hardLimitMs?: never;
  deadlineId?: never;
  tickIntervalMs: number;
  nextRecommendedSyncAtMs: number;
  driftPolicy: {
    maxClientInterpolationMs: number;
    resyncAfterVisibilityResumeMs: number;
  };
};
```

### Pflichtsemantik

| Feld | Vertrag |
| --- | --- |
| `schemaVersion` | Stabiler Versionsanker für Client- und Testcode. Erste Version ist `timer-snapshot-v1`. |
| `matchId` | Normale Matchkennung; kein Join-, Session- oder Reconnect-Token. |
| `matchVersion` | Server-Matchversion aus dem bestehenden Multiplayer-Vertrag. Erhöht sich auch bei Lobby-, Reconnect- und Lifecycle-Änderungen. |
| `stateVersion` | Nur vorhanden, wenn ein `GameState` existiert. Der Wert entspricht `playerView.stateVersion`; Timer-Ticks alleine erhöhen ihn nicht. |
| `serverNowMs` | Serverzeit in Millisekunden als Driftreferenz. Clients berechnen daraus nur Anzeigeoffsets. |
| `generatedAtIso` | Menschlich lesbarer ISO-Zeitpunkt für Debugging nach Redaction-Regel. |
| `serverMonotonicSeq` | Pro Match monoton steigender Timer-Snapshot-Zähler. Er dient nur zur Reihenfolge alter WS-Ticks und ist kein Engine-Counter. |
| `matchStartedAtMs` | Serverzeitpunkt des Matchstarts, falls bekannt und public-safe. Für Lobbyphasen optional. |
| `elapsedMatchMs` | Serverberechnete sichtbare Matchlaufzeit. Muss auch ohne `matchStartedAtMs` nutzbar sein. |
| `scope` | Grober public-/side-sicherer Timerbereich. `decision` darf nur gewählt werden, wenn eine Entscheidung als Spielflussblockade ableitbar ist. |
| `scopeStartedAtMs` | Serverzeitpunkt des aktuellen Timerbereichs. Wird bei Scope-, Seiten-, TimingPoint- oder relevanter PendingChoice-Änderung neu gesetzt. |
| `elapsedScopeMs` | Serverberechnetes Alter des aktuellen Bereichs. |
| `activeSide` | Aus `PlayerView.activeSide` ableitbare aktive Seite. Keine eigene Serverlogik darf hier eine geheime Entscheidung offenlegen. |
| `decisionOwnerSide` | Nur die Seite, die aktuell eine Entscheidung treffen muss. Bei privaten Choices sieht die Gegenseite nur die Seite, keine Optionsdetails. |
| `timingPoint` | Nur vorhandene `TimingPointId`, wenn sie bereits über `PlayerView` side-sicher ist. |
| `warningLevel` | Serverseitig berechnete Anzeigegruppe ohne Regelwirkung. |
| `warningThresholdsMs` | Konfigurierte Schwellen in Millisekunden. Schwellen müssen für beide Seiten gleich oder side-sicher begründbar sein. |
| `softLimitMs`, `graceLimitMs` | Anzeigegrenzen ohne Engine-Wirkung. |
| `hardLimitMs`, `deadlineId` | In diesem Vertrag bewusst `never`. Harte Fristen brauchen einen späteren Engine-Vertrag. |
| `tickIntervalMs` | Empfohlene Periodik für Live-Sync. |
| `nextRecommendedSyncAtMs` | Serverhinweis für Client-Resync; keine Deadline. |
| `driftPolicy` | Client-Anzeigegrenzen für Interpolation, Visibility-Resume und Driftkorrektur. |

## Scope-Ableitung

Die Scope-Ableitung muss konservativ sein:

| Quelle | Snapshot-Scope |
| --- | --- |
| Pending-Lobby, Deck-Handshake, Ready-Check oder Countdown | `lobby` |
| aktiver Setup-/Mulligan-Fluss | `setup` |
| normale Korp-/Runner-Aktions- oder Discard-Phase ohne Run | `turn` |
| aktiver Run ohne private Entscheidung | `run` |
| sichtbare oder side-sicher ableitbare PendingChoice / LegalAction-Blockade | `decision` |
| abgeschlossenes, abgebrochenes, aufgegebenes oder forfeited Match | `finished` |
| unklarer aktiver Zustand | `match` |

Private Choice-Details dürfen den Scope nicht verfeinern. Beispiel: Wenn die Runnerin eine private Grip-/Stack-Choice trifft, darf die Korp höchstens `decisionOwnerSide: "runner"` und `scope: "decision"` sehen, aber keinen Choice-Typ, keine Optionsanzahl, keine Kartennamen und keine Zielzonen.

## Serverzeit, Drift und Periodik

Der Server berechnet `serverNowMs`, `elapsedMatchMs` und `elapsedScopeMs` aus einer serverseitigen Uhr. Für den ersten Umsetzungsslice ist Wall-Clock-Zeit als Transportmetadatum zulässig; Timerdaten dürfen trotzdem nicht in Engine-State oder StateHash eingehen. Eine spätere harte Timeout-Umsetzung muss vorab klären, welche monotone Zeitquelle für Deadline-Beobachtung genutzt wird.

Empfohlene Default-Periodik:

- Sofortiger Snapshot bei Matchanlage, Join, Reconnect und Seitenwechsel.
- Sofortiger Snapshot bei `matchVersion`- oder `stateVersion`-Wechsel.
- Sofortiger Snapshot bei Scope-Wechsel, Run-Start/-Ende, PendingChoice-Öffnung/-Auflösung und Matchende.
- Periodischer WebSocket-Snapshot alle 5 Sekunden für aktive Matches.
- Periodischer WebSocket-Snapshot alle 1 Sekunde nur bei `warningLevel` `soft` oder `grace`, solange keine harte Regelwirkung existiert.
- Kein periodischer Persistenzschreibvorgang nur wegen Timer-Ticks.

Client-Regeln:

- Clients schätzen ihren Offset über `serverNowMs` und Empfangszeitpunkt.
- Clients dürfen zwischen Snapshots maximal `driftPolicy.maxClientInterpolationMs` interpolieren.
- Nach Tab-Resume, Netzwerkwechsel oder sichtbarer Drift über 2 Sekunden fordert der Client einen neuen Snapshot an oder wartet auf den nächsten periodischen Tick.
- Bei Verbindungsverlust wird die Uhr eingefroren oder als unsynchron markiert. Der Client erzeugt keine Timeout-Aktion.

## WebSocket-Vertrag

`timer_snapshot` ist eine eigene WebSocket-Nachricht. Sie darf unabhängig von `event_log_update` gesendet werden und darf keinen `PublicGameEvent` erzeugen.

Empfohlene Sendereihenfolge nach einem akzeptierten Spielerzug:

1. `action_receipt`
2. `state_update`
3. `legal_actions`
4. `choice_request`
5. `event_log_update`
6. `timer_snapshot`

Die Reihenfolge ist nicht regelrelevant, aber verhindert, dass die UI einen Timer auf einen noch nicht gerenderten Zustand anwendet. Clients verwerfen Timer-Snapshots, deren `matchVersion` kleiner als der bekannte Matchstand ist oder deren `stateVersion` kleiner als die bekannte `playerView.stateVersion` ist. Ein Snapshot mit gleicher `stateVersion` und höherer `serverMonotonicSeq` ist als neuer Tick zulässig.

Lobby-Updates dürfen `timer_snapshot` ebenfalls senden, zum Beispiel für Ready-Countdowns. Chatnachrichten sind kein Timer-Scope dieses Vertrags.

## Reconnect-Vertrag

Reconnect muss denselben aktuellsten side-sicheren Snapshot liefern wie Live-WebSocket-Clients:

- `POST /matches/:matchId/reconnect` liefert `timerSnapshot` zusammen mit `playerView`, `legalActions`, `eventTail`, `matchVersion`, `pendingUndo`, `aiTurnPresentation` und Lifecycle-/Resultdaten.
- Der Snapshot nutzt den neu erzeugten Reconnect-Zeitpunkt als `serverNowMs`.
- Reconnect rotiert Tokens wie bisher; Timerfelder enthalten nie Roh-Token oder Token-Hashes.
- Der Snapshot darf keine ältere PendingChoice-Details rekonstruieren. Maßgeblich ist der aktuelle `PlayerView` der reconnectenden Seite.
- Wenn ein Match in Lobby- oder Lifecycle-Zustand ist und kein `GameState` existiert, fehlt `stateVersion`; `matchVersion` bleibt Pflicht.
- Wenn ein Match beendet ist, bleibt `scope: "finished"` und `elapsedScopeMs` zeigt die Zeit seit dem terminalen Lifecycle-/Game-End-Zeitpunkt, sofern bekannt. Das hat keine Replay-Wirkung.

## Redaction-Grenzen

Timer-Snapshots dürfen enthalten:

- `matchId`, `matchVersion`, aktuelle `stateVersion`
- Serverzeit, sichtbare Laufzeiten und Warnstufen
- `activeSide`, `decisionOwnerSide`, groben Scope und side-sicheren `timingPoint`
- öffentliche oder aus dem eigenen `PlayerView` ableitbare Statusinformationen

Timer-Snapshots dürfen nicht enthalten:

- `sessionToken`, `reconnectToken`, `joinToken`, Account-Session-Token oder Token-Hashes
- Decklisten, Deckhashes, private Decksnapshots, Cloud-Deck-IDs oder gegnerische Deckdetails
- `FullState`, `cardInstances`, `privatePayload`, Hidden-Zone-Inhalte, private Choice-Optionen oder Optionsanzahl
- Kartennamen aus verdeckten Zonen, Hidden-Zone-Ziel-IDs oder private Such-/Reorder-Details
- `AIInput`, `AiDecisionInput`, `DecisionDebug`, `aiDecisionDebug`, Belief-State- oder Doctrine-Diagnosedaten
- Replay-Events, `PublicGameEvent`-privatePayloads oder Undo-Preview-Daten
- lokale Dateipfade, Storage-Pfade, Runtime-Dumps oder Error-Stacktraces

Diese Verbote gelten für REST, WebSocket, Reconnect, Logs, Fehlertexte, Health-/Ops-Diagnostik und spätere Public-/Spectator-Projektionen.

## Replay, StateHash und Persistenz

UI-only- und Sync-Timer sind nicht replaydeterministisch und bleiben außerhalb der Engine:

- Timer-Ticks erhöhen keine `stateVersion`.
- Timer-Ticks erzeugen keine `PublicGameEvent`.
- Timer-Ticks verändern keinen `GameState`.
- Timer-Ticks verändern keinen `stateHashAfter`, keinen `finalStateHash` und keine StateSnapshots.
- Timer-Ticks werden nicht im öffentlichen Replay persistiert.
- Für Diagnostics darf höchstens eine redigierte technische Timer-Metrik gespeichert werden, zum Beispiel Tick-Latenz oder Driftbetrag. Diese Metrik darf nicht zur Replay-Rekonstruktion genutzt werden.

Harte Timeout-Auflösungen bleiben Nicht-Scope. Wenn sie später kommen, muss die Engine eine explizite, revalidierte Timeout-Aktion oder Timeout-Policy kennen; erst diese Engine-Auflösung darf Replay und StateHash verändern.

## KI- und Debug-Grenzen

Menschliche Match-Timer sind kein KI-Input:

- `AiDecisionInput` erhält kein `timerSnapshot`.
- `AiDecisionDebug` darf keinen sichtbaren Timer-Snapshot, keine menschliche Deadline und keine Token-/Deck-/Hidden-Info-Daten spiegeln.
- Bestehende KI-Zeitbudgets wie `timeBudgetMs` und `timeoutUsed` bleiben interne KI-Diagnostik und sind nicht der menschliche Matchtimer.
- Eine KI darf weiterhin nur aus `LegalActions` wählen oder später eine explizite Engine-Timeout-Auflösung erhalten.

## Umsetzungshandoff

Kleiner Server-/Shared-Slice:

1. Shared-Typen in `packages/shared/src/api-contracts.ts` ergänzen und exportieren.
2. Server-Helfer `buildTimerSnapshot(record, side, now)` neben `buildSidePayload` einführen.
3. Snapshot additiv in REST-/Reconnect-Payloads aufnehmen.
4. WebSocket `timer_snapshot` bei Matchstart, Join, Reconnect, State-/Scope-Wechsel und periodischem Tick senden.
5. Keine Engine-, AI-, Replay-, StateHash- oder Chat-Persistenzänderung.
6. Redaction-Tests gegen die verbotenen Schlüssel und repräsentative private Choice-/Deck-/Token-Werte ergänzen.

Offen für den Umsetzungsslice:

- genaue Ablage von Match-/Scope-Startzeiten im Server-Record,
- Tick-Scheduler-Lifecycle bei mehreren verbundenen Clients,
- konservativer Umgang mit Matchpausen oder Disconnect-Grace,
- optionale Feature-Flag-Konfiguration für Warnschwellen.

## Testmatrix

| ID | Bereich | Erwartung |
| --- | --- | --- |
| TSC-T001 | Shared Contract | `ApiTimerSnapshot` ist exportiert und enthält keine `hardLimitMs`-/`deadlineId`-Werte im ersten Slice. |
| TSC-T002 | Side Payload | Aktive Side-Payload enthält `timerSnapshot` mit `matchId`, `matchVersion`, `stateVersion`, `serverNowMs`, `elapsedMatchMs`, `scope` und `warningLevel`. |
| TSC-T003 | Lobby Payload | Lobby-/Ready-/Countdown-Payload enthält Snapshot ohne `stateVersion`, solange kein `GameState` existiert. |
| TSC-T004 | WebSocket Tick | `timer_snapshot` kann ohne `state_update` gesendet werden und erhöht weder `stateVersion` noch `matchVersion`. |
| TSC-T005 | State Wechsel | Nach akzeptierter Action passt `timerSnapshot.stateVersion` zur neuen `playerView.stateVersion`. |
| TSC-T006 | Reconnect Gleichstand | Reconnect liefert denselben side-sicheren Scope wie Live-Clients und nutzt einen frischen `serverNowMs`. |
| TSC-T007 | Stale WS Snapshot | Client-/Server-Test verwirft Snapshots mit älterer `matchVersion` oder älterer `stateVersion`. |
| TSC-T008 | Private Choice Redaction | Gegenseite sieht bei privater Choice keine Optionsanzahl, Kartennamen, Ziel-IDs oder Hidden-Zone-Labels im Snapshot. |
| TSC-T009 | Token Redaction | JSON von REST-, Reconnect- und WS-Timerpayloads enthält keine Join-, Session-, Reconnect-, Account- oder TokenHash-Felder. |
| TSC-T010 | Deckdaten Redaction | Timerpayloads enthalten keine Decklisten, Deckhashes, Cloud-Deck-IDs oder private Decksnapshot-Felder. |
| TSC-T011 | Hidden Info Redaction | Timerpayloads enthalten keine `privatePayload`, `cardInstances`, `FullState`, Hidden-Zone-Inhalte oder verdeckte Kartentitel. |
| TSC-T012 | AI Boundary | `AiDecisionInput` und `AiDecisionDebug` bleiben ohne `timerSnapshot`, menschliche Deadlines und Matchtimerfelder. |
| TSC-T013 | Replay Boundary | Timer-Ticks erzeugen keine `PublicGameEvent` und erscheinen nicht im öffentlichen Replay. |
| TSC-T014 | StateHash Boundary | Mehrere Timer-Ticks zwischen zwei Spieleraktionen lassen `hashState(gameState)` unverändert. |
| TSC-T015 | EventTail Boundary | `eventTail` bleibt unverändert, wenn nur ein Timer-Snapshot gesendet wird. |
| TSC-T016 | Warning Config | Warnschwellen ändern nur `warningLevel` und Anzeigegrenzen, aber keine LegalActions oder Engine-Ergebnisse. |
| TSC-T017 | Disconnect | Bei WS-Verlust wird keine Server- oder Client-Timeout-Aktion erzeugt. |
| TSC-T018 | Finished Match | Beendetes Match liefert `scope: "finished"` ohne Replay- oder ResultSummary-Änderung. |
| TSC-T019 | Log Redaction | Serverlogs und Fehlertexte redigieren Timerumfeld nach der Observability-Baseline und enthalten keine verbotenen Muster. |
| TSC-T020 | Periodik | Periodische Ticks stoppen bei fehlenden aktiven Clients oder Matchende und erzeugen keine Persistenzflut. |

## Abnahmekriterien für Implementierung

Ein späteres Umsetzungspaket ist erst fertig, wenn diese Punkte grün sind:

- Snapshot ist typisiert, additiv und abwärtskompatibel.
- Live-WebSocket und Reconnect liefern konsistente Snapshots.
- Alle Timerfelder sind side-sicher und redaction-getestet.
- Timerdaten bleiben getrennt von `GameState`, `PublicGameEvent`, Replay, StateHash, `AIInput` und `DecisionDebug`.
- Warnungen sind konfigurierbar und ohne Regelwirkung.
- Harte Fristen, Auto-Pass, Aktionsverlust, Forfeit und Chat-Retention bleiben außerhalb des Slices.
