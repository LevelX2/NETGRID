# NETGRID-Rechnerwechsel und lokale Nicht-Git-Daten

Stand: 2026-06-09

## Zweck

Dieses Runbook beschreibt den Transfer eines lokalen NETGRID-Entwicklungsstands auf einen anderen Rechner. GitHub bleibt die Quelle für versionierte Repository-Daten. Private, lokale und bewusst nicht versionierte Dateien werden separat in ein lokales Transferarchiv gepackt.

## Enthaltene lokale Daten

Das Export-Script `scripts/export-local-transfer.ps1` sammelt kuratiert:

- `AGENTS.local.md`, falls vorhanden.
- `.env` und `.env.*`, außer `.env.example`.
- ein validiertes SQLite-Storage-Backup über `corepack pnpm storage:backup`.
- persönliche bearbeitbare Decks aus `%APPDATA%\NetGrid\Decks` oder `NETGRID_DECK_LIBRARY_PATH`.
- `data/local/`.
- `data/local-assets/`.
- `docs/source/PrivateScans/`.

Nicht enthalten sind `node_modules/`, `.next/`, Build-Artefakte, Testreports, Logs, `data/runtime/logs/`, pnpm-Store und sonstige Caches.

## Export auf dem Quellrechner

Vorher sicherstellen, dass der versionierte Stand in Git sauber und nach GitHub gepusht ist:

```powershell
cd C:\Projekte\NETGRID
git status --short --branch
git push origin main
```

Dann das lokale Transferarchiv erzeugen:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-local-transfer.ps1
```

Das Script stoppt standardmäßig lokale NETGRID-Prozesse, erzeugt ein SQLite-Backup und schreibt das Archiv nach:

```text
data/runtime/transfer-packages/netgrid-local-transfer-YYYYMMDD-HHMMSS.zip
```

Dieses Archiv ist privat zu behandeln. Es kann Decks, private Scans, SQLite-Backups und lokale Secrets aus `.env` enthalten. Nicht nach GitHub hochladen.

## Import auf dem Zielrechner

Zuerst das Repository aus GitHub herstellen und Abhängigkeiten installieren:

```powershell
git clone https://github.com/LevelX2/NETGRID.git C:\Projekte\NETGRID
cd C:\Projekte\NETGRID
corepack enable
corepack pnpm install
```

Dann das Transferarchiv importieren:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-local-transfer.ps1 -ArchivePath "D:\Transfer\netgrid-local-transfer-YYYYMMDD-HHMMSS.zip"
```

Danach prüfen und starten:

```powershell
corepack pnpm storage:inspect
corepack pnpm typecheck
powershell -ExecutionPolicy Bypass -File .\scripts\start-netgrid.ps1
```

## Hinweise

- Die SQLite-Runtime ist nicht mergebar. Für einen Rechnerwechsel ist ein einmaliger Transfer sinnvoll; parallele Runtime-Fortschritte auf zwei Rechnern sollten nicht zusammengeführt werden.
- Persönliche bearbeitbare Decks liegen nicht in `data/decks/`, sondern in der lokalen Datei-Deckbibliothek. `data/decks/` enthält versionierte Demo-, Template- und Snapshot-Daten und kommt über Git.
- Match-Snapshots bereits gestarteter Matches liegen in SQLite und werden über `storage:backup` beziehungsweise `storage:restore` übertragen.
- Das Import-Script erstellt vor Überschreiben vorhandener Zielpfade ein lokales Sicherungsverzeichnis unter `data/runtime/transfer-restore-backups/`, sofern `-SkipExistingBackup` nicht gesetzt ist.
