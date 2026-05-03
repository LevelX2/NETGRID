# Multiplayer Acceptance Tests TODO MVP 0.2

Status: derived after MVP 0.1 gate, to be implemented in MVP 0.2.

- [ ] MT-BASE-001: Baseline `0.2.0` with unchanged demo card implementation `0.1.0`.
- [ ] MT-REST-001: create private match as Runner, Corp and Random.
- [ ] MT-REST-002: join free side; reject invalid or wrong-side token without leak.
- [ ] MT-TOKEN-001: token entropy and hash-only storage.
- [ ] MT-TOKEN-002: invalid token error is generic.
- [ ] MT-SEC-001: no cleartext token in logs, events, receipts or payloads.
- [ ] MT-MATCH-001: MatchStatus and MatchVersion monotonic.
- [ ] MT-SESSION-001: one active session per side and reconnect replaces old connection.
- [ ] MT-WS-001: WebSocket `join_match` validates session and sends PlayerView.
- [ ] MT-WS-002: all server message schemas are side-safe.
- [ ] MT-ACTION-001: clients cannot set GameState directly.
- [ ] MT-ACTION-002: `submit_action` validates token, side, status, version, idempotency and Engine legality.
- [ ] MT-CONC-001: per-match lock prevents simultaneous double transition.
- [ ] MT-CONC-002: duplicate idempotency key returns stored ActionReceipt.
- [ ] MT-CONC-003: stale StateVersion rejected with resync.
- [ ] MT-REC-001: reconnect restores PlayerView, LegalActions, Pending Choice and EventTail.
- [ ] MT-REC-002: reconnect during Action Phase, Encounter and Access.
- [ ] MT-UNDO-001: undo request, accept and decline.
- [ ] MT-UNDO-002: undo before hidden info restores snapshot.
- [ ] MT-UNDO-003: undo after hidden info is blocked safely.
- [ ] MT-STOR-001: storage persists match, sessions, token hashes, snapshots, events and receipts.
- [ ] MT-E2E-001: two browser windows play a private demo match.
- [ ] MT-REPLAY-001: multiplayer replay reproduces final StateHash.
- [ ] MT-VIS-001: Runner payloads leak no hidden Corp data.
- [ ] MT-VIS-002: Corp payloads leak no Runner grip/stack data.
