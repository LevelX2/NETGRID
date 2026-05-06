# V1.0.8 Requirements - Storage/Backup-Härtung

Stand: 2026-05-06
Status: requirements_freeze

## Kurzfassung

V1.0.8 härtet die private lokale Match-Persistenz nach dem abgeschlossenen V1.0.7-Browser-Gate. SQLite wird als bevorzugter privater lokaler Storage-Pfad eingefroren. Der bestehende JSON-Dateispeicher bleibt nur Legacy-, Test- oder Migrationseingang.

Der Release erweitert keine Karten, keine Mechaniken, keine Accounts, keine öffentlichen Plattformfunktionen, keine Replay-/StateHash-/Randomness-Verträge und keine Engine-Regelautorität. Storage speichert und lädt ausschließlich den autoritativen Serverzustand hinter dem bestehenden `MultiplayerStorage`-Port.

## Ist-Basis

- `apps/server/src/multiplayer.ts` definiert `MultiplayerStorage` mit `load(matchId)`, `save(record)` und optional `list()`.
- `StoredMatch` enthält Matchdaten, Sessions, Token-Hashes, `GameState`, LifecycleResult, StartLobby, private Decksnapshots, EventLog, ActionReceipts, UndoSnapshots, StateSnapshots und PendingUndo.
- `apps/server/src/http-server.ts` erzeugt aktuell standardmäßig `JsonFileMatchStorage`.
- Der normale Legacy-Pfad ist `data/runtime/multiplayer/matches.json`.
- `scripts/run-e2e.mjs` isoliert V1.0.7-E2E aktuell über `NETRUNNER_MATCH_STORAGE_PATH` auf eine temporäre `matches.json`.
- Node 24 ist Projektziel; die lokale Umgebung stellt `node:sqlite` bereit. V1.0.8 bevorzugt deshalb `node:sqlite`, sofern die Umsetzung damit grün bleibt.

## Anforderungen

| ID | Priorität | Anforderung | Testspur |
| --- | --- | --- | --- |
| V108-MUST-001 | Must | SQLite ist der dokumentierte private lokale Standard-Storage für Multiplayer-Matches. | V108-T001, V108-T002 |
| V108-MUST-002 | Must | Der bestehende `MultiplayerStorage`-Port bleibt fachlich stabil: Service, Engine, WebSocket, REST und PlayerViews arbeiten weiterhin mit `StoredMatch`-Records. | V108-T003 |
| V108-MUST-003 | Must | Die Server-Storage-Konstruktion ist explizit konfigurierbar, mindestens über Storage-Art und Storage-Pfad. | V108-T004 |
| V108-MUST-004 | Must | Der Default-SQLite-Pfad ist `data/runtime/multiplayer/netrunner.sqlite`; Runtime-Daten bleiben nicht versioniert. | V108-T001, V108-T004 |
| V108-MUST-005 | Must | Der JSON-Pfad `data/runtime/multiplayer/matches.json` bleibt als kontrollierte Legacy-Importquelle erhalten und wird nicht still überschrieben. | V108-T005, V108-T006 |
| V108-MUST-006 | Must | Beim ersten SQLite-Start mit leerer Datenbank und vorhandener Legacy-Datei wird vor dem Import ein Backup der Legacy-Datei oder des gesamten Runtime-Quellstands erzeugt. | V108-T006, V108-T016 |
| V108-MUST-007 | Must | JSON-Legacy-Import validiert alle Records strukturell, bevor sie in SQLite übernommen werden. | V108-T007 |
| V108-MUST-008 | Must | Ein Import ist transaktional: ganz erfolgreich oder ohne teilweise SQLite-Übernahme. | V108-T008 |
| V108-MUST-009 | Must | SQLite enthält eine Schema-/Migration-Version, z. B. über `storage_meta` oder eine Migrationstabelle. | V108-T009 |
| V108-MUST-010 | Must | Fehlende SQLite-Datei und fehlender Runtime-Ordner führen zu kontrolliertem Anlegen von Ordner, Schema und leerem Storage. | V108-T010 |
| V108-MUST-011 | Must | Unbekannt neuere Schema-Versionen werden abgelehnt: Der Server startet nicht gegen Storage, der neuer ist als der Code. | V108-T011 |
| V108-MUST-012 | Must | Bekannte ältere Schema-Versionen werden nur über definierte Migrationen geöffnet; fehlt eine Migration, wird kontrolliert abgebrochen. | V108-T012 |
| V108-MUST-013 | Must | Beschädigte SQLite-Dateien, ungültige JSON-Legacy-Dateien und unvollständige Backups erzeugen side-sichere Fehler und keine Datenleaks. | V108-T013, V108-T026 |
| V108-MUST-014 | Must | `save(record)` ist für SQLite transaktional und persistiert vollständige `StoredMatch`-Roundtrips inklusive Sessions, Token-Hashes, Snapshots, Receipts, Lobby, Lifecycle und privaten Decksnapshots. | V108-T014, V108-T015 |
| V108-MUST-015 | Must | Persistenzfehler dürfen keinen erfolgreichen Spielzug, Lifecycle-Schritt, Lobby-Schritt oder KI-Schritt vortäuschen. | V108-T015 |
| V108-MUST-016 | Must | Es werden keine Klartext-Join-, Session- oder Reconnect-Tokens persistiert, exportiert, geloggt oder in Health-/Diagnoseflächen angezeigt. | V108-T017, V108-T026 |
| V108-MUST-017 | Must | Health-, Fehler-, Backup-Manifest-, Recovery- und Diagnoseausgaben enthalten keine verdeckten Kartentitel, `cardInstances`, privaten Decklisten, privaten Payloads oder Hidden-Zone-Inhalte. | V108-T018, V108-T026 |
| V108-MUST-018 | Must | Backup erzeugt ein lokal reproduzierbares, validierbares privates Runtime-Backup mit Manifest und Prüfsumme. | V108-T019 |
| V108-MUST-019 | Must | Restore validiert Manifest, Prüfsumme, SQLite-Integrität und Schema-Version, bevor aktueller Storage ersetzt wird. | V108-T020 |
| V108-MUST-020 | Must | Restore sichert oder quarantänisiert den aktuellen Storage vor dem Ersetzen. | V108-T021 |
| V108-MUST-021 | Must | Reconnect nach Serverneustart funktioniert mit gültigem lokalem Browser-Token weiterhin; Restore erzeugt nie neue Klartext-Tokens. | V108-T022 |
| V108-MUST-022 | Must | Terminale Zustände `cancelled`, `abandoned`, `forfeited` und `finished` bleiben nach Reload, Backup und Restore stabil. | V108-T023 |
| V108-MUST-023 | Must | V1.0.7-E2E-Runtime-Isolation wird auf SQLite übertragen oder kompatibel gehalten und schreibt nicht in die normale lokale Runtime-Datenbank. | V108-T024 |
| V108-MUST-024 | Must | V1.0.7-DOM-/Storage-/Payload-Leak-Scans bleiben grün und werden um Storage-/Recovery-nahe Leak-Muster ergänzt. | V108-T025, V108-T026 |
| V108-MUST-025 | Must | V1.0.8 führt keine neuen Karten, Mechaniken, Accounts, Postgres-Pfade, öffentlichen Lobbys, Matchmaking-, Ranking-, Turnier-, Replay- oder StateHash-Erweiterungen ein. | V108-T027 |
| V108-SHOULD-001 | Should | `JsonFileMatchStorage` bleibt für gezielte Legacy-/Fixture-Tests nutzbar, ist aber nicht mehr der Standardpfad. | V108-T028 |
| V108-SHOULD-002 | Should | Es gibt lokale Admin-Helfer oder Scripts für Backup, Restore, Legacy-Import und Storage-Inspection. | V108-T029 |
| V108-SHOULD-003 | Should | Backup-Dateien liegen unter `data/runtime/backups/` in zeitgestempelten Ordnern. | V108-T019 |
| V108-SHOULD-004 | Should | Health darf anonymisierte Storage-Statussignale anzeigen, z. B. Storage-Art, Schema-Version und Migrationsstatus, aber keine Match- oder Tokeninhalte. | V108-T018 |
| V108-SHOULD-005 | Should | Backup/Restore-Drill wird als lokaler Betriebsablauf im Implementation oder Final Review dokumentiert. | V108-T030 |
| V108-COULD-001 | Could | Backup-Rotation darf ergänzt werden, z. B. letzte N automatische Migrationsbackups behalten. | V108-T031 |

## Eingefrorene Konfigurationsentscheidung

Die Umsetzung soll folgende Konfigurationsform unterstützen:

| Variable | Bedeutung |
| --- | --- |
| `NETRUNNER_STORAGE_KIND` | `sqlite` als Standard, `json` nur Legacy/Test, `memory` nur Tests/gezielte Entwicklung. |
| `NETRUNNER_SQLITE_STORAGE_PATH` | SQLite-Datei; Default `data/runtime/multiplayer/netrunner.sqlite`. |
| `NETRUNNER_MATCH_STORAGE_PATH` | Legacy-Kompatibilität für JSON und bestehende E2E-Harnesses; nicht der neue Standard für SQLite. |
| `NETRUNNER_LEGACY_MATCH_STORAGE_PATH` | optionale explizite Legacy-Importquelle; Default `data/runtime/multiplayer/matches.json`. |
| `NETRUNNER_STORAGE_BACKUP_DIR` | Backup-Ziel; Default `data/runtime/backups/`. |

Wenn `NETRUNNER_STORAGE_KIND` fehlt, startet der Server mit SQLite. Für V1.0.8-E2E soll der Harness explizit `NETRUNNER_STORAGE_KIND=sqlite` und eine temporäre `NETRUNNER_SQLITE_STORAGE_PATH` setzen. Bestehende JSON-E2E-Isolation darf nur als Übergangs-/Fallbackpfad bleiben, nicht als dokumentierter Zielzustand.

## Nicht-Ziele

- keine Engine-Regeländerung,
- keine neuen Karten oder Mechaniken,
- keine neue KI-Entscheidungslogik,
- keine Accounts oder Benutzerprofile,
- kein Postgres,
- keine Cloud-, Public-, Matchmaking-, Ranking-, Turnier- oder Moderationsfunktionen,
- keine öffentlichen Backups oder öffentlichen Replays,
- keine Klartext-Tokens,
- keine verdeckten Kartendaten in Fehlern, Logs, Health, Backup-Manifesten oder Recovery-Diagnosen,
- keine Änderung an Replay, StateHash, RandomCounter oder RandomDrawRecords.

## Akzeptanz

V1.0.8 ist umsetzungsbereit, wenn diese Requirements, die SQLite-Spezifikation, die Backup/Recovery-Spezifikation, die Testmatrix und das Requirements Review konsistent sind.

V1.0.8 ist abgeschlossen, wenn:

- SQLite der private lokale Standard-Storage ist,
- Legacy-JSON kontrolliert, gesichert und validiert importiert werden kann,
- Backup und Restore lokal reproduzierbar und getestet sind,
- fehlende, beschädigte, alte und unbekannt neue Storage-Zustände kontrolliert behandelt werden,
- Token-, Hidden-Info-, Decklisten-, Health-, Log-, Backup-, Recovery- und E2E-Leak-Gates grün bleiben,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm e2e`, `corepack pnpm build` und `git diff --check` bestanden sind.
