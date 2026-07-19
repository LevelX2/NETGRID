# SQLite-Matchstorage-Optimierung – Paketprozess

Stand: 2026-07-19  
Status: abgeschlossen und auf lokalem `main` verifiziert
Arbeitsbranch: `codex/sqlite-matchstorage-optimization`  
Worktree: `C:\Projekte\NETGRID_SQLITE_MATCHSTORAGE_OPTIMIZATION`

## Quelle und Zielprüfung

Ausgangspunkt ist die erneute Architektur- und Laufzeitprüfung der lokalen
SQLite-Matchpersistenz. Die Vorgabe ist für automatische Abarbeitung präzise:
Speicherplatz und Schreib-/Leseaufwand sollen sinken, ohne Engine-, Replay-,
StateHash-, Undo-, Hidden-Info-, Account- oder Backup-Verträge abzuschwächen.

Read-only gemessene Ausgangslage der aktiven lokalen Datenbank:

- 26 Matches in einer 1.095.098.368 Byte großen Datei;
- 574.824.448 Byte beziehungsweise 52,5 Prozent freie SQLite-Seiten;
- 246.685.068 Byte State-Snapshot-Payload;
- 127.828.393 Byte KI-Trace-Payload;
- 121.317.208 Byte Public-Event-Payload, davon ungefähr 118 MB erneut
  abgelegter `aiDecisionDebug`;
- 4.872.572.928 Byte vorhandene lokale SQLite-Backups.

## Gesamtziel

NETGRID besitzt nach Abschluss einen messbar schlankeren und inkrementellen
SQLite-Persistenzpfad: wachsende Matchtabellen werden nicht bei jeder Aktion
vollständig neu geschrieben, ausführlicher KI-Debug besitzt genau einen
kanonischen dauerhaften Speicherort, Backups sind konsistent und kompakt,
freigegebener Datenbankplatz kann unabhängig von Matchlöschung kontrolliert
zurückgewonnen werden, und das Account-Ledger nutzt seine SQLite-Indizes auch
für Filter, Aggregate und Cursorseiten.

## Annahmen

- Die Version-0-Umgebung erlaubt ein neues SQLite-Schema ohne
  Rückwärtskompatibilitätsarbeit für historische externe Installationen.
- Bestehende lokale Schema-3-Daten müssen durch die projektinterne Migration
  weiterhin sicher geöffnet werden können.
- Detaillierte KI-Traces bleiben für bewusst aktivierte lokale Analysen
  verfügbar; `off` erzeugt keine dauerhaften Detaildaten.
- Speicherwerte werden mit synthetischen beziehungsweise temporären
  Datenbanken verifiziert. Die aktive Runtime-Datenbank wird im Paketprozess
  nicht verändert.

## Nicht-Ziele

- kein Wechsel der Rules Engine oder ihrer Replay-/StateHash-Autorität;
- keine Änderung der LegalActions, KI-Auswahl oder Kartenmechaniken;
- kein WAL-Wechsel, solange der neue Backupvertrag nicht separat unter Last
  bewertet wurde;
- kein vollständiger Event-Sourcing-Umbau des Undo-Systems;
- keine automatische Löschung bestehender Matches oder Backups;
- keine Kompression, die bestehende lokale Replay- und Analysewerkzeuge ohne
  versionierten Decoder unlesbar macht.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Jede Persistenzänderung bleibt transaktional und Foreign Keys bleiben aktiv.
- Engine-Events und PublicEvents bleiben append-or-truncate und deterministisch
  nach `event_index` geordnet.
- Ein Undo darf Events, Receipts, Snapshots und KI-Traces nur bis zum
  autorisierten Zielzustand behalten.
- Ausführlicher KI-Debug bleibt `D6_ai_debug_data` und wird nur in erlaubten
  lokalen beziehungsweise actor-sicheren Perspektiven hydriert.
- Backups werden vor Erfolgsmeldung auf Integrität und Prüfsumme geprüft.
- Accountstatistik bleibt ownergebunden und legt keine Gegneridentität oder
  Hidden-Info-Daten offen.
- Die aktive lokale Runtime-Datenbank ist nie Testziel für mutierende Checks.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Rote fokussierte Tests werden im aktuellen Paket eng diagnostiziert und
behoben. Ein Paket wird nicht committed, solange sein Done-Gate rot ist.
Unerwartete Schema-Inkompatibilität, Hidden-Info-Leak, StateHash-/Replay-Drift,
inkonsistentes Backup oder nicht sicher zuordenbare fremde Worktree-Änderungen
sind Sicherheitsblocker. In diesem Fall stoppt der Prozess mit Blockerreport
und klarer Removal Condition.

## State Machine

`preflight -> SMO-00 -> SMO-01 -> SMO-02 -> SMO-03 -> SMO-04 -> SMO-05 -> final_verify -> main_sync -> main_merge -> cleanup -> complete`

## Paketfolge

### SMO-00 – Prozessvertrag und Messbaseline

Ziel: Scope, Ausgangswerte, Invarianten und Gates dauerhaft festhalten.

- Kernartefakt: dieses Prozessdokument;
- Checks: Dokumentprüfung, `git diff --check`;
- Done-Gate: Prozess ist vollständig, Worktree eindeutig und separat;
- Commit: `docs(storage): define sqlite optimization process`.

### SMO-01 – Inkrementelle wachsende Matchtabellen

Ziel: KI-Traces und Action Receipts append-or-truncate statt vollständigem
Delete/Reinsert speichern und sortierende Matchabfragen indexieren.

- Arbeit:
  - Schema-Version und Migration für Ordnungsindizes;
  - inkrementelle Trace- und Receipt-Synchronisierung;
  - korrekter Tail-Schnitt nach Undo;
  - fokussierte Write-Audit-, Reopen- und Query-Plan-Tests.
- Kernartefakte: `apps/server/src/storage-sqlite.ts`, Servertests;
- Checks: fokussierte Storage-/Multiplayer-Tests, Server-Typecheck,
  `git diff --check`;
- Done-Gate: eine neue Aktion schreibt nur neue Zeilen, Undo entfernt nur den
  nicht mehr gültigen Tail und Reopen ist inhaltsgleich;
- Commit: `perf(storage): persist growing match tables incrementally`.

### SMO-02 – Kanonischer KI-Debug

Ziel: ausführlichen KI-Debug nicht gleichzeitig im PublicEvent und im
Trace-Ledger persistieren.

- Arbeit:
  - Eventpersistenz ohne eingebetteten ausführlichen `aiDecisionDebug`;
  - autorisierte Replay-/Analyse-Hydration aus dem kanonischen Trace;
  - `off`, `summary` und `detailed` explizit testen;
  - Hidden-Info- und Replay-Perspektivgrenzen erhalten.
- Kernartefakte: Multiplayer-, Storage- und Replay-Projektionstests;
- Checks: fokussierte Replay-/Trace-/Payloadtests, Server-Typecheck,
  `git diff --check`;
- Done-Gate: keine Debug-Doppelablage, erlaubte Detailansicht bleibt nutzbar,
  fremde Perspektiven bleiben redigiert;
- Commit: `perf(storage): normalize persisted ai decision debug`.

### SMO-03 – Kompakte Backups und eigenständige DB-Optimierung

Ziel: konsistente Backups ohne Freelist-Ballast und ohne vollständige
Dateiallokation im Node-Arbeitsspeicher sowie ein sicherer Vacuum-Ablauf.

- Arbeit:
  - SQLite-konsistente kompakte Backup-Erzeugung;
  - blockweise beziehungsweise streamingartige SHA-256-Berechnung;
  - Maintenance-Service/CLI für `backup -> vacuum -> integrity_check`;
  - Größen-, Restore- und Fehlerfalltests;
  - bestehende Backups nicht automatisch löschen.
- Kernartefakte: Storage, CLI, Maintenance-Vertrag und Runbook;
- Checks: fokussierte Backup-/Restore-/Maintenance-Tests, Server-Typecheck,
  `git diff --check`;
- Done-Gate: Test-DB mit Freelist erzeugt kleineres valides Backup, Vacuum
  gewinnt Platz unabhängig von Matchlöschung zurück;
- Commit: `feat(storage): add compact backup and vacuum maintenance`.

### SMO-04 – SQL-seitige Accountstatistik

Ziel: Ledgerfilter, Aggregate und Cursorseiten in SQLite ausführen, ohne die
API- oder Privacy-Verträge zu ändern.

- Arbeit:
  - Storage-Methoden für gefilterte Aggregate und Keyset-Pagination;
  - vorhandenen `(account_id, completed_at, result_id)`-Index verwenden;
  - In-Memory-Adapter vertragstreu halten;
  - große synthetische Ledgerprobe ergänzen.
- Kernartefakte: `apps/server/src/account-statistics.ts` und Tests;
- Checks: Statistik-/HTTPtests, Server-Typecheck, `git diff --check`;
- Done-Gate: API-Antworten bleiben gleich, SQLite lädt für eine Seite nicht
  mehr das vollständige Accountledger;
- Commit: `perf(accounts): query match statistics in sqlite`.

### SMO-05 – Gesamtgate und Wissensrückführung

Ziel: den integrierten Stand messen, dokumentieren und projektweit prüfen.

- Arbeit:
  - repräsentative Größen-/Write-Audit-Baseline nachziehen;
  - Final Review, Wissensindex/Status und Juli-Log aktualisieren;
  - alle relevanten Gesamtchecks ausführen.
- Kernartefakte: Final Review, Wissensbasis und Status;
- Checks: vollständige Servertests, Shared-/Webtests soweit betroffen,
  projektweiter Typecheck, Package Boundaries, `git diff --check`;
- Done-Gate: dokumentierte Messwerte, grüne Gates und keine offenen
  prozessrelevanten Änderungen;
- Commit: `docs(storage): finalize sqlite optimization review`.

## Verifikationsregeln

- Jeder mutierende Storage-Test verwendet eine temporäre SQLite-Datei.
- Größenvergleiche prüfen fachliche Nutzbarkeit zusätzlich zur Dateigröße.
- Write-Audit-Tests unterscheiden Append, unveränderten Prefix und Undo-Tail.
- Replay-/StateHash-/Hidden-Info-Regressionen sind für SMO-02 Pflicht.
- Nicht ausgeführte breite Checks werden im jeweiligen Paketstand benannt und
  spätestens in SMO-05 nachgezogen.

## Worktree-, Git- und Integrationsregeln

Die Umsetzung erfolgt ausschließlich im oben benannten Worktree. Jedes Paket
erhält nach grünem Done-Gate einen eigenen Commit. Vor dem finalen Merge wird
der aktuelle lokale `main` defensiv in den Arbeitsbranch integriert und das
Gesamtgate erneut ausgeführt. Danach wird bevorzugt fast-forward nach `main`
gemergt. Push und Pull Request sind nicht autorisiert.

Nach erfolgreichem Main-Merge werden der exakte Arbeits-Worktree und der
vollständig gemergte Branch ohne Force entfernt. Git-Worktree-Liste,
Dateisystem und Branchliste müssen die Entfernung bestätigen.

## Controller-Prompt-Kern

`/Goal Arbeite SQLite-Matchstorage-Optimierung vollständig und sequenziell von
SMO-00 bis SMO-05 ab und merge den abgeschlossenen Arbeitsbranch lokal nach
main. Lies AGENTS.md, AGENTS.local.md, die Serverregeln und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_SQLITE_MATCHSTORAGE_OPTIMIZATION auf Branch
codex/sqlite-matchstorage-optimization. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus,
dokumentiere Abweichungen und committe jedes erfüllte Done-Gate. Stoppe bei
Sicherheitsblockern mit Removal Condition. Integriere vor Abschluss aktuelles
main, verifiziere final, merge lokal nach main und entferne Worktree sowie
Branch erst nach doppelter Cleanup-Prüfung. Markiere das Goal erst danach als
complete.`

## Abschlusskriterien

- SMO-00 bis SMO-05 sind einzeln committed und ihre Done-Gates erfüllt.
- Final Review enthält Vorher-/Nachherwerte und verbleibende Trade-offs.
- Arbeitsbranch ist auf aktuellem `main` verifiziert und lokal integriert.
- `main` ist sauber und besteht `git diff --check`.
- Arbeits-Worktree existiert weder in Git noch im Dateisystem.
- Der gemergte Arbeitsbranch ist gelöscht.
- Das verbindliche Goal ist erst danach `complete`.

## Fortschrittsnachweis

### SMO-01 – abgeschlossen

- KI-Traces und Action Receipts werden append-or-truncate synchronisiert;
  unverändertes erneutes Speichern erzeugt keine Tabellenwrites.
- Undo entfernt nur nicht mehr gültige Event-, Trace- und Receipt-Tails.
- Additive Indizes ordnen PublicEvents, EngineEvents und StateSnapshots ohne
  Schemaformatänderung; deshalb war keine datenverändernde Migration nötig.
- Fokussierte Write-Audit-/Undo-/Query-Plan-Tests: 2/2 grün.
- Server-Typecheck: grün.
- Vollständiger Serverlauf: 183/184 grün. Der einzige rote Test
  `advances Corp AI in a root-rez window even when activeSide is runner`
  scheitert identisch auf dem unveränderten `main`, weil er noch leere
  Runner-LegalActions erwartet, während `jack_out` und `continue_run`
  inzwischen legal sind. Das ist als vorbestehende fachfremde Baseline
  klassifiziert und wird nicht in den Storage-Scope gezogen.

### SMO-02 – abgeschlossen

- Neue SQLite-Eventzeilen speichern keinen eingebetteten ausführlichen
  `aiDecisionDebug` mehr. Das versionierte Trace-Ledger ist der kanonische
  dauerhafte Speicherort.
- Autorisierte Actor- und `local_analysis`-Replays hydrieren ihren
  sanitizierten Debug aus `trace_json`; die Gegenseite erhält weiterhin nur
  die redigierte Markierung.
- `aiTraceMode: off` hinterlässt weder Tracezeile noch dauerhaften Replay-Debug.
- Bestehende historische Eventzeilen werden nicht ungeprüft beim Serverstart
  umgeschrieben. Ihre kontrollierte Normalisierung erfolgt im gesicherten
  Optimize-/Vacuum-Ablauf von SMO-03.
- Fokussierte Trace-/Replay-/Redactiontests: 8/8 grün.
- Server-Typecheck und `git diff --check`: grün.

### SMO-03 – abgeschlossen

- SQLite-Backups werden über `VACUUM INTO` aus der geöffneten Datenbank
  konsistent und ohne Freelist-Ballast erzeugt und vor der Erfolgsmeldung per
  `integrity_check` validiert.
- SHA-256-Prüfsummen lesen große Datenbanken in begrenzten 1-MiB-Blöcken statt
  die gesamte Datei in den Node-Arbeitsspeicher zu laden.
- `corepack pnpm storage:optimize` erzeugt zuerst ein kompaktes
  `pre_optimization`-Backup, normalisiert historische doppelte
  `aiDecisionDebug`-Eventpayloads, führt `VACUUM` und `PRAGMA optimize` aus und
  prüft anschließend die Integrität.
- Bestehende Backups werden nicht automatisch gelöscht; das Runbook verlangt
  exklusiven Zugriff bei beendeter NETGRID-App.
- Fokussierte Backup-/Restore-/Kompaktions-/Optimize-Tests: 4/4 grün.
- Server-Typecheck und `git diff --check`: grün.

### SMO-04 – abgeschlossen

- SQLite berechnet gefilterte Gesamt-, Seiten-, Gegner-, Modus- und
  Formatstatistiken direkt per bedingter Aggregation; Serienaggregate bleiben
  vertragstreu und ownergebunden.
- Die Matchhistorie nutzt `LIMIT + 1` und einen Keyset-Cursor über
  `(completed_at, account_game_result_id)` statt das vollständige Accountledger
  zu laden und in JavaScript zu sortieren.
- Der In-Memory-Adapter behält den bisherigen Referenzpfad. Eine synthetische
  Probe mit 240 Owner-Ergebnissen vergleicht beide Adapter inhaltlich und lässt
  den SQLite-Test scheitern, sobald dessen Full-Ledger-Methoden aufgerufen
  werden.
- `EXPLAIN QUERY PLAN` bestätigt die Nutzung von
  `idx_account_game_results_account_completed` für die geordnete Ownerseite.
- Accountstatistik- und HTTP-Tests: 10/10 grün.
- Server-Typecheck und `git diff --check`: grün.

### SMO-05 – abgeschlossen

- Read-only Bestandsmessung und synthetische Write-/Freelist-/Ledgerproben
  sind im Abschlussreview konsolidiert; die aktive Runtime-Datenbank blieb
  unverändert.
- Final Review, Wissensindex, aktueller Projektstatus, Codex-Status und
  Juli-Log sind auf den neuen führenden Storagevertrag nachgezogen.
- Projektweiter Typecheck, Contracttests, Test-Discovery und
  Package-Boundaries sind grün.
- Der vollständige Serverlauf steht bei 185/186. Der einzige rote Test ist die
  bereits auf Ausgangs-`main` reproduzierte fachfremde Jack-out-Erwartung aus
  SMO-01; sämtliche neuen und betroffenen Storage-/Accounttests sind grün.
- Lokales `main` mit Stand `3a608e288` wurde konfliktfrei integriert. Der
  anschließende Reverify bestätigt Typecheck, Contracttests, Test-Discovery
  und Package-Boundaries; der vollständige Serverlauf bleibt unverändert bei
  185/186 mit derselben vorbestehenden Jack-out-Testschuld.
- `git diff --check`: grün.
