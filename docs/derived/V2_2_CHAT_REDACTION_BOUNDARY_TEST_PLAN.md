# V2.2 Chat-Redaction- und Boundary-Testplan

Stand: 2026-05-17
Status: Testvertrag, keine Implementierungsfreigabe
Zielrelease: V2.2 Minimal Chat Gate

## Zweck

Dieser Testplan konkretisiert den Redaction- und Boundary-Vertrag aus `docs/derived/V2_2_CHAT_DATA_CONTRACT.md`. Er legt fest, welche späteren Implementierungstests beweisen müssen, dass Chatdaten von Engine, Replay, StateHash, KI, DecisionDebug, Server-Payloads und Logs getrennt bleiben.

Der Testplan erweitert keine Produktfreigabe: Er erlaubt keinen globalen Chat, keine Moderationskonsole, keine Public-Chat-Funktion, keine LLM-Moderation und keine Engine-/Replay-/KI-Nutzung von Chattexten.

## Quellenanker

- `docs/derived/V2_2_CHAT_DATA_CONTRACT.md`
- `docs/releases/v1/v1-0-3-matchstart-ux/plan.md`
- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`
- `docs/derived/V2_6_MODERATION_RBAC_REDACTION_TEST_MATRIX.md`
- Bestehende enge Lobbychat-Form: `ApiLobbyChatMessage` und `ApiMatchStartLobbyPayload.chatMessages`

## Bestehender V1.0.3-Lobbychat

Der bestehende private Lobbychat bleibt der Referenzpfad für enges Verhalten:

- nur private Zwei-Personen-Startlobby vor Matchaktivierung;
- kurze Textnachrichten, derzeit maximal 300 Zeichen;
- Reconnect darf die letzten Lobbychat-Nachrichten nur berechtigten Teilnehmenden erneut liefern;
- Chat verschwindet mit Matchstart aus der aktiven Spielpayload-Schicht;
- Chattexte erzeugen keine `GameState`-, `GameEvent`-, `PublicGameEvent`-, Replay-, StateHash-, RandomDrawRecord-, `AIInput`- oder `DecisionDebug`-Wirkung.

V2.2 darf Lobby- oder Matchchat nur über eigene Datenmodell-, Retention-, Report-/Block- und Testgates erweitern. Dieser Testplan ist eines dieser Gates, aber keine Funktionsfreigabe.

## Verbotene Test-Needles

Jeder Payload-, Export-, Debug- und Log-Scan für Chat-Slices muss mindestens diese Muster als Negativ-Needles verwenden:

| Gruppe | Needles |
| --- | --- |
| Chat | eindeutiger Chatrohtext, `chatMessageId`, `chatMessages`, Report-Freitext, `reported_chat_evidence` |
| Tokens | `sessionToken`, `reconnectToken`, `joinToken`, `hostSessionToken`, `hostReconnectToken`, `tokenHash`, `sessionTokenHash`, Cookies |
| Engine/Hidden | `GameState`, `FullState`, `privatePayload`, `cardInstances`, `privateDeckSnapshots`, `decklist`, `deckList`, `runnerDeck`, `corpDeck`, verdeckte Kartentitel |
| KI/Debug | `AIInput`, `aiInput`, `DecisionDebug`, `aiDecisionDebug`, `decisionDebug`, `beliefState` |
| Replay/Hash | Chatrohtext in Replay-Timeline, Chat-ID in Replay-Export, Chat-Reporttext in Replay-Metadaten, StateHash-Änderung durch Chat |
| Ops | lokale Dateipfade, rohe IP-/User-Agent-Diagnose außerhalb redigierter Auditfelder |

Tests sollen nicht nur Schlüsselnamen prüfen. Für mindestens einen Fall muss ein eindeutiger Chattext wie `CHAT-RED-BND-unique-raw-text` gesendet oder injiziert werden und danach auf allen verbotenen Flächen fehlen.

## Testmatrix

| ID | Fläche | Testfall | Erwartung | Empfohlener Ort |
| --- | --- | --- | --- | --- |
| V22-CHAT-T001 | Chat-Sendepfad | Berechtigte Lobbyteilnehmende senden eindeutigen Chattext. | Annahme nur in Chat-/Lobby-Schicht; kein `GameState`, kein `GameEvent`, kein `PublicGameEvent`. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T002 | Chat-Sendepfad | Unberechtigte Session, falsche Side oder abgelaufener Token sendet Chat. | Ablehnung mit `SafeErrorPayload`; Fehler enthält keinen Roh-Token, keine Deckdaten und keinen gegnerischen Status. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T003 | Reconnect | Host und Joiner reconnecten in die Startlobby nach Chatnachrichten. | Nur berechtigte Seite erhält erlaubte `chatMessages`; Payload enthält keine Tokens, Decklisten, `cardInstances`, `AIInput`, `DecisionDebug` oder verdeckte Kartentitel. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T004 | Reconnect | Reconnect nach Matchaktivierung. | Aktive SidePayload enthält keinen Lobbychat und keine Chat-IDs, solange kein eigener Matchchat-Slice freigegeben ist. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T005 | WebSocket | `send_lobby_chat` erzeugt `lobby_update` für beide Teilnehmenden. | Broadcast bleibt Lobby-Payload; kein `state_update`, keine LegalAction-Änderung, keine Engine-Event-Erzeugung. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T006 | WebSocket | `send_lobby_chat` während `active`, `finished`, `cancelled` oder ohne Startlobby. | Ablehnung mit redigiertem Fehler; keine MatchVersion-/StateVersion-Änderung außer klar dokumentierter Lobby-Metadatenwirkung. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T007 | Server-Payload | Bootstrap, Join, Lobby-Update, Reconnect und Fehlerpayloads werden serialisiert gescannt. | Keine verbotenen Needles außer explizit erlaubtem Chattext in berechtigter Lobby-Chatliste. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T008 | Replay-Index | Match mit Chat wird in Replay-Index gelistet. | Replay-Metadaten enthalten keinen Chattext, keine Chat-ID und keine Reporttexte. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T009 | Replay-View | Runner-, Korp- und `local_analysis`-Replay-Views nach Chat. | Timeline, PublicEvents, RandomDrawRecords und Debugfelder enthalten keine Chatdaten. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T010 | Replay-Export | Export nach Chat. | Exportartefakt enthält keinen Chattext, keine Chat-ID, keine Reporttexte und keine verbotenen Hidden-/Token-/KI-Felder. | `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T011 | StateHash | Zwei gleiche Engine-Historien mit unterschiedlichem Chatverlauf werden verglichen. | Finaler Engine-StateHash, EventLog-StateHashes und Replay-StateHash-Checks sind identisch. | `apps/server/src/multiplayer.test.ts` oder `packages/engine/src/index.test.ts` |
| V22-CHAT-T012 | StateHash | Chat löschen, verbergen oder als reported markieren. | Keine Änderung an Engine-StateHash, RandomCounter oder RandomDrawRecords. | späterer V2.2/V2.6 Slice |
| V22-CHAT-T013 | KI-Input | KI-Match oder AI-Turn nach Lobbychat/Matchchat-Dummy. | `buildAiDecisionInputDto` und live übergebene AIInput-DTOs enthalten keinen Chattext, keine Chat-ID und keinen Reporttext. | `packages/ai/src/index.test.ts` und `apps/server/src/multiplayer.test.ts` |
| V22-CHAT-T014 | DecisionDebug | KI-Entscheidung nach Chat und injiziertem Debug-Needle. | `DecisionDebug`, Replay-Debug und Sanitizer-Ausgaben enthalten keine Chatdaten; verbotene Debugwerte werden redigiert. | `packages/ai/src/index.test.ts` |
| V22-CHAT-T015 | Logs/Observability | Fehler-, Audit- und Diagnosepfade mit Chat-Needle. | Logs enthalten keinen Chatrohtext ohne eigene Policy und keine Tokens/Hidden-/KI-Daten; Redaction-Baseline meldet Verstöße. | `apps/server/src/internet-hardening*.test.ts` oder Moderations-Tests |
| V22-CHAT-T016 | Moderation-Evidence | Report verweist auf Chatnachricht. | Evidence nutzt `chatMessageId`/Referenz und Datenklasse `D2_user_generated_content`; sie kopiert keinen FullState, keine Hidden-Daten, kein `AIInput`, kein `DecisionDebug`. | späterer V2.6 Slice |

## Mindest-Leak-Scans

Spätere Implementierungsslices müssen mindestens diese Scanflächen serialisieren und gegen die verbotenen Needles prüfen:

1. `createMatch`, `joinMatch`, `bootstrap`, `reconnectMatch`, `setLobbyReady`, `cancelLobbyCountdown`, `sendLobbyChat`.
2. WebSocket-Nachrichten `lobby_update`, `state_update`, `error` und alle chatbezogenen Kommandos.
3. `listReplayIndex`, `loadReplayView` für `runner`, `corp`, `local_analysis`, sowie `exportReplay`.
4. AIInput-DTOs aus Live-Controller, Simulation/Soak und Replay-/Reconnect-nahen Belief-State-Pfaden.
5. DecisionDebug in Live-Event-Payloads, Replay-Timeline und exportierten Artefakten.
6. Observability-, Health-, Connection-Audit-, Moderations-Audit- und Fehlerlog-Oberflächen.

Erlaubte Ausnahme: In einer berechtigten Lobby- oder Matchchat-Nutzpayload darf der eigene Chattext innerhalb des expliziten Chatfeldes erscheinen. Dieselbe Nachricht darf nicht in Engine-, Replay-, KI-, Debug-, PublicEvent-, Log- oder Fehlerflächen erscheinen.

## Replay- und StateHash-Negativtests

Der Pflichtvergleich für V2.2 lautet:

1. Erzeuge zwei Matches mit identischem Seed, identischer Deck-/Side-Konfiguration und identischer LegalAction-Historie.
2. Führe in Match A keinen Chat aus.
3. Führe in Match B vor Matchstart mehrere Chatnachrichten, Chat-Reconnect und mindestens eine Chat-Lösch-/Reportstatus-Mutation aus, sobald diese Features existieren.
4. Aktiviere beide Matches und spiele dieselbe Action-Sequenz über `LegalActions` und `applyAction`.
5. Vergleiche `GameState.stateHash`, `eventLog[].stateHashAfter`, `replayMatch().finalStateHash`, `loadReplayView().timeline[].stateHashCheck`, `randomDrawRecords` und `randomCounter`.

Erwartung: Chat- und Moderationsmetadaten dürfen diese Werte nicht verändern. Wenn ein Chat-Slice `matchVersion` oder Lobby-Metadaten erhöht, muss der Test diese Orchestrierungsschicht bewusst getrennt vom Engine-StateHash halten.

## KI-Input- und DecisionDebug-Vertrag

KI-Tests müssen Chat als gegnerische oder eigene soziale Information vollständig ignorieren:

- `AIInput` darf keine Chattexte, Chat-IDs, Reporttexte, Reportstatus oder Blocklisten enthalten.
- `DecisionDebug` darf Chatdaten weder in `visibleReasons`, `evidence`, `facts`, `hypotheses`, `opponentModel` noch in freien Debugstrings enthalten.
- Redaction-Sanitizer müssen Chat-Needles genauso behandeln wie Tokens, `privatePayload`, `cardInstances`, Decklisten und Hidden-Info-Marker.
- KI-Soak-, Coaching-, Benchmark- und Doctrine-Ausgaben dürfen Chat nicht als Lernsignal persistieren.

Wenn später ein separates Fair-Play- oder Abuse-Analysemodell entsteht, ist das ein Moderations-/Plattform-Slice und kein AI-Controller-Signal.

## Gate für spätere Implementierung

Ein V2.2-Chat-Implementierungsslice ist erst testreif, wenn mindestens V22-CHAT-T001 bis V22-CHAT-T015 als automatisierte oder präzise manuelle Gate-Checks zugeordnet sind. V22-CHAT-T016 wird spätestens mit Report-/Moderations-Evidence Pflicht.

Nicht bestandene Chat-Redaction-Tests blockieren Public Lobby, Public Replay, Moderation Console und jeden Chat-Ausbau über den engen V1.0.3-Lobbychat hinaus.
