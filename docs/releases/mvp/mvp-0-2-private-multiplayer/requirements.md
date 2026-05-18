# MVP 0.2 Requirements

Status: Phase 0.2 requirements freeze candidate  
Stand: 2026-05-03  
Scope: Private Human-vs-Human-Multiplayer über die bestandene MVP-0.1-Engine

## Gate

`ready_for_implementation: true`

Begründung: Der Scope ist auf private Matches mit festen Demo-Decks begrenzt, alle Must-Anforderungen haben stabile IDs und Testabdeckung, WebSocket-/REST-/Storage-/Token-/Reconnect-/Undo-Flows sind spezifiziert, und MVP 0.1 hat das Readiness-Gate bestanden.

## Nicht-Ziele

| ID | Nicht-Ziel |
|---|---|
| MNG-001 | Kein öffentlicher Lobby-Browser und kein Matchmaking. |
| MNG-002 | Kein Accountsystem, keine Profile, keine Rankings, keine Turniere. |
| MNG-003 | Kein freier Deckbau, keine Kartenpool-Erweiterung, keine neuen Pflichtkarten. |
| MNG-004 | Kein Chat, Zuschauer-Modus oder öffentlicher Replay-Browser als Muss. |
| MNG-005 | Keine offizielle Grafik, Logos, Frames, Card Backs oder externe Kartendatenbank. |

## Requirements

| ID | Priorität | Anforderung | Testabdeckung |
|---|---|---|---|
| MR-001 | Must | MVP 0.2 verwendet RulesBaseline `0.2.0` mit unverändertem Demo-Kartenpool `cardImplementationVersion: 0.1.0`. | MT-BASE-001 |
| MR-002 | Must | Ein Host kann ein privates Match mit fester Demo-Deck-Konfiguration und Seite `runner`, `corp` oder `random` erstellen. | MT-REST-001, SCN-MP-001 |
| MR-003 | Must | Der Server erzeugt Host-Session, Host-Reconnect-Token und Join-Link mit geheimem Token. | MT-TOKEN-001 |
| MR-004 | Must | Join-Link erlaubt genau der freien Seite den Beitritt; falsche, abgelaufene oder widerrufene Tokens werden side-sicher abgelehnt. | MT-TOKEN-002, MT-REST-002 |
| MR-005 | Must | Token werden nur gehasht gespeichert und nie im Klartext geloggt oder in PublicEvents ausgegeben. | MT-SEC-001 |
| MR-006 | Must | MatchStatus und MatchVersion sind monoton und werden bei statusrelevanten Änderungen erhöht. | MT-MATCH-001 |
| MR-007 | Must | Jede Seite hat genau eine aktive PlayerSession; Reconnect ersetzt alte Connections derselben Seite. | MT-SESSION-001, SCN-MP-002 |
| MR-008 | Must | WebSocket `join_match` validiert Match, Session/Token und Seite, bevor PlayerView gesendet wird. | MT-WS-001 |
| MR-009 | Must | Server sendet `state_update`, `legal_actions`, `choice_request`, `event_log_update`, `opponent_status`, `action_receipt`, `match_finished` und side-sichere `error`-Nachrichten. | MT-WS-002 |
| MR-010 | Must | Alle WebSocket-, REST-, Reconnect-, Undo-, Error- und Debug-Payloads sind side-gefiltert und enthalten keinen Full GameState. | MT-VIS-001, MT-VIS-002 |
| MR-011 | Must | Clients können keinen GameState setzen; Actions laufen ausschließlich durch serverseitige Engine `applyAction`. | MT-ACTION-001 |
| MR-012 | Must | `submit_action` validiert Token/Session, Seite, MatchStatus, MatchVersion/StateVersion, IdempotencyKey und Engine-Legalität. | MT-ACTION-002 |
| MR-013 | Must | Pro Match wird immer nur eine Action-Transition gleichzeitig verarbeitet. | MT-CONC-001 |
| MR-014 | Must | Doppelte IdempotencyKeys geben gespeicherten ActionReceipt zurück und erzeugen keine zweite Transition. | MT-CONC-002 |
| MR-015 | Must | Stale StateVersion wird abgelehnt und mit frischer PlayerView/LegalActions beantwortet. | MT-CONC-003 |
| MR-016 | Must | Reconnect stellt PlayerView, LegalActions, Pending Choice und side-gefilterten EventLog-Tail wieder her. | MT-REC-001, SCN-MP-002 |
| MR-017 | Must | Reconnect funktioniert in Action Phase, Run/Encounter und Access. | MT-REC-002 |
| MR-018 | Must | Undo kann angefragt, akzeptiert oder abgelehnt werden. | MT-UNDO-001, SCN-MP-003 |
| MR-019 | Must | Undo vor Hidden-Info-Barrier stellt Snapshot wieder her und sendet neue side-gefilterte Views. | MT-UNDO-002, SCN-MP-003 |
| MR-020 | Must | Undo nach Hidden-Info-Barrier wird blockiert, ohne die blockierende verdeckte Information zu verraten. | MT-UNDO-003, SCN-MP-004 |
| MR-021 | Must | Storage speichert Match, Sessions, TokenHashes, GameState Snapshot, EventLog, ActionReceipts und UndoSnapshots. | MT-STOR-001 |
| MR-022 | Must | MVP 0.2 kann lokal in zwei Browserfenstern ein vollständiges privates Match spielen. | MT-E2E-001 |
| MR-023 | Must | Multiplayer-Replay reproduziert finalen StateHash aus Snapshot/EventLog. | MT-REPLAY-001 |
| MR-024 | Must | README/Betriebsdoku beschreibt lokalen privaten Start, Tokens, Storage, Backup und HTTPS/WSS-Hinweis außerhalb localhost. | MT-DOC-001 |
| MR-025 | Should | SQLite ist Standard-Storage; JSON/In-memory nur für Tests und lokale Entwicklung. | MT-STOR-002 |
| MR-026 | Should | Copy-Link-Komfort, Connection-Banner und Undo-Prompts sind in der UI sichtbar. | MT-UI-001 |

## Deterministische Annahmen

- WebSocket-Basis: native `ws`, um das Protokoll explizit und klein zu halten.
- Storage: JSON-File-Adapter für schnelle private Implementierung, mit Schema so entworfen, dass SQLite später ohne Protokollbruch ersetzt werden kann. SQLite bleibt bevorzugtes Härtungsziel.
- Token-Hashing: Node `crypto` mit SHA-256 plus serverseitigem Salt aus Environment, für lokale Entwicklung mit Dev-Fallback.
- Host-Seite: `runner`, `corp` oder `random`; Random nutzt Match-Seed und wird im MatchLog festgehalten.
- Undo-Barrier: jede Access-Entscheidung, HQ random access, R&D access, Remote root access und jedes neu sichtbar gewordene verdeckte Objekt blockieren Undo hinter diese Eventposition.

