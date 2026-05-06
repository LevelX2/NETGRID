# V1.0.8 Final Review - Storage/Backup-Härtung

Stand: 2026-05-06
Status: done

## Gate-Ergebnis

V1.0.8 Storage/Backup-Härtung ist umgesetzt und lokal verifiziert.

`V1_0_8_implemented: true`

`V1_0_8_verified: true`

`V1_0_8_done: true`

## Umgesetzter Scope

- SQLite ist der private lokale Standard-Storage für Multiplayer-Matches.
- `MultiplayerStorage` bleibt fachlich stabil; Service und Transport kennen keine SQL-Details.
- JSON bleibt als Legacy-/Test-/Migrationseingang über `NETRUNNER_STORAGE_KIND=json` verfügbar.
- Legacy-Import aus `data/runtime/multiplayer/matches.json` ist validiert, transaktional, normalisiert ältere Records ohne `match.mode` eng und erzeugt vorher ein Backup.
- `storage_meta` enthält Schema-Version, Storage-Format und Migrations-/Import-Marken.
- Backup/Restore erzeugt Manifest, SHA-256-Prüfsummen, Integritätsprüfung und Pre-Restore-Backup.
- Health, Backup-Manifest, E2E-Ausgabe und Recovery-Diagnosen bleiben token- und hidden-info-redaktioniert.
- V1.0.7-E2E-Isolation nutzt jetzt temporäre SQLite-Datenbanken.

## Backup-/Restore-Drill

Der lokale Drill wurde automatisiert im Server-Test abgedeckt:

1. Testmatch in temporärer SQLite-Datenbank erstellen.
2. Manuelles Backup erzeugen.
3. weiteren Matchstand schreiben.
4. Storage schließen.
5. Restore aus Backup ausführen.
6. Pre-Restore-Backup prüfen.
7. SQLite neu öffnen und bekannten Matchstand prüfen.
8. Manifest auf Token-, Decklisten- und Hidden-Info-Leaks prüfen.

Der lokale Admin-Pfad ist:

```txt
corepack pnpm storage:backup
corepack pnpm storage:restore -- <backupDir>
corepack pnpm storage:inspect
corepack pnpm storage:import-legacy
```

## Checks

- `corepack pnpm --filter @netrunner/server test`: pass, 42 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 13 Tests.
- `corepack pnpm e2e`: pass, 7/7 Playwright-Tests mit temporärer SQLite-Datenbank.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 191 Workspace-Tests plus 41 Root-Spec-Tests.
- `corepack pnpm build`: pass; bekannte Turbopack-NFT-Warnung bleibt eine Warnung ohne Build-Fehler.
- `git diff --check`: pass; nur CRLF-Hinweis für `scripts/run-e2e.mjs`.

Zusätzlich wurde die vorhandene lokale Legacy-Datei `data/runtime/multiplayer/matches.json` in eine temporäre SQLite-Datenbank importiert: pass, 46 Matches.

Ein Zwischenlauf von `corepack pnpm e2e` zeigte einen Timing-Flake im Lifecycle/Reconnect-Test: Der Test lud nach Klick auf `Wieder verbinden` neu, bevor die neue Session sicher persistiert war. Der Harness wartet jetzt auf `Wiederverbindung abgeschlossen.` vor Reload; der anschließende vollständige E2E-Lauf bestand.

## Redaction-Befund

Kein Klartext-Token-, TokenHash-, Decklisten-, `privateDeckSnapshots`-, `cardInstances`-, `privatePayload`- oder Hidden-Info-Leak wurde in den geprüften Health-, Manifest-, DOM-, LocalStorage-, WebSocket- und E2E-Log-Flächen festgestellt.

## Scope-Abgleich

V1.0.8 hat keine neuen Karten, Mechaniken, Accounts, Postgres-Pfade, öffentlichen Lobbys, Matchmaking-, Ranking-, Turnier-, Replay-, Randomness-, StateHash- oder Engine-Autoritätsänderungen eingeführt.

## Bekannte Grenzen

- Restore bleibt ein lokaler Offline-/Admin-Ablauf; keine öffentliche UI und kein Cloud-/Key-Management.
- SQLite speichert autoritative private Serverdaten, einschließlich Token-Hashes und private Decksnapshots; Diagnose- und Manifestflächen redaktionieren diese Inhalte.
- Die bekannte Turbopack-NFT-Warnung im Web-Build bleibt unverändert.
