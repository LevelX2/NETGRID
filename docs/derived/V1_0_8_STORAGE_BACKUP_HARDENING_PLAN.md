# V1.0.8 Storage/Backup-Härtung

Status: planning
Stand: 2026-05-06

## Ziel

V1.0.8 macht die private lokale Runtime-Persistenz robust genug, um Datenverlust, beschädigte Dateien, Serverneustarts und spätere Migrationen kontrolliert zu behandeln.

Der Release ist ein Betriebs- und Storage-Härtungsrelease. Er erweitert keine Karten, keine Regeln, keine UI-Spielbarkeit, keine offiziellen Assets und keine öffentlichen Plattformfunktionen. Die Rules Engine bleibt reine Regelautorität; Storage speichert und lädt nur den autoritativen Serverzustand.

## Produktentscheidung

SQLite ist der bevorzugte Zielpfad für V1.0.8.

Begründung:

- Der bisherige JSON-Dateispeicher ist für frühe lokale MVPs ausreichend, schreibt aber die gesamte Matchsammlung auf einmal und hat kein echtes Transaktions-, Migrations- oder Recovery-Modell.
- V1.0.7 hat den Browser-E2E-Gate stabilisiert; der nächste Qualitätsengpass ist nicht mehr Sichtprüfung, sondern verlässliche lokale Persistenz.
- SQLite passt zum privaten lokalen Produktmodus: eine Datei, transaktional, gut sicherbar, ohne Serverbetrieb oder Public-Scale-Annahmen.
- Postgres, Accounts und öffentliche Plattformpersistenz bleiben zu früh. SQLite ist der richtige Zwischenschritt vor V1.0.9 Private Internet Hardening.

V1.0.8 soll deshalb einen SQLite-Adapter als neuen primären privaten Storage-Pfad vorbereiten oder einführen. Der bestehende JSON-Adapter bleibt höchstens als Legacy-/Test-/Migrationseingang erhalten.

## Prüfbasis

Aktueller Stand vor V1.0.8:

- V1.0.7 Browser-E2E und Visual QA ist umgesetzt und lokal verifiziert.
- Der Server nutzt `MultiplayerStorage` mit `load(matchId)`, `save(record)` und optional `list()`.
- Produktiv wird aktuell `JsonFileMatchStorage` über `NETRUNNER_MATCH_STORAGE_PATH` erzeugt.
- Standardpfad ist derzeit `data/runtime/multiplayer/matches.json`.
- E2E nutzt bereits isolierte temporäre Runtime-Daten über `NETRUNNER_MATCH_STORAGE_PATH`.
- `StoredMatch` enthält Match-Metadaten, Sessions, Token-Hashes, GameState, LifecycleResult, StartLobby, private Decksnapshots, EventLog, ActionReceipts, UndoSnapshots, StateSnapshots und PendingUndo.
- Der Service besitzt bereits per-Match-Locks auf Anwendungsebene; Storage muss diese Annahme nicht ersetzen, darf sie aber nicht unterlaufen.

## Scope

### Must

- SQLite als bevorzugten privaten Storage-Pfad festlegen und dokumentieren.
- Einen migrationsfähigen Storage-Entwurf für `StoredMatch` und seine Bestandteile erstellen.
- Einen klaren Runtime-Pfad für SQLite definieren, z. B. `data/runtime/multiplayer/netrunner.sqlite`.
- JSON-Bestandsdaten aus `matches.json` vor einer Migration sichern, statt sie still zu überschreiben.
- `schemaVersion` oder äquivalente Migrationstabelle einführen.
- Serverstart-Verhalten für fehlenden, gültigen, alten, unbekannten und beschädigten Storage definieren.
- Backup- und Restore-Verhalten für private lokale Runtime-Daten spezifizieren.
- Tests für Persistenz über Serverneustart, Backup, Restore, Migration, beschädigte Daten und Token-/Hidden-Info-Redaktion planen.
- V1.0.7-E2E-Runtime-Isolation beibehalten und auf SQLite übertragen oder bewusst kompatibel halten.

### Should

- Storage-Konstruktion über explizite Konfiguration steuern, z. B. Storage-Art und Pfad statt nur impliziter JSON-Dateipfad.
- JSON-Adapter als Legacy-Migrationsquelle und für sehr einfache Tests nutzbar halten.
- SQLite-Writes in Transaktionen ausführen.
- Backup-Dateien mit Zeitstempel und kurzer Manifest-/Metadaten-Datei erzeugen.
- Restore nur aus validierten Backups zulassen.
- Einen kleinen Backup-/Restore-Drill als dokumentierten lokalen Ablauf erstellen.
- Fehlertexte side-sicher und nicht-technisch genug für die UI halten, aber Logs für lokale Diagnose brauchbar machen.

### Could

- Kleine CLI-/Script-Helfer für `backup`, `restore`, `inspect` und `migrate-json-to-sqlite`.
- Backup-Rotation, z. B. letzte N automatische Backups behalten.
- Health-Endpunkt um anonymisierte Storage-Statussignale erweitern.
- Ein lokaler Read-only-Diagnosebericht ohne Tokens, Decklisten und verdeckte Kartendaten.

### Non-Scope

- Keine Accounts.
- Keine Cloud-Decks.
- Kein öffentlicher Serverbetrieb.
- Kein Matchmaking, Ranking, Turnier- oder Lobby-Verzeichnis.
- Kein Postgres.
- Keine neuen Karten oder Mechaniken.
- Keine Änderung an Engine-Replay, StateHash oder Randomness.
- Keine Speicherung von Klartext-Tokens.
- Keine Anzeige verdeckter Kartendaten in Recovery-, Fehler- oder Diagnoseflächen.

## Zielarchitektur

V1.0.8 soll den bestehenden Storage-Port beibehalten und hinter ihm einen robusteren Adapter ergänzen:

```txt
MultiplayerService
  -> MultiplayerStorage
       -> InMemoryMatchStorage     (Tests)
       -> JsonFileMatchStorage     (Legacy / Migration / einfache lokale Fallbacks)
       -> SqliteMatchStorage       (neuer privater Standard)
```

Der Service soll weiterhin mit `StoredMatch` arbeiten. SQLite darf die Daten intern relational aufteilen, muss dem Service aber denselben fachlichen Record liefern. Dadurch bleiben Engine, AI, WebSocket, REST, PlayerViews, PublicEvents und Replay-Verträge unverändert.

## SQLite-Datenmodell

Die genaue Tabellenform wird im Requirements-/Spec-Schritt eingefroren. Der Plan bevorzugt eine hybride Struktur: fachlich wichtige Indexfelder relational, komplexe Engine-/Snapshot-Nutzdaten als validierte JSON-Spalten.

Mindesttabellen:

| Tabelle | Zweck |
| --- | --- |
| `storage_meta` | Schema-Version, Erstellzeit, letzte Migration, App-/Storage-Formatkennung. |
| `matches` | MatchRecord, Status, Mode, Version, Seed, Baseline, Settings, LifecycleResult, Zeitstempel. |
| `sessions` | SessionRecord mit Token-Hashes, Seite, Anzeigename, Connected-/LastSeen-Daten. |
| `tokens` | Join-/Session-/Reconnect-Token-Hashes mit Ablauf-, Revoke- und UsedAt-Daten. |
| `game_states` | aktueller GameState je Match als JSON plus StateVersion/StateHash. |
| `events` | EventRecord-Liste mit PublicPayload, StateVersionen, Hash und Hidden-Info-Markern. |
| `action_receipts` | Idempotency Receipts für Action-Pipeline. |
| `state_snapshots` | Undo-/Reconnect-relevante StateSnapshots. |
| `undo_snapshots` | UndoSnapshot-Metadaten. |
| `pending_undo` | aktueller PendingUndo je Match, falls vorhanden. |
| `private_deck_snapshots` | private matchgebundene Decksnapshots, serverseitig, nie in side-unsafe Payloads. |
| `start_lobbies` | StartLobby-Zustand inklusive Chatnachrichten als serverseitiger Match-Lifecycle-Zustand. |

Wichtige Regel: JSON-Spalten sind Persistenzformat, nicht neue Regelquelle. Kartentexte, Bilder oder importierte Katalogdaten dürfen dadurch nicht automatisch spielbar werden.

## Migration und Kompatibilität

V1.0.8 soll den Übergang von `matches.json` nach SQLite kontrolliert gestalten.

Empfohlene Reihenfolge:

1. Beim Serverstart Storage-Konfiguration auswerten.
2. Falls SQLite aktiv ist und noch keine Datenbank existiert: Schema anlegen.
3. Falls ein altes `matches.json` existiert und SQLite leer ist: JSON-Datei zuerst sichern, dann importieren.
4. Importierte Records validieren: MatchId, MatchStatus, MatchVersion, Sessions, Token-Hashes, EventLog, StateSnapshots und GameState müssen strukturell vorhanden sein.
5. Nach erfolgreichem Import eine Migrationsmarke schreiben.
6. Nach fehlgeschlagenem Import Originaldatei unverändert lassen und sicher abbrechen.

Unbekannte zukünftige Storage-Versionen müssen kontrolliert abgelehnt werden. Bekannte ältere Versionen dürfen nur über explizite Migrationen geöffnet werden.

## Backup

Backups sind private lokale Betriebsartefakte, keine öffentlichen Replays.

V1.0.8 soll mindestens einen manuellen Backup-Pfad definieren und idealerweise vor riskanten Migrationen automatisch ein Backup erzeugen.

Ein Backup muss enthalten:

- SQLite-Datei oder konsistenter SQLite-Dump.
- kleines Manifest mit Storage-Schema-Version, Erstellzeit, App-Version/Release, Hash/Prüfsumme und Quelle.
- keine zusätzlichen Klartext-Tokens.
- keine gesondert exportierten verdeckten Kartendaten in UI-lesbarer Form.

Empfohlener Pfad:

```txt
data/runtime/backups/
  netrunner-storage-YYYYMMDD-HHMMSS/
    netrunner.sqlite
    manifest.json
```

Automatische Backups vor Migrationen sollen bevorzugt werden. Periodische automatische Backups sind optional für V1.0.8 und können als späterer Betriebscomfort zurückgestellt werden.

## Restore

Restore ist ein lokaler Admin-/Betriebsablauf, kein normaler Spielzug und kein UI-Komfort für öffentliche Nutzer.

Mindestverhalten:

- Server muss vor Restore gestoppt sein oder der Restore-Befehl muss exklusiven Zugriff erzwingen.
- Backup-Manifest und Datenbankintegrität werden geprüft.
- Der aktuelle Storage wird vor Restore selbst gesichert oder in Quarantäne verschoben.
- Nach Restore startet der Server mit normaler Schema-Prüfung.
- Reconnect-/Session-Verhalten bleibt tokenbasiert. Ein Restore darf nicht plötzlich Klartext-Tokens erzeugen oder lokale Browser ohne gültiges `sessionStorage` still wieder einloggen.

## Fehler- und Recovery-Verhalten

V1.0.8 muss diese Fälle bewusst definieren:

| Fall | Erwartetes Verhalten |
| --- | --- |
| SQLite-Datei fehlt | Schema anlegen und leer starten. |
| Runtime-Ordner fehlt | Ordner anlegen und leer starten. |
| SQLite-Datei ist beschädigt | Start kontrolliert abbrechen oder letzten gültigen Restorepfad anbieten; keine verdeckten Daten in Fehlertexten. |
| Schema-Version ist unbekannt neuer | Start abbrechen mit klarer Meldung: Storage ist neuer als Code. |
| Schema-Version ist alt | definierte Migration ausführen oder abbrechen, wenn Migration fehlt. |
| JSON-Legacy-Datei ist ungültig | nicht importieren, Datei unverändert lassen, sichere Diagnose ausgeben. |
| Backup ist unvollständig | Restore ablehnen. |
| Write schlägt fehl | Action gilt nicht als erfolgreich persistiert; Service darf keinen side-sicheren Erfolg behaupten. |

## Betroffene Codebereiche

- `apps/server/src/multiplayer.ts`
  - `MultiplayerStorage` beibehalten oder minimal um Health-/Close-/Backup-nahe Fähigkeiten ergänzen.
  - `SqliteMatchStorage` ergänzen oder in eigene Datei auslagern.
  - `JsonFileMatchStorage` als Legacy-/Migrationseingang prüfen.
- `apps/server/src/http-server.ts`
  - Storage-Konstruktion von JSON-Pfad auf konfigurierbare Storage-Art umstellen.
  - Standardpfad für SQLite definieren.
- `apps/server/src/multiplayer.test.ts`
  - Persistenz-, Migration-, Backup-/Restore- und Token-Redaction-Tests ergänzen.
- `tests/e2e`
  - V1.0.7-Runtime-Isolation mit SQLite weiterführen.
- `scripts/`
  - optionale lokale Helper für Migration, Backup, Restore und Storage-Inspection.
- `docs/derived/`
  - Requirements, Storage-Spec, Backup-/Recovery-Spec, Testmatrix und Reviews.
- `docs/codex/CODEX_STATUS.md` und Wissensbasis
  - Phasenstand, Gate-Ergebnis und Betriebswissen aktualisieren.

## Teststrategie

### Unit-/Server-Tests

- Neuer SQLite-Storage startet leer, wenn keine Daten existieren.
- Match erstellen, laden, speichern, neu laden.
- Serverneustart-Simulation: gespeichertes Match bleibt mit MatchVersion, Sessions, Token-Hashes und GameState erhalten.
- ActionReceipt bleibt erhalten und doppelte IdempotencyKeys erzeugen keine zweite Transition.
- StateSnapshots und UndoSnapshots bleiben nach Reload nutzbar.
- Terminale Lifecycle-Zustände `cancelled`, `abandoned`, `forfeited`, `finished` bleiben nach Reload stabil.
- JSON-Legacy-Import importiert gültige Records und lässt Originaldaten gesichert.
- Ungültige JSON-Legacy-Datei wird nicht still importiert.
- Unbekannte Schema-Version wird abgelehnt.
- Migration erzeugt vor Änderungen ein Backup.
- Restore aus gültigem Backup stellt einen bekannten Matchstand wieder her.
- Restore aus kaputtem Backup wird abgelehnt.
- Persistierte Daten enthalten keine Klartext-Session-, Reconnect- oder Join-Tokens.

### E2E-/Regression

- `corepack pnpm e2e` läuft weiter mit isoliertem Storage.
- Human-vs-KI, Human-vs-Human, Lifecycle/Reconnect und Hidden-Info-Scans bleiben grün.
- Runtime-Isolation prüft nicht mehr nur `matches.json`, sondern die konfigurierte SQLite-Testdatenbank.
- Nach einem Serverneustart kann ein bestehendes Match gebootstrapped oder sicher terminal angezeigt werden.

### Betriebsprüfung

- Backup erzeugen.
- Testmatch verändern.
- Restore durchführen.
- Server starten.
- Bekannter Matchstand ist wieder erreichbar.
- Keine Tokens oder Hidden-Info-Daten erscheinen in sichtbaren Recovery-/Diagnoseflächen.

## Risiken

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| Migration beschädigt private lokale Matchdaten. | hoch | Vor jeder Migration automatisches Backup, Import validieren, Originaldatei unverändert lassen bis Erfolg. |
| SQLite-Adapter bildet `StoredMatch` unvollständig ab. | hoch | Roundtrip-Tests für vollständige StoredMatch-Struktur inklusive Snapshots, Receipts, Lobby, Lifecycle und Decksnapshots. |
| Storage-Fehler wird dem Client als Erfolg verkauft. | hoch | Persistenzfehler müssen Action-/Lifecycle-Erfolg verhindern und side-sichere Fehler liefern. |
| Token-Hashes oder private Decksnapshots werden über Diagnose sichtbar. | hoch | Redaction-Tests für Logs, Fehler, Health, DOM, Storage und E2E-Leak-Scans. |
| JSON- und SQLite-Pfade driften. | mittel | JSON als Legacy begrenzen; neue Tests primär gegen SQLite; InMemory für Unit-Fachtests behalten. |
| SQLite-Bibliothek/Node-API bindet das Projekt zu stark. | mittel | Requirements Review entscheidet konkrete technische API anhand Node-24-Kompatibilität; Adapterkapselung verhindert Streuung. |
| Backup/Restore wird zu groß für V1.0.8. | mittel | Mindestziel: manuell reproduzierbarer lokaler Backup-/Restore-Drill; Automatisierung kann schmal bleiben. |

## Dokumentationsbedarf

V1.0.8 sollte nach diesem Detailplan mit einem eigenen Requirements-Freeze weitergeführt werden:

- `docs/derived/V1_0_8_REQUIREMENTS.md`
- `docs/derived/STORAGE_SQLITE_1_0_8_SPEC.md`
- `docs/derived/BACKUP_RECOVERY_1_0_8_SPEC.md`
- `docs/derived/V1_0_8_TEST_MATRIX.md`
- `docs/derived/V1_0_8_REQUIREMENTS_REVIEW.md`
- nach Umsetzung: `docs/derived/V1_0_8_IMPLEMENTATION_REVIEW.md`
- nach Verifikation: `docs/derived/V1_0_8_FINAL_REVIEW.md`

## Akzeptanzkriterien

V1.0.8 ist geplant, wenn dieser Detailplan akzeptiert ist und der Requirements-Freeze die SQLite-, Migration-, Backup-/Restore- und Testentscheidungen ausführbar einfriert.

V1.0.8 ist done, wenn:

- SQLite der dokumentierte private Standard-Storage ist oder ein ausdrücklich akzeptierter technischer Blocker dokumentiert wurde,
- bestehende JSON-Runtime-Daten kontrolliert gesichert und migrierbar sind,
- Backup und Restore lokal reproduzierbar dokumentiert und getestet sind,
- beschädigte/fehlende/alte/neue Storage-Zustände kontrolliert behandelt werden,
- Token-, Hidden-Info-, Decklisten-, PublicEvent-, Reconnect- und Fehlerpayload-Verträge grün bleiben,
- V1.0.7-E2E weiter mit isoliertem Runtime-Storage läuft,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm e2e`, `corepack pnpm build` und `git diff --check` bestanden sind.
