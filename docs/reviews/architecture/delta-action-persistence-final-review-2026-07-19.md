# Delta-basierte Aktionspersistenz – Abschlussreview 2026-07-19

## Ergebnis

Der normale SQLite-Pfad für Spieler- und KI-Aktionen lädt wachsende
Matchhistorien nur noch begrenzt und persistiert den Übergang als atomisches
Delta. Bestehende Storage-Adapter ohne Delta-Capability sowie vollständige
Undo-, Replay-, Maintenance- und Lifecycle-Ladevorgänge behalten ihren
bisherigen Vollpfad.

Die Rules Engine bleibt die einzige Regelautorität. Der Service reicht
weiterhin ausschließlich `PlayerActions` aus `LegalActions` ein; StateVersion,
MatchVersion, Replay, StateHash, RandomDrawRecords und Hidden-Info-Redaktion
werden durch den Storage-Schnitt nicht verändert.

## Umgesetzter Pfad

- `MultiplayerStorage` besitzt die optionalen Fähigkeiten `loadForAction` und
  `saveActionDelta`. Nur wenn beide vorhanden sind und der Load eine interne
  Baseline liefert, verwendet der Service den Delta-Pfad. Alle anderen Adapter
  fallen auf `load/save` zurück.
- Der Aktionsload übernimmt alle PublicEvents als kleines Chronik-Gerüst mit
  den turnrelevanten öffentlichen Feldern. Nur die letzten 80 PublicEvents
  behalten den vollständigen Payload. Dadurch bleiben Event-Tail und
  Chronicle-Turn-Kontext identisch.
- KI-Traces werden nur für Event-IDs im sichtbaren 80er-Tail geladen. Der
  globale Tracezähler bleibt Teil der Baseline, damit neue `decisionIndex`-
  Werte auch nach einem begrenzten Load monoton bleiben.
- Action Receipts werden nur für Seite und Idempotenzschlüssel der aktuellen
  Anfrage geladen. StateSnapshots werden im normalen Aktionsload weiterhin
  nicht hydriert.
- Der vollständige Engine-Eventstrom bleibt im Aktionsload erhalten. Das ist
  eine bewusste Sicherheitsgrenze, weil Engine- und Kartenlogik historische
  Engine-Ereignisse auswerten kann.
- Der Delta-Save prüft innerhalb einer `BEGIN IMMEDIATE`-Transaktion die
  erwartete Match- und StateVersion sowie die Zeilenzähler von PublicEvents,
  EngineEvents, Receipts und KI-Traces. Drift führt zu
  `action_persistence_conflict` und zu keinem Teilcommit.
- Nach der Prüfung werden Core-State und kleine Token-/Pending-Undo-Daten
  aktualisiert; neue Events, EngineEvents, Receipts, StateSnapshots und Traces
  werden ausschließlich angefügt. Persistence Observer laufen erst nach dem
  erfolgreichen Commit.

## Messwerte

Die Werte sind reproduzierbare Entwicklungsindikatoren auf dem lokalen
Windows-Rechner, keine Produkt-SLA:

| Probe | Ergebnis |
| --- | ---: |
| synthetischer bisheriger snapshotfreier Aktionsload | 89.642 Byte Historienanteil |
| neuer bounded Aktionsload | 74.726 Byte Historienanteil |
| Reduktion im absichtlich klein gehaltenen Fixture | 16,6 % |
| Burst mit 1 Match | ca. 18 ms |
| Burst mit 10 Matches | ca. 91 ms |
| Burst mit 25 Matches | ca. 255 ms |

Die Burstprobe erzeugt 25 unabhängige SQLite-Matches und persistiert in drei
Runden 1, 10 und 25 Aktionen über die normalen Service-Locks. Alle 36 Receipts
liegen danach genau einmal vor. Reale KI-Tracepayloads sind deutlich größer
als das synthetische Fixture; dessen Bytewert ist deshalb konservativ, aber
nicht auf beliebige Matches hochzurechnen.

## Sicherheits- und Regressionsnachweise

- Capability- und Fallbacktests bestätigen denselben Servicevertrag für
  deltafähige und klassische Adapter; ein Persistenzfehler bleibt vor dem
  Erfolgsresponse sichtbar.
- Query-/Payloadtests bestätigen identischen 80er-Event-Tail, identischen
  Chronicle-Turn-Kontext, gezielte Receipt-Hydration und das Auslassen früher
  großer PublicEvent-/Tracepayloads.
- Write-Trigger verbieten Updates und Deletes auf bestehenden Event-,
  EngineEvent-, Receipt-, Snapshot- und Tracezeilen. Normale Aktionen bleiben
  grün und schreiben nur Append-Zeilen.
- Ein absichtlich spät fehlschlagender Receipt-Insert rollt Core-State,
  Events, Snapshot und Receipt vollständig zurück; Observer werden nicht
  aufgerufen.
- Eine konkurrierend veränderte Receipt-Historie wird auch bei unveränderter
  Match-/StateVersion erkannt; das veraltete Delta schreibt keine Teilmenge.
- Bestehende SQLite-KI-Trace-, Hidden-Info-, Undo-, Replay- und
  StateHash-Regressionen laufen über den neuen Pfad grün.
- Die fokussierte Semantik-/Lastsuite ist 6/6 grün; Server-Typecheck und
  `git diff --check` sind grün.
- Der projektweite Typecheck ist grün. Shared- und Contracttests sind 20/20
  grün, Test-Discovery ist vollständig und Package-Boundaries sind mit 1.893
  geprüften Dateien grün.
- Der vollständige Serverlauf nach dem Abgleich mit aktuellem `main` ist
  191/192 grün; `multiplayer.test.ts` ist 131/132 grün. Der einzige rote Test
  `advances Corp AI in a root-rez window even when activeSide is runner`
  erwartet weiterhin den früheren Zustand ohne Runner-Aktionen, obwohl der
  aktuelle Enginevertrag im Jack-out-Fenster `jack_out` und `continue_run`
  liefert. Die Abweichung bestand bereits auf dem Ausgangs-`main` und gehört
  nicht zum Storage-Scope.

## Grenzen und Betrieb

- SQLite-Schreibtransaktionen bleiben innerhalb eines Prozesses serialisiert.
  Der Delta-Pfad verkürzt Arbeit und Datenmenge pro Matchaktion, macht aus
  SQLite aber keinen parallel schreibenden verteilten Storage.
- Der Journalmodus bleibt `DELETE`; ein WAL-Wechsel ist weiterhin eine eigene
  Betriebs-, Recovery- und Mehrprozessentscheidung.
- PublicEvent-Kontextzeilen und EngineEvents wachsen weiterhin linear. Eine
  voraggregierte Chronicle-Baseline oder Engine-Event-Checkpoints wären eigene
  fachliche Verträge und wurden nicht vorgezogen.
- Undo, Replay, Export, Maintenance, Lifecycle-Umbauten und explizite volle
  Loads verwenden weiterhin den vollständigen Storagepfad. Dadurch bleiben
  Tail-Truncation und historische Verifikation unverändert.
- Es gibt keine Schemaänderung und keine Migration bestehender Runtime-Daten.

Führender Prozessstand:
`docs/architecture/maintenance/delta-action-persistence-process-2026-07-19.md`.
