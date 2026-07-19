# Delta-basierter SQLite-Aktionspfad – Paketprozess

Stand: 2026-07-19
Status: in Umsetzung
Arbeitsbranch: `codex/delta-action-persistence`
Worktree: `C:\Projekte\NETGRID_DELTA_ACTION_PERSISTENCE`

## Quelle, Zielprüfung und Ausgangslage

Ausgangspunkt ist die freigegebene Folgemaßnahme aus dem
SQLite-Performance-Review: Der normale Matchaktionspfad soll nicht mehr die
vollständige PublicEvent-, KI-Trace-, Receipt- und Snapshot-Historie laden und
anschließend auf unveränderte Präfixe prüfen. Die Vorgabe ist für eine direkte
Umsetzung ausreichend präzise.

Die read-only Bestandsprüfung zeigt für das längste aktive lokale Match vor
dem operativen Optimize-Lauf bis zu 954 History-Zeilen und rund 15,5 MB
PublicEvent-/EngineEvent-/Trace-Payload je vollständiger Hydration. Der
Aktionspfad überspringt StateSnapshots bereits, lädt aber weiterhin alle
übrigen History-Tabellen. `DatabaseSync` führt diese Arbeit synchron im
Serverthread aus.

## Gesamtziel

Normale Spieler- und KI-Aktionen verwenden in SQLite einen bounded
Aktions-Lesevertrag und persistieren ausschließlich den atomaren Übergang:
aktueller Match-/GameState, neue PublicEvents, EngineEvents, Receipts,
StateSnapshots und KI-Traces. Aufwand und transportierte Diagnosepayload
bleiben dadurch für den normalen Aktionspfad unabhängig von der vollständigen
Matchhistorie begrenzt. Vollständige Lade- und Save-Verträge bleiben für Undo,
Replay, Maintenance, Lifecycle-Sonderpfade und nicht deltafähige Adapter
erhalten.

## Annahmen

- Pro Match bleibt `withMatchLock` die verbindliche In-Process-
  Serialisierung.
- Ein erfolgreicher Aktionsresponse wird weiterhin erst nach erfolgreichem
  SQLite-Commit erzeugt.
- Der Engine-GameState darf seine EngineEvent-Historie weiterhin vollständig
  benötigen; sie ist nicht Teil dieses ersten bounded Delta-Schnitts.
- PublicEvent-Tails und die darin erlaubte KI-Debugansicht müssen inhaltlich
  identisch zum bestehenden SidePayload-Vertrag bleiben.
- In-Memory- und fremde Storage-Adapter verwenden ohne neue Capability
  unverändert `load` und `save`.

## Nicht-Ziele

- kein Worker-Thread, Treiberwechsel, WAL- oder `synchronous`-Wechsel;
- kein Hot-Match-Cache und keine Antwort vor dauerhaftem Commit;
- kein Engine-, LegalAction-, KI-Auswahl- oder Kartenmechanik-Umbau;
- kein Umbau von Undo oder Replay auf Event Sourcing;
- keine Änderung öffentlicher HTTP-/WebSocket-Payloadschemas;
- keine Mutation der aktiven lokalen Runtime-Datenbank in Tests.

## Controller-Invarianten

- Genau ein Paket ist aktiv und kein Paket wird übersprungen.
- `applyAction` bleibt einzige Autorität und revalidiert Action, Seite,
  StateVersion, Timing, Kosten, Ziele und Choices.
- Delta-Persistenz prüft die erwartete Match- und StateVersion innerhalb
  derselben SQLite-Transaktion vor dem Schreiben.
- Append-Indizes sind exakt an den persistierten Prefix gebunden; Drift führt
  zum sicheren Fehler und niemals zu stillem Überschreiben.
- Undo bleibt der einzige autorisierte Truncate-Pfad und verwendet weiterhin
  den vollständigen Vertrag.
- Hidden-Info-Daten gelangen weder in PublicEvents noch in Delta-Metadaten,
  Logs, Fehler oder Testsnapshots.
- StateHash und deterministisches Replay bleiben nach Reopen identisch.
- Persistence Observer laufen erst nach erfolgreichem Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Fokussierte rote Tests werden im aktiven Paket eng diagnostiziert. Ein Paket
wird erst committed, wenn sein Done-Gate erfüllt ist. Versiondrift,
teilpersistierte Übergänge, Replay-/StateHash-Abweichung, verlorene
Idempotenz, Undo-Tailfehler oder Hidden-Info-Leaks sind Sicherheitsblocker.
Bei einem Blocker stoppt der Prozess mit dokumentierter Removal Condition.

## State Machine

`preflight -> DAP-00 -> DAP-01 -> DAP-02 -> DAP-03 -> DAP-04 -> DAP-05 -> final_verify -> main_sync -> main_merge -> cleanup -> complete`

## Paketfolge

### DAP-00 – Prozessvertrag und Baseline

- Ziel: Scope, Invarianten, Ausgangslage und Gates festhalten.
- Kernartefakt: dieses Prozessdokument.
- Checks: Dokumentprüfung und `git diff --check`.
- Done-Gate: eigener sauberer Worktree, vollständige Paketfolge und
  verbindliches Goal.
- Commit: `docs(storage): define delta action persistence process`.

### DAP-01 – Capability- und Delta-Vertrag

- Ziel: optionalen bounded Load-/Delta-Save-Vertrag ohne Änderung bestehender
  Adapter definieren.
- Arbeit: interne Baseline-/Cursor-Typen, erwartete Versionen,
  Append-Segmente, Observer-/Fallback-Vertrag und Capability-Tests.
- Kernartefakte: `apps/server/src/multiplayer.ts`, Storage-Vertrag und Tests.
- Checks: fokussierte In-Memory-/Fake-Storage-Tests, Server-Typecheck,
  `git diff --check`.
- Done-Gate: deltafähiger und klassischer Adapter liefern dieselben
  Serviceantworten; Persistenzfehler bleiben vor dem Erfolgsresponse sichtbar.
- Commit: `refactor(storage): define action delta capability`.

### DAP-02 – Bounded SQLite-Aktionsload

- Ziel: normale Aktionen ohne vollständige PublicEvent-, Trace-, Receipt- und
  Snapshot-Hydration laden.
- Arbeit: PublicEvent-Präfix als minimales Chronicle-Kontextgerüst plus voller
  Tail, nur tailrelevante KI-Traces, gezieltes Idempotenz-Receipt,
  Delta-Baseline und Query-/Payloadtests.
- Checks: Hydration-, SidePayload-, Hidden-Info-, Query-Audit- und
  Server-Typecheck.
- Done-Gate: Antworttail bleibt identisch, große historische Tracepayload wird
  nicht vollständig gelesen und Undo-/Replay-Loads bleiben unverändert.
- Commit: `perf(storage): add bounded sqlite action load`.

### DAP-03 – Atomare Delta-Persistenz und Service-Anbindung

- Ziel: normale Spieler- und KI-Aktionen als verifizierten Append-Übergang
  persistieren.
- Arbeit: erwartete Version prüfen, Core-State aktualisieren, ausschließlich
  neue Events/Receipts/Snapshots/Traces einfügen, Servicepfad anbinden und
  klassisches Fallback erhalten.
- Checks: Trigger-Write-Audit, Stale-/Drift-/Rollbacktests,
  Idempotenz-/Reopen-Tests, Server-Typecheck und `git diff --check`.
- Done-Gate: keine History-Prefix-Reads oder -Writes im Delta-Save, atomarer
  Commit und identische Serviceantworten.
- Commit: `perf(storage): persist match actions as atomic deltas`.

### DAP-04 – Semantik- und Lastregression

- Ziel: den Delta-Pfad gegen alle sicherheitsrelevanten Verträge und mehrere
  gleichzeitige Matches absichern.
- Arbeit: Human-/KI-Aktionen, mehrere KI-Schritte, abgelehnte und doppelte
  Aktionen, Hidden-Info-Barrieren, Reopen, Replay, StateHash, Undo-Fallback und
  synthetische 1-/10-/25-Match-Probe.
- Checks: fokussierte Multiplayer-/Storage-Suite, Lastprobe,
  vollständiger Serverlauf und Typecheck.
- Done-Gate: fachliche Parität und nachgewiesen bounded Historyzugriff;
  bekannte fachfremde Baselineabweichungen werden separat ausgewiesen.
- Commit: `test(storage): verify delta action persistence at load`.

### DAP-05 – Abschlussreview und Wissensrückführung

- Ziel: Ergebnis, Messwerte, Grenzen und Betriebsstand dauerhaft festhalten.
- Kernartefakte: Final Review, Wissensindex, Projektstatus, Codex-Status und
  Juli-Log.
- Checks: projektweiter Typecheck, Contracts, Package-Boundaries,
  `git diff --check` und relevante Gesamttests.
- Done-Gate: führender Stand und verbleibende Trade-offs sind dokumentiert;
  Arbeitsbranch ist bereit für den Main-Abgleich.
- Commit: `docs(storage): finalize delta action persistence review`.

## Verifikationsregeln

- Jeder mutierende Storage-Test nutzt eine temporäre SQLite-Datei.
- Query-Audits unterscheiden vollständige Undo-/Replay-Hydration und bounded
  normale Aktionshydration.
- Write-Audits prüfen Tabellen und Operationen, nicht nur Ergebnisobjekte.
- Reopen plus Replay und StateHash sind Pflicht nach erfolgreichen Deltas.
- Mindestens ein absichtlich fehlgeschlagenes Delta beweist vollständigen
  Rollback.
- Lastwerte sind reproduzierbare Entwicklungsindikatoren, keine
  Produkt-SLA-Zusage.

## Worktree-, Git- und Integrationsregeln

Die Umsetzung erfolgt ausschließlich im Worktree
`C:\Projekte\NETGRID_DELTA_ACTION_PERSISTENCE` auf Branch
`codex/delta-action-persistence`. Jedes erfüllte Paket erhält einen eigenen
Commit. Vor Abschluss wird aktuelles lokales `main` defensiv integriert und
der relevante Gesamtgate erneut ausgeführt. Danach wird lokal bevorzugt per
Fast-forward nach `main` gemergt. Push und Pull Request sind nicht autorisiert.

Nach erfolgreichem Merge werden nur der exakte Arbeits-Worktree und der
vollständig gemergte Branch ohne Force entfernt. Git-Registrierung,
Dateisystem und Branchliste müssen die Entfernung bestätigen.

## Controller-Prompt-Kern

`/Goal Arbeite Delta-basierter SQLite-Aktionspfad vollständig und sequenziell
von DAP-00 bis DAP-05 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main. Lies AGENTS.md, AGENTS.local.md, die Serverregeln und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_DELTA_ACTION_PERSISTENCE auf Branch
codex/delta-action-persistence. Nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus,
dokumentiere Abweichungen und committe jedes erfüllte Done-Gate. Stoppe bei
Sicherheitsblockern mit Removal Condition. Integriere vor Abschluss aktuelles
main, verifiziere final, merge lokal nach main und entferne Worktree sowie
Branch erst nach doppelter Cleanup-Prüfung. Markiere das Goal erst danach als
complete.`

## Abschlusskriterien

- DAP-00 bis DAP-05 sind einzeln committed und ihre Done-Gates erfüllt.
- Normale SQLite-Aktionen verwenden bounded Load und atomaren Delta-Save.
- Klassischer Save bleibt für Undo, Replay/Lifecycle und Adapterfallback
  funktionsfähig.
- Final Review enthält Paritäts-, Query-, Write- und Lastnachweise.
- Arbeitsbranch ist auf aktuellem `main` verifiziert und lokal integriert.
- `main` ist sauber; Worktree-Pfad, Registrierung und Branch sind entfernt.
- Das Goal wird erst danach als `complete` markiert.
