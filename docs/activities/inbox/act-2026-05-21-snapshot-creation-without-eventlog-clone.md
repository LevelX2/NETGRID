---
activityId: act-2026-05-21-snapshot-creation-without-eventlog-clone
status: inbox
kind: cleanup
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Snapshot-Erzeugung ohne Eventlog-Tiefklon

## Ziel

`snapshotFor` soll bei jedem Zug nicht mehr den kompletten Runtime-State inklusive wachsender Event-Historie tief klonen. Snapshots sollen funktional unverändert bleiben, aber intern als GameState ohne Event-Historie plus spätere Hydrierung behandelt werden.

## Kontext und Quellen

- Storage speichert neue Snapshots bereits ohne eingebettete `eventLog`.
- Vor dem Speichern erzeugt `MultiplayerService.snapshotFor` jedoch weiterhin `gameState: clone(gameState)`.
- Bei langen Matches wird dieser Klon vor jeder Human- oder KI-Aktion teuer, obwohl Undo-Snapshots die vollständige Event-Historie nicht direkt im Snapshot-Blob brauchen.
- Relevante Dateien:
  - `apps/server/src/multiplayer.ts`
  - `apps/server/src/storage-sqlite.ts`
  - `apps/server/src/multiplayer.test.ts`

## Scope

- `snapshotFor` so anpassen, dass die Snapshot-`gameState`-Kopie keine eingebettete Event-Historie tief klont.
- Sicherstellen, dass Undo und Full-Load bei Bedarf weiterhin die passende Event-Historie hydrieren oder aus `record.eventLog`/`engine_events` verwenden.
- Tests für Undo vor und nach verdeckter Information, Replay und StateHash mit langem Eventlog ergänzen oder erweitern.
- Prüfen, ob In-Memory-Storage und SQLite-Storage denselben Snapshot-Vertrag brauchen.

## Nicht im Scope

- Kein Reduzieren der Anzahl verfügbarer Undo-Snapshots.
- Kein Replay-Verzicht und kein Kürzen der gespeicherten Event-Historie.
- Keine Änderung an LegalActions, Kartenlogik oder Engine-StateHash.
- Keine Bestandssnapshot-Migration; das bleibt im separaten SQLite-Kompaktierungspaket.

## Akzeptanzkriterien

- [ ] `snapshotFor` erzeugt neue Snapshots ohne Deepclone des historischen Eventlogs.
- [ ] Undo findet den richtigen Snapshot und stellt den erwarteten Spielzustand wieder her.
- [ ] Replay- und StateHash-Tests bleiben stabil.
- [ ] Ein Regressionstest deckt einen Snapshot nach mehreren Events ab und bestätigt, dass keine private Event-Historie im Snapshot-Klon nötig ist.
- [ ] Checks: `corepack pnpm --filter @netgrid/server typecheck`, `corepack pnpm --filter @netgrid/server test`.

## Umsetzungshinweise

- Den Unterschied zwischen Engine-Event-Historie und spielrelevantem State explizit im Code halten.
- Bei In-Memory-Tests nicht versehentlich Funktionalität nur durch Referenzteilung erhalten.
- Hidden-Info-Barrieren für Undo bleiben unverändert maßgeblich.

## Ergebnisnotiz

Noch offen.
