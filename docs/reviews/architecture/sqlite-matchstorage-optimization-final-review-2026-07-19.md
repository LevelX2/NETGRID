# SQLite-Matchstorage-Optimierung – Abschlussreview 2026-07-19

## Ergebnis

Die Matchpersistenz schreibt wachsende Tabellen inkrementell, legt
ausführlichen KI-Debug nur noch im kanonischen Trace-Ledger ab, erzeugt
kompakte konsistente Backups und besitzt einen gesicherten eigenständigen
Optimize-Lauf. Accountstatistik und Matchhistorie filtern, aggregieren und
paginieren direkt in SQLite. Engine-, Replay-, StateHash-, Undo- und
Hidden-Info-Verträge bleiben unverändert.

## Read-only Bestandsmessung

Die aktive lokale Runtime-Datenbank wurde am 19.07.2026 ausschließlich
read-only vermessen und nicht verändert:

| Messwert | Bestand | Wirkung des neuen Pfads |
| --- | ---: | --- |
| SQLite-Datei | 1.095.098.368 Byte | Ausgangswert |
| Freelist | 140.296 Seiten = 574.652.416 Byte | `VACUUM` kann den Platz kontrolliert zurückgeben |
| kompakter Bestand vor Debug-Normalisierung | ca. 520.445.952 Byte | `VACUUM INTO` übernimmt keine freien Seiten ins Backup |
| PublicEvent-Payload | 121.333.980 Byte | Ausgangswert |
| PublicEvent-Payload ohne doppelten KI-Debug | 3.256.849 Byte | 118.077.131 Byte vermeidbare Doppelablage |
| Eventzeilen mit doppeltem KI-Debug | 2.529 | gesicherte Altlasten-Normalisierung im Optimize-Lauf |
| KI-Tracezeilen | 2.529 | bleiben kanonische Diagnosequelle |
| vorhandene SQLite-Backups | 8 Dateien, 4.872.572.928 Byte | keine automatische Löschung |

Freelist und Debug-Doppelablage sind getrennte, kumulierbare Hebel. Die
rechnerische Differenz ist keine Zusage einer exakten Zieldateigröße, weil
SQLite nach dem Rewrite Seiten und Indizes neu packt. Der kontrollierte Lauf
meldet deshalb die tatsächlich erreichten Vorher-/Nachherwerte.

## Umgesetzter Stand

- PublicEvents, EngineEvents, Action Receipts und KI-Traces werden als
  unveränderter Prefix plus Append beziehungsweise autorisierter Undo-Tail
  synchronisiert. Erneutes Speichern eines unveränderten Matches erzeugt
  dort keine Writes.
- Additive Ordnungsindizes tragen Event-, Snapshot- und Accountabfragen. Die
  Query-Plan-Tests bestätigen ihre Nutzung.
- Persistierte PublicEvents enthalten keinen ausführlichen
  `aiDecisionDebug`. Autorisierte Replayansichten rekonstruieren ihn
  sanitisiert aus `ai_decision_traces`; die Gegenseite bleibt redigiert und
  Trace-Modus `off` speichert nichts.
- Backups verwenden `VACUUM INTO`, werden per `integrity_check` geprüft und
  mit einer blockweise berechneten SHA-256-Prüfsumme manifestiert. Dadurch
  wird weder Freelist-Ballast kopiert noch die gesamte Datei für den Hash in
  den Node-Arbeitsspeicher geladen.
- `corepack pnpm storage:optimize` erstellt zuerst ein geprüftes
  `pre_optimization`-Backup, entfernt historische Debug-Doppelablagen, führt
  `VACUUM` und `PRAGMA optimize` aus und prüft abschließend die Integrität.
- Accountaggregate laufen per bedingter SQL-Aggregation. Die private History
  nutzt `LIMIT + 1` und Keyset-Pagination über
  `(completed_at, account_game_result_id)` statt eines vollständigen
  Ownerledger-Loads.

## Verifikation

- inkrementelle Write-Audit-/Undo-/Query-Plan-Tests: 2/2 grün;
- Trace-/Replay-/Redactiontests: 8/8 grün;
- Backup-/Restore-/Kompaktions-/Optimize-Tests: 4/4 grün;
- Accountstatistik-/HTTPtests einschließlich 240-Zeilen-Paritätsprobe: 10/10
  grün;
- projektweiter Typecheck: grün;
- Shared- und Contracttests: 20/20 grün, Test-Discovery grün;
- Package-Boundaries: grün, 1.892 geprüfte Dateien;
- vollständiger Servertest: 185/186 grün. Der einzige rote Test
  `advances Corp AI in a root-rez window even when activeSide is runner`
  erwartet den früheren Zustand ohne Runner-Aktionen, während der aktuelle
  Enginevertrag im Jack-out-Fenster `jack_out` und `continue_run` liefert.
  Derselbe Fehler ist auf dem unveränderten Ausgangs-`main` reproduzierbar
  und wurde nicht in den Storage-Scope gezogen;
- `git diff --check`: grün.

## Betrieb und Grenzen

Der Optimize-Befehl verlangt exklusiven Zugriff: NETGRID vorher beenden und
danach wieder über `scripts/start-netgrid.ps1` starten. Ein Backup entsteht
immer vor der ersten Datenänderung. Bestehende Matches oder Backups werden
nicht automatisch gelöscht.

Bewusst nicht umgesetzt sind ein WAL-Wechsel, Payloadkompression mit neuem
Decoder, automatische Retention oder ein Event-Sourcing-Umbau. Diese Punkte
würden eigene Betriebs-, Kompatibilitäts- und Recovery-Gates benötigen.

Führender Prozessstand:
`docs/architecture/maintenance/sqlite-matchstorage-optimization-process-2026-07-19.md`.
