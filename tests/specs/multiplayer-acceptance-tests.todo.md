# Multiplayer Acceptance Tests MVP 0.2

Status: implemented in MVP 0.2 server/unit/integration coverage plus local smoke checks.

- [x] MT-BASE-001: Baseline `0.2.0` with unchanged demo card implementation `0.1.0`.
- [x] MT-REST-001: create private match as Runner, Corp and Random.
- [x] MT-REST-002: join free side; reject invalid or wrong-side token without leak.
- [x] MT-TOKEN-001: token entropy and hash-only storage.
- [x] MT-TOKEN-002: invalid token error is generic.
- [x] MT-SEC-001: no cleartext token in logs, events, receipts or payloads.
- [x] MT-MATCH-001: MatchStatus and MatchVersion monotonic.
- [x] MT-SESSION-001: one active session per side and reconnect replaces old connection.
- [x] MT-WS-001: WebSocket `join_match` validates session and sends PlayerView.
- [x] MT-WS-002: all server message schemas are side-safe.
- [x] MT-ACTION-001: clients cannot set GameState directly.
- [x] MT-ACTION-002: `submit_action` validates token, side, status, version, idempotency and Engine legality.
- [x] MT-CONC-001: per-match lock prevents simultaneous double transition.
- [x] MT-CONC-002: duplicate idempotency key returns stored ActionReceipt.
- [x] MT-CONC-003: stale StateVersion rejected with resync.
- [x] MT-REC-001: reconnect restores PlayerView, LegalActions, Pending Choice and EventTail.
- [x] MT-REC-002: reconnect during Action Phase, Encounter and Access.
- [x] MT-UNDO-001: undo request, accept and decline.
- [x] MT-UNDO-002: undo before hidden info restores snapshot.
- [x] MT-UNDO-003: undo after hidden info is blocked safely.
- [x] MT-STOR-001: storage persists match, sessions, token hashes, snapshots, events and receipts.
- [x] MT-E2E-001: two browser windows play a private demo match.
- [x] MT-REPLAY-001: multiplayer replay reproduces final StateHash.
- [x] MT-VIS-001: Runner payloads leak no hidden Corp data.
- [x] MT-VIS-002: Corp payloads leak no Runner grip/stack data.

Primary executable coverage: `apps/server/src/multiplayer.test.ts`, `tests/specs/visibility-contract.test.ts`.

Local smoke coverage: `http://127.0.0.1:8787/health`, REST create/join, WebSocket host/join, Corp mandatory action, Runner payload leak scan, and Next page HTTP 200.
