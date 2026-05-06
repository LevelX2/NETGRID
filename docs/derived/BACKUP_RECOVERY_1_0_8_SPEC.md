# Backup/Recovery 1.0.8 Spezifikation

Stand: 2026-05-06
Status: requirements_spec

## Zweck

Diese Spezifikation beschreibt Backup, Restore und Recovery für private lokale Runtime-Daten in V1.0.8. Backups sind lokale Betriebsartefakte, keine öffentlichen Replays, keine Exportfunktion für Plattformbetrieb und keine Quelle neuer Regelautorität.

## Backup-Ziel

Default:

```txt
data/runtime/backups/
  netrunner-storage-YYYYMMDD-HHMMSS/
    netrunner.sqlite
    manifest.json
```

Bei JSON-Legacy-Migrationsbackups darf zusätzlich die gesicherte Quelle enthalten sein:

```txt
legacy-matches.json
```

Der genaue Dateiname darf erweitert werden, muss aber im Manifest eindeutig referenziert sein.

## Backup-Manifest

`manifest.json` enthält nur nicht-sensitive Metadaten:

| Feld | Pflicht | Inhalt |
| --- | --- | --- |
| `manifestVersion` | ja | `1` |
| `backupId` | ja | stabile lokale Backup-ID |
| `createdAt` | ja | ISO-Zeitpunkt |
| `release` | ja | `V1.0.8` oder tatsächlicher Release-String |
| `storageKind` | ja | `sqlite` |
| `schemaVersion` | ja | Storage-Schema-Version |
| `source` | ja | abstrakter Quelltyp, z. B. `default_sqlite` oder `legacy_json_import` |
| `files` | ja | Dateinamen, Größen und SHA-256-Prüfsummen |
| `matchCount` | nein | Anzahl Matches, falls ohne Inhaltsleck verfügbar |
| `reason` | nein | z. B. `manual`, `pre_migration`, `pre_restore` |

Verboten im Manifest:

- Klartext-Tokens,
- vollständige Token-Hashes,
- Decklisten,
- `privateDeckSnapshots`,
- `cardInstances`,
- Hidden-Zone-Inhalte,
- konkrete verdeckte Kartentitel,
- vollständige `StoredMatch`-JSONs.

## Backup-Arten

### Manuelles Backup

V1.0.8 muss einen lokalen manuellen Backup-Pfad bieten. Zulässig sind:

- ein Script, z. B. `corepack pnpm storage:backup`,
- oder ein dokumentierter Node-Helfer unter `scripts/`,
- oder eine serverseitige lokale Admin-Funktion ohne öffentliche UI.

Der Final Review muss den tatsächlichen Befehl nennen.

### Automatisches Pre-Migration-Backup

Vor Legacy-Import und vor jeder Schema-Migration ist ein Backup Pflicht. Dieses Backup schützt den Ausgangsstand, bevor SQLite-Daten geschrieben oder verändert werden.

### Pre-Restore-Backup

Vor einem Restore muss der aktuelle Storage selbst gesichert oder in Quarantäne verschoben werden. Dadurch kann ein irrtümlicher Restore lokal rückgängig gemacht werden.

## Konsistenz

Ein SQLite-Backup muss konsistent sein. Zulässige Wege:

- SQLite-Backup-API oder äquivalenter konsistenter Dump,
- kontrolliertes Kopieren bei exklusivem Zugriff und sauber berücksichtigten WAL/SHM-Dateien,
- Restore nur bei gestopptem Server.

Die Umsetzung muss eine klare Entscheidung treffen. Für V1.0.8 ist ein lokaler Offline-Backup-/Restore-Drill ausreichend.

## Restore-Ablauf

Restore ist ein lokaler Admin-Ablauf.

Pflichtschritte:

1. Prüfen, dass der Server gestoppt ist oder exklusiver Storage-Zugriff garantiert ist.
2. Backup-Ordner und `manifest.json` finden.
3. Manifest parsen und `manifestVersion` prüfen.
4. Dateien und SHA-256-Prüfsummen prüfen.
5. SQLite-Integrität prüfen.
6. Schema-Version prüfen.
7. Aktuellen Storage sichern oder quarantänisieren.
8. Backup-Datei an den aktiven Storage-Pfad kopieren oder atomar ersetzen.
9. Serverstart führt normale Schema-Prüfung aus.

Restore aus unvollständigem, manipuliertem, beschädigtem oder zu neuem Backup wird abgelehnt.

## Recovery-Verhalten

| Fall | Verhalten |
| --- | --- |
| SQLite-Datei fehlt | Leeres Schema anlegen; optional Legacy-Import prüfen. |
| Runtime-Ordner fehlt | Ordner anlegen; leeres Schema anlegen. |
| SQLite-Datei beschädigt | Start abbrechen; lokale Restore-Hinweise ohne Inhaltsleak. |
| Schema-Version neuer als Code | Start abbrechen; Code/Storage-Version-Konflikt melden. |
| Schema-Version alt mit Migration | Pre-Migration-Backup erzeugen; Migration ausführen; starten. |
| Schema-Version alt ohne Migration | Start abbrechen; keine automatische Änderung. |
| Legacy-JSON ungültig | Import ablehnen; Quelle unverändert lassen; side-sichere Diagnose. |
| Backup unvollständig | Restore ablehnen. |
| Backup-Prüfsumme falsch | Restore ablehnen. |
| Write schlägt fehl | Operation gilt als fehlgeschlagen; kein Erfolgspayload an Client. |

## Session- und Token-Verhalten

- Persistiert werden nur Token-Hashes.
- Backups enthalten keine zusätzlichen Klartext-Tokens.
- Restore erzeugt keine neuen Klartext-Tokens.
- Browser können nur mit lokal vorhandenen gültigen Session-/Reconnect-Tokens wieder verbinden.
- Ein Restore darf keine fremde Seite anmelden und keine Token aus Health, Logs oder Manifest rekonstruierbar machen.
- Wenn ein Restore einen älteren Matchstand wiederherstellt, gelten die darin gespeicherten Hash- und Revoke-/UsedAt-Zustände. Das muss im Final Review als lokales Betriebsverhalten dokumentiert werden.

## Hidden-Info- und Diagnosegrenzen

Folgende Flächen müssen redaktionell geprüft werden:

- Serverstart-Fehler,
- HTTP-Fehler,
- WebSocket-Fehler,
- Health,
- Backup-Manifest,
- Restore-Diagnose,
- Migrationsbericht,
- Testartefakte,
- E2E-DOM/Storage/Payload-Scans.

Keine dieser Flächen darf verdeckte Kartendaten, `cardInstances`, private Payloads, private Decksnapshots, Decklisten oder Tokens zeigen.

## Lokaler Backup-/Restore-Drill

Der Implementation oder Final Review muss einen Drill dokumentieren:

1. Testmatch erstellen.
2. Backup erzeugen.
3. Matchzustand verändern.
4. Server stoppen oder exklusiven Zugriff herstellen.
5. Restore aus Backup durchführen.
6. Server starten.
7. Bekannten Matchstand prüfen.
8. Leak-Scan gegen Health, sichtbare Fehler und E2E-Flächen ausführen.

Der Drill muss nicht als öffentliche UI erscheinen.

## Grenzen

- Keine automatischen Cloud-Backups.
- Keine Verschlüsselungs-/Key-Management-Phase.
- Keine öffentliche Export-/Import-Funktion.
- Keine personenbezogenen Accounts.
- Keine Replay-Veröffentlichung.
- Keine Postgres- oder Multi-Node-Recovery.

Diese Punkte können später eigene Gates werden, sind aber nicht Teil von V1.0.8.
