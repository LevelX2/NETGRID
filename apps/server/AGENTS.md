# Server rules

- Server owns authoritative Match and full GameState.
- Clients cannot set GameState or bypass Engine.
- Every action goes through token/session validation, match status validation, stateVersion validation, idempotency handling, and `applyAction`.
- MVP 0.2 must process one transition per match at a time.
- Tokens are high entropy, stored only as hashes, and never logged.
- WebSocket, reconnect, undo, errors, and logs must be side-filtered.
- SQLite or a stable JSON adapter is acceptable early; SQLite is preferred for MVP 0.2.
