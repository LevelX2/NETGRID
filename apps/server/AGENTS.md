# Server rules

- Server owns authoritative Match and full GameState.
- Clients cannot set GameState or bypass Engine.
- Every action goes through token/session validation, match status validation, stateVersion validation, idempotency handling, and `applyAction`.
- Process one transition per match at a time.
- Tokens are high entropy, stored only as hashes, and never logged.
- WebSocket, reconnect, undo, errors, and logs must be side-filtered.
- Use the current repository storage contract and configured SQLite paths; do not introduce a JSON fallback based on historical MVP planning.
