# Engine rules

- This package is a pure TypeScript rules engine.
- No React, browser, WebSocket, database, file-system, or AI dependencies.
- Engine functions must be deterministic for the same initial state, seed, and event log.
- Never trust UI, server, AI, or client input.
- Validate every PlayerAction inside `applyAction`.
- Run `validateGameState` after every successful transition.
- Every successful transition emits GameEvent with stateVersionBefore, stateVersionAfter, timingPoint, publicPayload, privatePayload, and resultingStateHash.
- Public payloads must not contain hidden card identities or private target data.
- Use CardInstanceRef for zones; do not duplicate card instances.
- Add tests for every new mechanic and every playable card effect.
