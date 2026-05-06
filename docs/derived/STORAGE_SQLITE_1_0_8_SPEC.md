# Storage SQLite 1.0.8 Spezifikation

Stand: 2026-05-06
Status: requirements_spec

## Zweck

Diese Spezifikation friert den technischen Zielzustand für die SQLite-basierte private Match-Persistenz in V1.0.8 ein. SQLite ersetzt den bisherigen JSON-Dateispeicher als Standardpfad, ohne den fachlichen `MultiplayerService`-, Engine-, WebSocket-, REST-, PlayerView- oder Replay-Vertrag zu verändern.

## Adaptermodell

Zielstruktur:

```txt
MultiplayerService
  -> MultiplayerStorage
       -> InMemoryMatchStorage     (Tests)
       -> JsonFileMatchStorage     (Legacy, Migration, einfache Fixtures)
       -> SqliteMatchStorage       (privater lokaler Standard)
```

`MultiplayerStorage` bleibt fachlich dieselbe Grenze:

```txt
load(matchId) -> StoredMatch | undefined
save(record) -> void
list?() -> StoredMatch[]
```

Erweiterungen wie `health`, `close`, `backup` oder `migrate` dürfen ergänzt werden, müssen aber optional oder adaptergekapselt bleiben. Service-Logik darf keine SQLite-SQL-Fragmente kennen.

## Technische API

Primäre Entscheidung: `node:sqlite` verwenden, weil das Projekt Node 24 voraussetzt und die lokale Zielumgebung `node:sqlite` bereitstellt.

Zulässiger Fallback: Falls `node:sqlite` in der Umsetzung einen harten Blocker zeigt, darf eine Node-24-kompatible SQLite-Bibliothek genutzt werden. Dieser Wechsel muss im Implementation Review mit Grund, Risiken und Zusatzabhängigkeit dokumentiert werden.

Postgres ist kein Fallback für V1.0.8.

## Runtime-Pfade

| Zweck | Default |
| --- | --- |
| SQLite-Datenbank | `data/runtime/multiplayer/netrunner.sqlite` |
| Legacy-JSON | `data/runtime/multiplayer/matches.json` |
| Backups | `data/runtime/backups/` |
| E2E-SQLite | `tmp/e2e-runtime-*/netrunner.sqlite` |

Runtime-Dateien, SQLite-WAL/SHM-Dateien, Backups und temporäre E2E-Daten bleiben nicht versioniert.

## Schema-Version

V1.0.8 startet mit Storage-Schema `1`.

Mindesttabelle:

| Tabelle | Pflichtfelder |
| --- | --- |
| `storage_meta` | `key`, `value`, `updated_at` |

Pflichtwerte:

- `schema_version = 1`
- `storage_format = netrunner_multiplayer_sqlite`
- `created_at`
- `last_migration_at`
- `last_legacy_import_at`, falls importiert
- `legacy_import_source_hash`, falls importiert

Unbekannt neuere Versionen führen zu kontrolliertem Startabbruch. Bekannte ältere Versionen dürfen nur über explizite Migrationsschritte geöffnet werden.

## Datenmodell

V1.0.8 verwendet ein hybrides Modell: fachliche Indexfelder relational, komplexe Engine- und Snapshot-Nutzdaten als validierte JSON-Spalten. Das Ziel ist robustes Laden, Roundtrip und spätere Migration, nicht neue Regelautorität.

### Mindesttabellen

| Tabelle | Zweck |
| --- | --- |
| `matches` | Match-Metadaten, Status, Mode, Version, Seed, Baseline, Settings, Lifecycle, Zeitstempel und vollständiger `StoredMatch`-JSON-Roundtrip. |
| `sessions` | Session-Metadaten und Token-Hashes je Match. |
| `tokens` | Join-/Session-/Reconnect-Token-Hashes mit Statusfeldern. |
| `game_states` | aktueller `GameState` als JSON plus StateVersion und StateHash. |
| `events` | `EventRecord`-Liste mit PublicPayload, Hidden-Info-Markern und StateHashes. |
| `action_receipts` | Idempotency Receipts. |
| `state_snapshots` | Reconnect-/Undo-relevante StateSnapshots. |
| `undo_snapshots` | UndoSnapshot-Metadaten. |
| `pending_undo` | aktueller PendingUndo je Match. |
| `private_deck_snapshots` | serverseitige private Decksnapshots als JSON, nie für öffentliche Payloads. |
| `start_lobbies` | StartLobby-Zustand inklusive privatem Lobbychat als Match-Lifecycle-Zustand. |

`matches.record_json` oder ein äquivalentes vollständiges Record-Feld ist in V1.0.8 erlaubt und empfohlen, solange die relationalen Tabellen für Validierung, Migration und gezielte Tests synchron gehalten werden. Wenn die Umsetzung vollständig relational speichert, müssen die Roundtrip-Tests dieselbe Abdeckung erreichen.

## Integritätsregeln

- Primärschlüssel: `match_id` für Match-nahe Tabellen; zusammengesetzte Schlüssel für Events/Snapshots/Receipts.
- Fremdschlüssel sollen aktiviert werden.
- `PRAGMA foreign_keys = ON` ist Pflicht.
- `PRAGMA journal_mode = WAL` ist erlaubt, aber Backups müssen WAL/SHM konsistent berücksichtigen. Alternativ darf für einfache lokale Backups ein konsistenter SQLite-Backup-/Dump-Pfad verwendet werden.
- `save(record)` läuft in einer Transaktion.
- `save(record)` ersetzt den vollständigen Stand eines Matches konsistent. Teilweise Aktualisierung ohne vollständige Konsistenz ist nicht zulässig.
- `list()` darf nur vollständige, validierte `StoredMatch`-Records zurückgeben.

## StoredMatch-Validierung

Vor Persistenz und nach Laden müssen mindestens diese Strukturregeln prüfbar sein:

- `match.matchId` ist vorhanden und konsistent mit allen Match-Subrecords.
- `match.matchVersion` ist eine positive Zahl.
- `match.status` ist ein bekannter `MatchStatus`.
- `match.mode` ist ein bekannter `MatchMode`.
- Sessions enthalten `sessionTokenHash` und `reconnectTokenHash`, aber keine Klartext-Tokens.
- Tokens enthalten `tokenHash`, aber kein Klartext-Token.
- Aktive Matches enthalten einen `gameState`; Pending-/Ready-Lobby-Stände dürfen noch keinen `gameState` haben.
- Wenn `gameState` vorhanden ist, passen `stateVersion` und berechneter `hashState(gameState)` zu gespeicherten Hashfeldern, soweit diese vorhanden sind.
- `eventLog` enthält nur `EventRecord.publicPayload` plus Marker, keine `privatePayload`.
- Hidden-Info-Barrieren bleiben über `hiddenInfoBarrier` erhalten.
- `privateDeckSnapshots` dürfen persistiert werden, aber nie in Health, Backup-Manifest, Diagnose oder Client-Payloads auftauchen.

## Legacy-JSON-Import

Importquelle:

- explizit `NETRUNNER_LEGACY_MATCH_STORAGE_PATH`, falls gesetzt,
- sonst `data/runtime/multiplayer/matches.json`.

Import wird nur automatisch versucht, wenn:

- `NETRUNNER_STORAGE_KIND=sqlite` aktiv ist oder fehlt,
- die SQLite-Datenbank neu oder leer ist,
- keine erfolgreiche Legacy-Importmarke existiert,
- die Legacy-Datei existiert.

Ablauf:

1. Legacy-Datei lesen.
2. JSON parsen.
3. Top-Level `{ "matches": [...] }` validieren.
4. Jeden `StoredMatch` strukturell validieren.
5. Vor Import ein Backup der Legacy-Datei oder des Runtime-Quellstands erzeugen.
6. SQLite-Schema in Transaktion vorbereiten.
7. Alle Records in einer Importtransaktion schreiben.
8. Importmarke und Quellhash in `storage_meta` schreiben.
9. Legacy-Datei unverändert lassen.

Fehlschlag:

- keine teilweise Übernahme,
- Legacy-Datei bleibt unverändert,
- SQLite bleibt leer oder im letzten konsistenten Stand,
- Fehler ist side-sicher und nennt keine Matchinhalte, Tokens oder Hidden Info.

## Redaction und Diagnose

Persistenz selbst darf Token-Hashes und private serverseitige Decksnapshots speichern, weil sie für Funktion und Reconnect nötig sind. Diagnose darf sie nicht sichtbar machen.

Gesperrt in Health, Logs, Fehlern, Backup-Manifesten und Recovery-Diagnosen:

- `sessionToken`, `reconnectToken`, `joinToken`,
- `hostSessionToken`, `hostReconnectToken`,
- Token-Hashwerte vollständig,
- `cardInstances`,
- `privatePayload`,
- `privateDeckSnapshots`,
- Decklisten und Kartenlisten,
- verdeckte gegnerische Kartentitel,
- konkrete Hidden-Zone-Inhalte.

Erlaubt in Diagnose:

- Storage-Art,
- Schema-Version,
- Datenbankpfad nur lokal-abstrakt oder basename-orientiert,
- Anzahl Matches insgesamt,
- letzter Migrationszeitpunkt,
- Backup-ID,
- generische Fehlercodes wie `storage_corrupt`, `schema_too_new`, `legacy_import_invalid`.

## Serverstart-Verhalten

| Fall | Verhalten |
| --- | --- |
| Runtime-Ordner fehlt | Ordner anlegen, Schema anlegen, leer starten. |
| SQLite-Datei fehlt | Schema anlegen, optional Legacy-Import prüfen. |
| SQLite-Datei leer | Schema anlegen, optional Legacy-Import prüfen. |
| SQLite-Datei gültig und Schema aktuell | normal starten. |
| Schema alt mit Migration | Backup erzeugen, Migration ausführen, starten. |
| Schema alt ohne Migration | kontrolliert abbrechen. |
| Schema neuer als Code | kontrolliert abbrechen. |
| SQLite beschädigt | kontrolliert abbrechen; Restorepfad nennen, keine Inhalte leaken. |
| Legacy-JSON ungültig | Import ablehnen; JSON unverändert lassen; kontrolliert abbrechen oder leer starten nur, wenn explizit so konfiguriert. |

## E2E-Isolation

Der V1.0.7-Harness wird für V1.0.8 angepasst:

- `scripts/run-e2e.mjs` setzt `NETRUNNER_STORAGE_KIND=sqlite`.
- `NETRUNNER_SQLITE_STORAGE_PATH` zeigt auf `tmp/e2e-runtime-*/netrunner.sqlite`.
- `NETRUNNER_E2E_RUNTIME_PATH` zeigt auf denselben SQLite-Pfad.
- Der Runtime-Isolationstest prüft die temporäre SQLite-Datei und stellt sicher, dass weder `data/runtime/multiplayer/netrunner.sqlite` noch `data/runtime/multiplayer/matches.json` beschrieben werden.

## Dokumentation nach Umsetzung

Nach Umsetzung entstehen:

- `docs/derived/V1_0_8_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_8_FINAL_REVIEW.md`

Der Implementation Review muss konkrete technische Entscheidungen dokumentieren:

- verwendete SQLite-API,
- tatsächliche Tabellen,
- Konfigurationsvariablen,
- Migrationsverhalten,
- Backup-/Restore-Befehle,
- bekannte Grenzen.
