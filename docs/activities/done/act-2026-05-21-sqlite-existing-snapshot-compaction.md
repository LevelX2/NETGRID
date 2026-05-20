---
activityId: act-2026-05-21-sqlite-existing-snapshot-compaction
status: done
kind: cleanup
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/server/src/storage-sqlite.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/http-server.ts
  - apps/server/src/multiplayer.test.ts
  - packages/engine/src/index.ts
  - packages/engine/src/state-hash.ts
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
checks:
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/server test
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine test
---

# SQLite-Bestandssnapshots kompakt migrieren

## Ziel

Bestehende lokale SQLite-Matches sollen nach der Event-Historie-Auslagerung einmalig kompakt umgeschrieben werden, damit alte `state_snapshots.game_state_json`- und `game_states.game_state_json`-Blobs nicht dauerhaft die Last langer Matches bestimmen.

## Kontext und Quellen

- Nutzerbeobachtung: lange Matches werden im späteren Spielverlauf spürbar träger.
- Umsetzung vom 2026-05-21: neue Saves speichern Engine-Events separat in `engine_events` und State-Blobs ohne eingebettete `eventLog`.
- Befund aus lokaler SQLite-Analyse: alte Snapshots großer Matches bestehen zu einem sehr großen Anteil aus wiederholter Event-Historie.
- Relevante Dateien: `apps/server/src/storage-sqlite.ts`, `apps/server/src/multiplayer.test.ts`, `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`.

## Scope

- Einen lokalen, explizit auslösbaren Wartungs-/Kompaktierungspfad für bestehende SQLite-Matches ergänzen.
- Vor der Umschreibung ein SQLite-Backup über den vorhandenen Backup-Pfad erzeugen.
- Für jedes betroffene Match private Engine-Events aus vorhandenen Full-State-Eventlogs sichern, falls `engine_events` noch leer ist.
- `matches.record_json`, `game_states.game_state_json` und vorhandene `state_snapshots.game_state_json` ohne eingebettete Event-Historie neu schreiben.
- Nach der Umschreibung Replay, Undo-Snapshots, StateHash und Hidden-Info-Redaction verifizieren.

## Nicht im Scope

- Keine Begrenzung der Undo-Historie.
- Kein Abschalten oder Kürzen von Replay.
- Keine Änderung an LegalActions, Rules Engine, Kartenlogik oder PlayerViews.
- Kein automatischer Lauf beim Serverstart ohne explizite Freigabe.

## Akzeptanzkriterien

- [x] Der Wartungspfad erstellt vor Datenänderungen ein verwertbares Backup.
- [x] Alte Snapshot-Blobs werden kompakt neu geschrieben, ohne private Replay-Events zu verlieren.
- [x] Full-Load, Partial-Load, Replay-View und Undo funktionieren nach der Kompaktierung unverändert.
- [x] Ein Regressionstest deckt eine Legacy-ähnliche SQLite-Datei mit eingebetteter Event-Historie ab.
- [x] Checks: `corepack pnpm --filter @netgrid/server typecheck`, `corepack pnpm --filter @netgrid/server test`.

## Umsetzungshinweise

- Vorhandene Storage-Maintenance-APIs bevorzugen; keine direkte manuelle SQLite-Migration außerhalb der Anwendung als Standardpfad.
- Der Lauf darf alte Daten nur nach erfolgreicher Backup-Erstellung ändern.
- Die Funktion sollte lokal/admin-orientiert bleiben und keine privaten Payloads in HTTP-, Log- oder UI-Antworten ausgeben.

## Ergebnisnotiz

Erledigt. Der private Wartungspfad `/api/storage/maintenance/snapshot-compaction/apply` erstellt vor der Umschreibung ein Backup, backfillt fehlende `engine_events` aus Legacy-Eventlogs und schreibt Matchrecord, aktuelle GameState-Zeile und StateSnapshots kompakt ohne eingebettete `eventLog` neu. Der Regressionstest stellt eine Legacy-ähnliche SQLite-Datei nach und prüft Backup, Event-Backfill, Full-Load, Partial-Load, Replay, Undo und redigierte HTTP-Antwort.

Verifikation: `corepack pnpm --filter @netgrid/server typecheck`, `corepack pnpm --filter @netgrid/server test`, `corepack pnpm --filter @netgrid/engine typecheck`, `corepack pnpm --filter @netgrid/engine test`.
