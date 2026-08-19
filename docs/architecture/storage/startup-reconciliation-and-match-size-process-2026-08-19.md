# STARTUP STORAGE OPTIMIZATION – Prozess

Status: in Arbeit  
Datum: 2026-08-19  
Worktree: `C:\Projekte\NETGRID_STARTUP_STORAGE_OPTIMIZATION`  
Branch: `codex/startup-storage-optimization`

## Quelle und Zielprüfung

Quelle ist der freigegebene Umsetzungsauftrag „STARTUP STORAGE OPTIMIZATION“ vom 2026-08-19. Der Auftrag ist ausreichend präzise: Endzustand, Paketfolge, Sicherheitsgrenzen, Testpflichten und lokale Integrationsregeln sind bestimmt.

Gesamtziel: Der normale Serverstart ermittelt nur minimal-projizierte Reconciliation-Kandidaten und hydratisiert keine historischen Match-Payloads. Die Maintenance-Größe eines Matches wird als eine SQL-berechnete, ungefähre Gesamtnutzlast einschließlich KI-Daten verwendet.

## Ausgangszustand

- `http-server.ts` wartet vor `server.listen` auf `reconcilePersistedMatches`.
- `MultiplayerService.reconcilePersistedMatches` basiert auf `storage.list()` und kann damit historische Matchdaten vollständig hydratisieren.
- `SQLiteStorage.list()` führt die JSON-Hydration über `recordFromJson()` aus, einschließlich Events, Engine-Events, Snapshots und KI-Traces.
- Die Maintenance-Ansicht kennt bereits `approximateTotalBytes`, muss aber auf sämtliche persistierten, matchbezogenen Payload-Gruppen abgeglichen werden.

## Invarianten und Nicht-Ziele

- Die Rules Engine bleibt einzige Regelautorität; diese Arbeit verändert keine Spielregeln.
- Maintenance-Daten bleiben authentisiert und side-sicher; APIs liefern ausschließlich Größenkennzahlen, keine Payload-Inhalte.
- Kein Launcher-Timeout und kein stiller Vollscan- oder Hintergrund-Fallback sind zulässig.
- Keine Datenmigration oder Rückwärtskompatibilität ist Teil des Version-0-Scopes.

## Paketfolge

### START01 – Datenminimaler Serverstart

Ziel: Kandidaten per gezielter Storage-Abfrage mit minimalen Feldern bestimmen; einzelne Kandidaten nur bei Reparatur gezielt laden. Der HTTP-Start verwendet weder `storage.list()` noch vollständige Hydration.

Akzeptanz: Vollständig verbuchte Terminal-Matches liefern keine Kandidaten; fehlende Account-Ergebnisse werden repariert; große Trace-/Snapshot-Payloads werden dabei nicht gelesen; Diagnose meldet Dauer, Kandidaten und Reparaturen; relevante SQL-Indizes sind mit `EXPLAIN QUERY PLAN` geprüft.

Checks: gezielte Storage-/Account-Statistics-/HTTP-Tests, große synthetische Payload-Regression, Server-Typecheck, isolierter Start mit freien Ports und eigener SQLite-Datei sowie dokumentierte lokale Messung.

Commit: `perf(server): make startup reconciliation data-minimal`

### START02 – Vollständige Matchgröße inklusive KI-Daten

Ziel: `approximateTotalBytes` ist die SQL-berechnete Summe aller definierten, matchbezogenen Payload-Gruppen einschließlich KI-Decision-Traces und Engine-Events. Liste, Detail, Filter, größte Matches und Cleanup verwenden denselben Wert.

Akzeptanz: KI- und Engine-Daten sind nachweislich enthalten; Matches ohne KI-Daten bleiben korrekt; Berechnung parst keine JSON-Payload in JavaScript; die UI behält eine Spalte „Größe“ und kann KI als Detailbestandteil ausweisen.

Checks: bekannte Bytegrößen, große KI-Traces, keine KI-Daten, Filter/Cleanup, HTTP-Vertrag, fokussierter Web-Test sowie Server-/Web-Typecheck.

Commit: `fix(maintenance): include AI data in match storage totals`

## Verifikations- und Integrationsregeln

Genau ein Paket ist aktiv. Vor jedem Paketcommit laufen die jeweiligen fokussierten Checks und `git diff --check`; nur paketzugehörige Änderungen werden committed. Reale Starttests verwenden freie, nicht die Ports 3100/8787, und explizit isolierte SQLite-Dateien. Nach START02 wird aktuelles `main` defensiv integriert, auf `main` lokal gemergt und geprüft. Danach werden Worktree und Branch erst nach doppelter Entfernungskontrolle gelöscht.

## Messungen, Entscheidungen und Abschluss

Wird während der Umsetzung fortgeschrieben: SQL-Abfragen/Indizes, Vorher-/Nachher-Startmessungen, Formel für `approximateTotalBytes`, Testresultate, Commit-IDs, Main-Integrationsstand und Cleanup-Nachweis.
