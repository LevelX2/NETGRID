---
activityId: act-2026-07-26-sqlite-wal-busy-resilience
status: done
kind: fix
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-26
startedAt: 2026-07-27
completedAt: 2026-07-27
branch: codex/activities-worktree-20260727-001
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/server/src/storage-sqlite.ts
  - apps/server/src/storage-sqlite-locking.test.ts
checks:
  - corepack pnpm --filter @netgrid/server exec vitest run src/storage-sqlite-locking.test.ts
  - corepack pnpm --filter @netgrid/server typecheck
---

# Gemeinsamen SQLite-Zugriff mit WAL und kurzer Busy-Behandlung härten

## Ziel

Die lokale gemeinsame NETGRID-SQLite soll gegenüber kurzen, erwartbaren
Zugriffskollisionen robuster werden. Normale Leser sollen einen Match-Commit
nicht mehr unnötig blockieren; kurzzeitige Writer-Sperren sollen eine kleine
Chance zur Auflösung erhalten; eine danach verbleibende `SQLITE_BUSY`- oder
`SQLITE_LOCKED`-Situation soll kontrolliert auf den betroffenen Vorgang
begrenzt werden und nicht den Serverprozess beenden.

Das Paket ist eine pragmatische Version-0-Härtung. Es soll den beobachteten
Fehlermodus mit kleinem Implementierungs- und Testumfang schließen, nicht eine
vollständige Datenbank- oder Hochverfügbarkeitsarchitektur vorwegnehmen.

## Kontext und Quellen

Beobachteter lokaler Fehler am 26.07.2026:

- Während eines laufenden Spiels wurde die gemeinsame Datenbank
  `data/runtime/multiplayer/netgrid.sqlite` kurz durch einen separaten
  read-only Diagnoseclient gelesen.
- Die Match-Verbindung verwendete `journal_mode = DELETE` und effektiv
  `busy_timeout = 0`.
- Der Server traf beim `COMMIT` in
  `SqliteMatchStorage.transaction` auf `database is locked`; der Backend-
  Prozess endete und musste über `scripts/start-netgrid.ps1 -RestartServer`
  neu gestartet werden.
- `readOnly: true` verhinderte zwar Schreibzugriffe des Diagnoseclients, im
  Rollback-Journalmodus aber nicht die vorübergehende Commit-Blockade.

Aktueller technischer Stand:

- `apps/server/src/storage-sqlite.ts` setzt ausdrücklich
  `PRAGMA journal_mode = DELETE` und verwendet synchrone
  `BEGIN IMMEDIATE`-/`COMMIT`-Transaktionen.
- Match-Storage, Account-Sessions, Deck-Storage und Account-Statistik öffnen
  standardmäßig getrennte Verbindungen auf dieselbe SQLite-Datei.
- Nur `apps/server/src/account-decks.ts` setzt derzeit
  `PRAGMA busy_timeout = 5000`; Match-, Session- und Statistikverbindung sind
  davon nicht einheitlich erfasst.
- Mehrere Matches derselben Serverinstanz schreiben über dieselbe synchrone
  Match-Storage-Verbindung und werden dort bereits seriell abgearbeitet.
  Das relevante zusätzliche Kollisionsrisiko entsteht durch die weiteren
  Verbindungen, Wartungs-/Diagnosezugriffe oder eine versehentliche zweite
  Instanz auf derselben Datei.
- Backups werden in `apps/server/src/storage-sqlite.ts` über `VACUUM INTO`
  erzeugt. Das ist bei der WAL-Umstellung kurz mitzudenken, aber in diesem
  Paket nicht zu einem allgemeinen Backup-Redesign auszubauen.

## Scope

1. Die gemeinsame NETGRID-Datenbank beim regulären Öffnen auf
   `PRAGMA journal_mode = WAL` konfigurieren.
   - Die Konfiguration muss für den realen gemeinsamen Datenbankpfad gelten.
   - Wiederholtes Öffnen darf den Modus nicht zurück auf `DELETE` setzen.
   - Es ist zulässig, dass SQLite die üblichen technischen Begleitdateien
     `-wal` und `-shm` verwaltet; es wird keine separate Datenbankkopie
     erzeugt.
2. Einen kurzen, zentral benannten `busy_timeout` konsistent auf jede
   produktive Verbindung zur gemeinsamen Datei anwenden:
   - `SqliteMatchStorage`;
   - `SqliteAccountStorage`;
   - `SqliteAccountDeckStorage`;
   - `SqliteAccountStatisticsStorage`.
3. Den bisherigen einzelnen 5000-ms-Sonderwert des Deck-Storages durch den
   gemeinsamen kurzen Wert ersetzen.
4. Den Wert klein halten, damit `DatabaseSync` im Konfliktfall nicht den
   gesamten Node-Event-Loop über mehrere Sekunden einfriert. Als
   Implementierungsdefault sind ungefähr 500 bis 1000 ms vorgesehen; eine
   geringfügig andere kurze Wahl ist mit einem Satz in der Ergebnisnotiz zu
   begründen.
5. Verbleibende `SQLITE_BUSY`-/`SQLITE_LOCKED`-Fehler an den produktiven
   Transaktionsgrenzen kontrolliert behandeln:
   - eine noch aktive Transaktion sicher zurückrollen, soweit SQLite dies
     zulässt;
   - den Fehler in einen typisierten, als vorübergehend erkennbaren
     Storage-/Serverfehler übersetzen;
   - nur den betroffenen Request fehlschlagen lassen;
   - den Serverprozess und andere Matches weiterlaufen lassen;
   - keine vollständige Transaktion blind wiederholen, wenn deren
     Idempotenz nicht bereits durch den bestehenden Vertrag bewiesen ist.
6. Bestehende Idempotency-, StateVersion- und atomare Schreibverträge
   erhalten. Ein abgelehnter oder zurückgerollter Vorgang darf keine
   Teilzeilen, vorgezogenen Receipts oder nur teilweise gespeicherten
   Matchzustände hinterlassen.
7. Einen kleinen, isolierten Grobtest mit temporärer SQLite-Datei ergänzen:
   - produktive Verbindung verwendet WAL und den gemeinsamen kurzen Timeout;
   - ein separater kurz gehaltener Zugriff führt nicht zum Prozessabbruch;
   - eine absichtlich über den Timeout hinaus gehaltene Sperre ergibt den
     typisierten vorübergehenden Fehler;
   - nach Freigabe der Sperre kann dieselbe Storage-Instanz wieder erfolgreich
     speichern.

## Nicht im Scope

- Keine Umstellung von `DatabaseSync` auf einen asynchronen Datenbanktreiber.
- Kein Connection Pool, kein Queue-System und keine verteilte
  Datenbankarchitektur.
- Keine automatische Datenbankduplikation und keine Snapshot-Erzeugung für
  normale Zugriffe.
- Kein Schema- oder Inhaltsmigrationsprojekt. Die WAL-Aktivierung ist eine
  SQLite-Betriebskonfiguration.
- Keine umfangreiche Backup-/Restore-Neuentwicklung. Nur sicherstellen, dass
  der bestehende `VACUUM INTO`-Pfad durch die Änderung nicht offensichtlich
  unbrauchbar wird.
- Keine Last-, Stress-, Soak- oder Performance-Testkampagne.
- Keine 100-Match-, Selbstspiel- oder Parallelspielserie.
- Keine vollständige Server-, Multiplayer- oder Repository-Testsuite allein
  für dieses Paket.
- Kein Testplan, Testprotokoll oder eigenes Review-Dokument.
- Keine Wiederholungslogik mit exponentiellem Backoff und keine pauschalen
  Mehrfach-Retries.
- Keine Garantie für Netzwerkdateisysteme, mehrere unabhängige produktive
  Serverprozesse oder Hochverfügbarkeit. Die verbindliche lokale
  Version-0-Umgebung bleibt der Zielbetrieb.
- Keine Abschwächung der vorläufigen Warnung vor direkten Zugriffen auf eine
  laufend beschriebene SQLite. Ob diese Warnung nach praktischer Bewährung
  gelockert wird, ist eine spätere kleine Entscheidung.

## Akzeptanzkriterien

- [x] Die reguläre gemeinsame SQLite meldet nach Initialisierung
      `journal_mode = wal`; kein produktiver Storage setzt sie anschließend
      zurück auf `delete`.
- [x] Alle vier produktiven Verbindungen verwenden denselben zentral
      benannten kurzen `busy_timeout`.
- [x] Der bisherige isolierte 5000-ms-Wert in `account-decks.ts` ist
      entfernt.
- [x] Eine normale kurze Leser-/Writer-Überlappung führt im isolierten
      Grobtest weder zu `database is locked` am Match-Commit noch zum
      Prozessabbruch.
- [x] Eine länger gehaltene Sperre endet nach dem kurzen Timeout als
      typisierter vorübergehender Fehler des betroffenen Vorgangs; der
      Storage bleibt anschließend benutzbar.
- [x] Ein fehlgeschlagener Vorgang hinterlässt keine im Grobtest erkennbare
      Teilpersistenz.
- [x] Der bestehende Backup-Pfad über `VACUUM INTO` kann mit einer im WAL-
      Modus geöffneten temporären Datenbank weiterhin einmal erfolgreich
      ausgeführt und gelesen werden. Dafür genügt eine kleine Assertion im
      selben fokussierten Test; kein separater Backup-Testkatalog.
- [x] Der fokussierte Locking-Test und der Server-Typecheck sind grün.
- [x] Es werden keine darüber hinausgehenden breiten Testläufe verlangt,
      sofern der kleine Grobtest keinen konkreten weiteren Defekt aufdeckt.

## Umsetzungshinweise

- Den gemeinsamen Timeout als kleine Storage-Konstante oder schmale
  Initialisierungsfunktion führen, damit die vier Verbindungen nicht erneut
  auseinanderlaufen.
- `busy_timeout` ist verbindungsbezogen und muss deshalb auf jeder
  `DatabaseSync`-Instanz gesetzt werden. `journal_mode = WAL` ist
  datenbankbezogen und persistent, soll aber beim regulären Storage-Start
  überprüfbar gesetzt werden.
- Wegen des synchronen Treibers keinen großzügigen Timeout wählen. Das Ziel
  ist, sehr kurze Sperren abzufangen, nicht den Event-Loop lange warten zu
  lassen.
- SQLite-Fehler nicht allein über den deutschen Meldungstext erkennen.
  Soweit `node:sqlite` einen stabilen Fehlercode liefert, diesen verwenden;
  eine eng begrenzte kompatible Erkennung für `SQLITE_BUSY` und
  `SQLITE_LOCKED` darf gekapselt ergänzt werden.
- Beim `COMMIT` nicht automatisch den gesamten Work-Callback erneut
  ausführen. Eine kontrollierte Rückgabe ist einer potenziell doppelten
  Persistenz vorzuziehen.
- Den Grobtest ausschließlich auf einer temporären Testdatenbank ausführen.
  Weder laufenden Server noch
  `data/runtime/multiplayer/netgrid.sqlite` dafür öffnen, stoppen oder
  kopieren.
- Wenn der Grobtest einen konkreten zusätzlichen Fehler zeigt, diesen
  möglichst im kleinen Paket beheben. Nur bei einem eigenständigen größeren
  Problem eine präzise Folge-Activity anlegen; nicht vorsorglich den Scope
  erweitern.

## Ergebnisnotiz

- Der gemeinsame Wert `SQLITE_BUSY_TIMEOUT_MS = 750` ms liegt bewusst im
  vorgesehenen kurzen Bereich: Er fängt kurze Kollisionen ab, ohne den
  synchronen Node-Event-Loop für mehrere Sekunden zu blockieren.
- `SqliteMatchStorage` setzt beim regulären Öffnen WAL; die drei weiteren
  produktiven Verbindungen übernehmen denselben verbindungsbezogenen Timeout,
  ohne den Journalmodus zurückzusetzen.
- Produktive Transaktionen rollen nach einem Fehler kontrolliert zurück und
  übersetzen `SQLITE_BUSY`/`SQLITE_LOCKED` (einschließlich der begrenzten
  node:sqlite-Kompatibilitätsmeldung) in den typisierten, temporären Fehler
  `storage_temporarily_unavailable`. HTTP-Anfragen erhalten dafür 503; es gibt
  keinen automatischen Transaktions-Retry.
- Der isolierte Test prüft WAL und alle vier Timeouts, eine Leser-/Writer-
  Überlappung, den langen Writer-Lock ohne Teilpersistenz und die anschließende
  Wiederverwendbarkeit derselben Storage-Instanz. Der bestehende `VACUUM INTO`-
  Backup wird dabei ebenfalls geöffnet und per `integrity_check` bestätigt.
- Erfolgreiche Checks am 27.07.2026:
  `corepack pnpm --filter @netgrid/server exec vitest run src/storage-sqlite-locking.test.ts`
  (1 Test) und `corepack pnpm --filter @netgrid/server typecheck`.
