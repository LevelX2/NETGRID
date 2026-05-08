# V1.0.8 Implementation Review - Storage/Backup-Härtung

Stand: 2026-05-06
Status: implemented

## Ergebnis

V1.0.8 ist umgesetzt.

`V1_0_8_implemented: true`

SQLite ist jetzt der private lokale Standard-Storage für Multiplayer-Matches. Der bestehende `MultiplayerStorage`-Port bleibt fachlich stabil; `MultiplayerService`, Engine, REST, WebSocket und PlayerViews arbeiten weiterhin mit vollständigen `StoredMatch`-Records.

## Technische Entscheidungen

- SQLite-API: `node:sqlite` mit `DatabaseSync`, passend zur Node-24-Zielumgebung.
- Persistenzmodell: hybrides Modell mit `matches.record_json` als vollständigem Roundtrip-Anker plus relationalen Spiegeltabellen für Meta, Sessions, Tokens, GameState, Events, Receipts, Snapshots, PendingUndo, private Decksnapshots und StartLobby.
- Schema-Version: `storage_meta` mit `schema_version = 1`, `storage_format = netgrid_multiplayer_sqlite`, Erstell-/Migrations- und Legacy-Import-Marken.
- Runtime-Default: `data/runtime/multiplayer/netgrid.sqlite`.
- JSON-Storage: bleibt über `NETGRID_STORAGE_KIND=json` als Legacy-/Testpfad nutzbar.
- Legacy-Import: kontrollierter Import aus `NETGRID_LEGACY_MATCH_STORAGE_PATH` oder `data/runtime/multiplayer/matches.json`, nur wenn SQLite leer ist, mit Strukturvalidierung, Pre-Migration-Backup und enger Normalisierung älterer Records ohne `match.mode`.
- Backup/Restore: lokale Helfer erzeugen Manifest, SHA-256-Prüfsummen, Schema-/Integritätsprüfung und Pre-Restore-Backup.
- E2E-Isolation: `corepack pnpm e2e` setzt `NETGRID_STORAGE_KIND=sqlite` und nutzt `tmp/e2e-runtime-*/netgrid.sqlite`.

## Konfiguration

| Variable | Verhalten |
| --- | --- |
| `NETGRID_STORAGE_KIND` | `sqlite` als Standard; `json` Legacy/Test; `memory` gezielte Entwicklung/Tests. |
| `NETGRID_SQLITE_STORAGE_PATH` | SQLite-Datei; Default `data/runtime/multiplayer/netgrid.sqlite`. |
| `NETGRID_MATCH_STORAGE_PATH` | Legacy-JSON-Pfad, wenn `NETGRID_STORAGE_KIND=json`. |
| `NETGRID_LEGACY_MATCH_STORAGE_PATH` | JSON-Importquelle; Default `data/runtime/multiplayer/matches.json`. |
| `NETGRID_STORAGE_BACKUP_DIR` | Backup-Ziel; Default `data/runtime/backups/`. |

## Lokale Admin-Helfer

- `corepack pnpm storage:inspect`
- `corepack pnpm storage:backup`
- `corepack pnpm storage:restore -- <backupDir>`
- `corepack pnpm storage:import-legacy`

Restore ist ein lokaler Offline-/Admin-Ablauf. Der laufende Server soll vor einem produktiven Restore gestoppt sein.

## Redaction

Health zeigt nur abstrakte Storage-Signale: Storage-Art, Schema-Version, Datenbank-Basename, Matchanzahl und Migrations-/Importstatus. Backup-Manifeste enthalten nur Dateinamen, Größen, Prüfsummen, Schema-Version, Backup-ID, Grund und Matchanzahl.

Gesperrt bleiben Klartext-Tokens, vollständige Token-Hashwerte in Diagnoseflächen, `cardInstances`, `privateDeckSnapshots`, Decklisten, `privatePayload` und Hidden-Zone-Inhalte. Die E2E-Ausgabe redaktioniert außerdem Join-Token-Querys und Token-/Hashmuster aus Dev-Server-Logs.

## Testabdeckung

Ergänzt wurden Server-Tests für:

- SQLite-Default und redaktionierte Health-Signale.
- vollständigen `StoredMatch`-Roundtrip inklusive Tokens, Sessions, GameState, Events und privaten Decksnapshots.
- Legacy-JSON-Import mit Pre-Migration-Backup.
- ungültigen Legacy-Import ohne Teilübernahme.
- unbekannt neues Schema und beschädigte SQLite-Datei.
- Backup, Restore und Pre-Restore-Backup.
- manipulierte Backups.
- Persistenzfehler ohne erfolgreichen Action-Return.

Der Browser-Gate prüft zusätzlich temporäre SQLite-Runtime-Isolation und Health-Redaction.

## Grenzen

V1.0.8 ändert keine Engine-Regelautorität, keine Karten, keine Mechaniken, keine KI-Entscheidungslogik, keine Replay-/StateHash-/Randomness-Verträge, keine Accounts, keine öffentlichen Plattformfunktionen und keinen Postgres-Pfad.
