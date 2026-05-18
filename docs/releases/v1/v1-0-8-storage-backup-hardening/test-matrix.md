# V1.0.8 Test Matrix - Storage/Backup-Härtung

Stand: 2026-05-06
Status: Requirements-Freeze-Testmatrix

## Coverage

| Test-ID | Bereich | Requirement-IDs | Erwartung |
| --- | --- | --- | --- |
| V108-T001 | SQLite Default | V108-MUST-001, V108-MUST-004 | Ohne explizite Storage-Art nutzt der Server SQLite am dokumentierten Runtime-Pfad. |
| V108-T002 | SQLite Adapter Discovery | V108-MUST-001 | `SqliteMatchStorage` oder äquivalenter Adapter existiert und ist der private Standardpfad. |
| V108-T003 | Storage-Port | V108-MUST-002 | `MultiplayerService` bleibt gegen `MultiplayerStorage` testbar; Engine, REST und WebSocket kennen keine SQL-Details. |
| V108-T004 | Konfiguration | V108-MUST-003, V108-MUST-004 | Storage-Art und Pfad sind explizit steuerbar; E2E kann temporäre SQLite-Datei wählen. |
| V108-T005 | Legacy-Erhalt | V108-MUST-005 | Vorhandene `matches.json` wird nicht gelöscht oder überschrieben. |
| V108-T006 | Pre-Import-Backup | V108-MUST-006 | Legacy-Import erzeugt vor Änderungen ein Backup mit Manifest. |
| V108-T007 | Legacy-Validierung | V108-MUST-007 | Gültige JSON-Records werden importiert; ungültige Records werden abgelehnt. |
| V108-T008 | Import-Transaktion | V108-MUST-008 | Teilfehler führen zu keiner teilweisen SQLite-Übernahme. |
| V108-T009 | Schema-Version | V108-MUST-009 | Schema-Version ist in SQLite gespeichert und wird beim Start geprüft. |
| V108-T010 | Fehlende Datei/Ordner | V108-MUST-010 | Fehlender Runtime-Ordner und fehlende SQLite-Datei werden kontrolliert angelegt. |
| V108-T011 | Neueres Schema | V108-MUST-011 | Unbekannt neuere Schema-Version blockiert Start mit side-sicherem Fehler. |
| V108-T012 | Altes Schema | V108-MUST-012 | Bekannte Migration läuft mit Backup; alte Version ohne Migration blockiert Start. |
| V108-T013 | Corruption/Invalid Input | V108-MUST-013 | Beschädigte DB, ungültiges JSON und kaputtes Backup werden abgelehnt ohne Inhaltsleak. |
| V108-T014 | StoredMatch Roundtrip | V108-MUST-014 | Ein vollständiger Matchstand roundtript inklusive Sessions, Token-Hashes, GameState, Events, Receipts, Snapshots, Lobby, Lifecycle und privaten Decksnapshots. |
| V108-T015 | Persistenzfehler | V108-MUST-014, V108-MUST-015 | Simulierter `save`-Fehler verhindert Erfolg für Action/Lobby/Lifecycle/KI-Schritt. |
| V108-T016 | Migration Backup | V108-MUST-006 | Schema- oder Legacy-Migration erzeugt Backup vor dem ersten riskanten Schreibschritt. |
| V108-T017 | Token-Redaktion | V108-MUST-016 | Persistenz, Backup, Manifest, Logs und Fehler enthalten keine Klartext-Tokens. |
| V108-T018 | Health/Diagnosis Redaction | V108-MUST-017, V108-SHOULD-004 | Health und Diagnose zeigen nur abstrakte Storage-Signale, keine Matchinhalte. |
| V108-T019 | Backup Erzeugung | V108-MUST-018, V108-SHOULD-003 | Backup enthält SQLite-Datei oder konsistenten Dump plus Manifest und Prüfsummen. |
| V108-T020 | Restore Validierung | V108-MUST-019 | Restore prüft Manifest, Prüfsumme, Integrität und Schema. |
| V108-T021 | Pre-Restore-Sicherung | V108-MUST-020 | Aktueller Storage wird vor Restore gesichert oder quarantänisiert. |
| V108-T022 | Reconnect nach Restart/Restore | V108-MUST-021 | Gültige lokale Reconnect-Daten funktionieren nach Serverneustart; Restore erzeugt keine Klartext-Tokens. |
| V108-T023 | Terminale Zustände | V108-MUST-022 | `cancelled`, `abandoned`, `forfeited`, `finished` bleiben nach Reload/Backup/Restore stabil. |
| V108-T024 | E2E Runtime-Isolation | V108-MUST-023 | `corepack pnpm e2e` nutzt temporäre SQLite-Datei und nicht normale Runtime-Pfade. |
| V108-T025 | V1.0.7 Regression | V108-MUST-024 | Bestehende Human-vs-KI-, Human-vs-Human-, Lifecycle-, Viewport- und Hidden-Info-E2E-Flows bleiben grün. |
| V108-T026 | Storage Leak Scan | V108-MUST-013, V108-MUST-016, V108-MUST-017, V108-MUST-024 | DOM, LocalStorage, WebSocket-Payloads, Health, Backup-Manifest und Recovery-Diagnosen enthalten keine Tokens, Decklisten, `cardInstances`, private Payloads oder verdeckte Kartentitel. |
| V108-T027 | Scope Regression | V108-MUST-025 | Keine neuen Karten, Mechaniken, Accounts, Postgres-, Public-, Replay- oder StateHash-Pfade entstehen. |
| V108-T028 | JSON Legacy Tests | V108-SHOULD-001 | JSON-Storage bleibt für gezielte Legacy-/Fixture-Tests verwendbar, ist aber nicht Standard. |
| V108-T029 | Admin Helper | V108-SHOULD-002 | Backup/Restore/Import/Inspect-Helfer oder äquivalente lokale Befehle sind dokumentiert. |
| V108-T030 | Backup-/Restore-Drill | V108-SHOULD-005 | Final Review dokumentiert einen durchgeführten lokalen Drill mit Ergebnis. |
| V108-T031 | Backup-Rotation | V108-COULD-001 | Falls Rotation implementiert wird, bleiben neueste Backups erhalten und Löschung betrifft nur Backup-Ordner. |

## Pflicht-Unit-/Server-Tests

- SQLite startet leer, wenn keine Daten existieren.
- Match erstellen, laden, speichern und mit neuem Storage-Adapter erneut laden.
- Serverneustart-Simulation: MatchVersion, Sessions, Token-Hashes, GameState und EventLog bleiben erhalten.
- ActionReceipt-Idempotency bleibt nach Reload erhalten.
- StateSnapshots und UndoSnapshots bleiben nach Reload nutzbar.
- StartLobby und PendingUndo roundtrippen.
- Private Decksnapshots bleiben serverseitig vorhanden und nicht in Side-Payloads sichtbar.
- Lifecycle-Zustände bleiben terminal.
- JSON-Legacy-Import gültiger Records.
- Ungültiger Legacy-Import ohne Teilübernahme.
- unbekannt neue Schema-Version.
- beschädigte SQLite-Datei oder Integritätsfehler.
- Backup erzeugen und prüfen.
- Restore aus gültigem Backup.
- Restore aus kaputtem Backup ablehnen.
- Token-/Hidden-Info-Redaction.

## Pflicht-E2E-/Regression-Checks

- `corepack pnpm e2e` läuft mit SQLite-Testdatenbank.
- Human-vs-KI Desktop.
- Human-vs-Human mit zwei Browser-Kontexten.
- Lifecycle/Reconnect.
- Tablet- und schmaler Viewport.
- Hidden-Info-Installation ohne Runner-Leak.
- Runtime-Isolation gegen `data/runtime/multiplayer/netgrid.sqlite` und `data/runtime/multiplayer/matches.json`.

## Pflicht-Projektchecks für Umsetzung

- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm e2e`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`

## Manuelle Ergänzung

Falls ein Restore-Drill nicht vollständig automatisierbar ist, ist ein dokumentierter manueller Drill zulässig. Er blockiert den Final Review nur dann nicht, wenn:

- die Backup- und Restore-Kernlogik automatisiert getestet ist,
- der manuelle Drill mit konkretem Datum, Befehl, Quelle, Ziel und Ergebnis dokumentiert ist,
- alle Redaction-Checks grün bleiben.

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/releases/v1/v1-0-8-storage-backup-hardening/requirements.md` haben mindestens eine Testspur in dieser Matrix.
