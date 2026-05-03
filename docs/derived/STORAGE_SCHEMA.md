# Storage Schema MVP 0.2

Status: Phase 0.2 requirements freeze candidate  
Stand: 2026-05-03

## Adapter

MVP 0.2 implementiert einen austauschbaren Storage-Port. JSON-File-Storage ist für den ersten privaten Stand erlaubt; SQLite bleibt bevorzugtes Härtungsziel.

## Entitäten

| Entity | Felder | Requirements |
|---|---|---|
| `MatchRecord` | `matchId`, `status`, `matchVersion`, `baseline`, `settings`, `createdAt`, `updatedAt`, `winner?` | MR-006, MR-021 |
| `SessionRecord` | `sessionId`, `matchId`, `side`, `tokenId`, `connected`, `createdAt`, `lastSeenAt` | MR-007, MR-021 |
| `TokenRecord` | `tokenId`, `matchId`, `allowedSide`, `tokenHash`, `createdAt`, `expiresAt?`, `revokedAt?`, `usedAt?` | MR-003, MR-005 |
| `StateSnapshot` | `snapshotId`, `matchId`, `stateVersion`, `matchVersion`, `stateHash`, `gameState`, `createdAt`, `hiddenInfoBarrier` | MR-016, MR-019, MR-021 |
| `EventRecord` | `eventId`, `matchId`, `stateVersionBefore`, `stateVersionAfter`, `stateHashAfter`, `publicPayload`, `privatePayloadEncryptedOrLocalOnly` | MR-010, MR-023 |
| `ActionReceipt` | `idempotencyKey`, `matchId`, `side`, `accepted`, `stateVersionBefore`, `stateVersionAfter`, `stateHashAfter`, `errorCode?` | MR-014 |
| `UndoSnapshot` | `undoRequestId`, `matchId`, `targetEventId`, `snapshotId`, `requestedBy`, `status`, `hiddenInfoSafe` | MR-018 bis MR-020 |

## Persistenzregeln

- Klartexttokens werden nie gespeichert.
- Public/side-filtered Logs dürfen keine privatePayloads enthalten.
- Lokale Debug-Full-State-Snapshots bleiben serverseitig und werden nie an Clients gesendet.
- Crash Recovery lädt den letzten Snapshot und EventTail oder pausiert das Match sauber.

