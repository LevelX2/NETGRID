# Multiplayer Test Matrix MVP 0.2

Status: Phase 0.2 requirements freeze candidate  
Stand: 2026-05-03

| Test ID | Art | Beschreibung | Requirements | Szenario |
|---|---|---|---|---|
| MT-BASE-001 | Unit | Baseline `0.2.0` enthält Multiplayer-/PlayerView-Versionen und unveränderte CardImplementation `0.1.0`. | MR-001 | - |
| MT-REST-001 | Integration | Host erstellt Match als Runner/Corp/Random und erhält Host Session plus Join URL. | MR-002, MR-003 | SCN-MP-001 |
| MT-REST-002 | Integration | Joiner übernimmt freie Seite; falsche Seite/falscher Token abgelehnt. | MR-004 | SCN-MP-001 |
| MT-TOKEN-001 | Unit | Tokens haben Entropie, Hash und keine Klartextpersistenz. | MR-003, MR-005 | - |
| MT-TOKEN-002 | Unit | Ungültige Tokens leaken keine Match-/Seitendetails. | MR-004 | - |
| MT-SEC-001 | Static/Integration | Logs, Receipts, Events und Payloads enthalten keine Klartexttokens. | MR-005 | - |
| MT-MATCH-001 | Unit | MatchStatus und MatchVersion wechseln monoton. | MR-006 | - |
| MT-SESSION-001 | Integration | Eine aktive Session pro Seite; Reconnect ersetzt alte Connection. | MR-007 | SCN-MP-002 |
| MT-WS-001 | Integration | WebSocket `join_match` validiert Session und sendet PlayerView. | MR-008 | SCN-MP-001 |
| MT-WS-002 | Integration | Alle Servernachrichten erfüllen Schema und Visibility-Regel. | MR-009, MR-010 | - |
| MT-ACTION-001 | Integration | Clients setzen keinen GameState; Server nutzt Engine `applyAction`. | MR-011 | - |
| MT-ACTION-002 | Integration | `submit_action` validiert Token, Seite, Status, Version, Idempotency und Engine-Legalität. | MR-012 | - |
| MT-CONC-001 | Concurrency | Per-Match-Lock verhindert doppelte gleichzeitige Transition. | MR-013 | - |
| MT-CONC-002 | Concurrency | Gleicher IdempotencyKey gibt gespeicherten Receipt zurück. | MR-014 | - |
| MT-CONC-003 | Concurrency | Stale StateVersion wird abgelehnt und resynchronisiert. | MR-015 | - |
| MT-REC-001 | Integration | Reconnect lädt PlayerView, LegalActions, Pending Choice, EventTail. | MR-016 | SCN-MP-002 |
| MT-REC-002 | Integration | Reconnect in Action Phase, Encounter und Access. | MR-017 | SCN-MP-002 |
| MT-UNDO-001 | Integration | Undo Request/Accept/Decline funktioniert. | MR-018 | SCN-MP-003 |
| MT-UNDO-002 | Integration | Undo vor Hidden Info stellt Snapshot wieder her. | MR-019 | SCN-MP-003 |
| MT-UNDO-003 | Integration | Undo nach Hidden Info wird side-sicher blockiert. | MR-020 | SCN-MP-004 |
| MT-STOR-001 | Integration | Storage persistiert Match, Sessions, TokenHashes, Snapshot, EventLog, Receipts, UndoSnapshots. | MR-021 | - |
| MT-STOR-002 | Unit | Storage-Port kann JSON/SQLite-Adapter aufnehmen. | MR-025 | - |
| MT-E2E-001 | E2E | Zwei Browserfenster spielen private Demo-Partie. | MR-022 | SCN-MP-001 |
| MT-REPLAY-001 | Integration | Multiplayer-Replay reproduziert StateHash. | MR-023 | - |
| MT-DOC-001 | Docs | README/Betriebsdoku enthält Start, Storage, Tokens, Backup, HTTPS/WSS. | MR-024 | - |
| MT-UI-001 | UI | Join, Copy-Link, Connection State und Undo-Prompts sichtbar. | MR-026 | SCN-MP-001 |
| MT-VIS-001 | Visibility | WebSocket/Reconnect/Undo/Error enthält keine hidden Corp-Daten im Runner-Payload. | MR-010 | SCN-MP-002 |
| MT-VIS-002 | Visibility | Corp-Payload enthält keine Runner-Grip-/Stack-Titel. | MR-010 | - |

