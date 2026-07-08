# docs-Retention nach Current-State-Prinzip

Status: `accepted`
Datum: 2026-07-08
Primärer Agent: `release-implementation-agent`

## Zweck

Diese Entscheidung präzisiert die ältere docs-Zielstrukturentscheidung vom 2026-05-18 für die aktuelle private Version-0-Phase. Sie erlaubt gezielte Entfernung alter Update-, Prozess-, Benchmark-, Trace- und Review-Einzelartefakte, wenn ihr aktueller Inhalt verdichtet oder nicht mehr benötigt ist.

## Ausgangslage

`docs/reviews/` ist zum Sammelbereich für historische KI-Reviews, Benchmarks, Diagnoseberichte und maschinenlesbare Roh-Evidence geworden. Der Bereich ist inzwischen unverhältnismäßig groß:

- `docs/reviews/`: 1082 relevante Markdown/JSON/Text-Dateien, ca. 245,60 MB.
- `docs/reviews/ai/`: 1010 Markdown/JSON-Dateien, ca. 244,92 MB.
- `docs/reviews/ai/*.json`: 359 Dateien, ca. 239,82 MB.
- Heuristisch als Runtime-/Benchmark-Evidence klassifizierte AI-Review-Dateien: 242 Dateien, ca. 222,92 MB.

Die bisherige Regel, Review-Artefakte als Evidence zu versionieren, war für frühere Gate- und Auditphasen sinnvoll. In der aktuellen Version-0-Umgebung gilt aber kein genereller Legacy-Erhalt. Alte Einzelstände sind nur relevant, wenn sie heute noch als aktuelle Entscheidungs-, Regel-, Gate-, Test- oder Review-Evidence gebraucht werden.

## Entscheidung

Für Dokumentations- und Review-Artefakte gilt ab sofort das Current-State-Prinzip:

1. Führend sind aktuelle Status-, Architektur-, Release-, Runbook-, Roadmap-, Source-, Gate- und Rollup-Dokumente.
2. Historische Update-, Zwischenstands-, Trace-, Benchmark- und Prozessartefakte bleiben nicht automatisch im Arbeitsbaum.
3. Git-Historie genügt als historischer Nachweis, wenn der aktuelle fachliche Gehalt in einem Rollup, Statusdokument oder führenden Artefakt verdichtet ist.
4. Große maschinenlesbare Rohartefakte werden bevorzugt entfernt statt archiviert, wenn sie nicht mehr aktiv gelesen, getestet oder referenziert werden.
5. Bei Unsicherheit wird ein Artefakt nicht gelöscht, sondern als `needs-review` inventarisiert.

## Retention-Klassen

### `keep`

Im Arbeitsbaum behalten:

- aktuelle Status- und Indexseiten in `KI-Wissen-NETGRID/`;
- aktuelle Roadmaps, Requirements, Specs, Testmatrizen, Implementation Reviews und Final Reviews aktiver oder noch relevanter Releasefamilien;
- aktive Architekturverträge, Runbooks und Entscheidungen;
- Rohquellen unter `docs/source/`;
- Data-, Manifest-, Scenario- und Report-Artefakte, die von Code, Tests, Gates oder Scripts genutzt werden;
- Review-Artefakte, die aktuell als einzige bekannte Entscheidung, Removal Condition oder Gate-Evidence dienen.

### `rollup-then-delete`

Verdichten und danach entfernen:

- alte Update- und Fortschrittsberichte;
- historische Einzelreviews ohne aktuellen Gate-Wert;
- Detailpläne, Preflights und Prompt-/Controller-Zwischenstände nach Abschluss der Linie;
- erledigte `docs/activities/done`-Einzelpakete, wenn sie in Rollups, führende Artefakte oder Git-Historie überführt wurden.

### `delete`

Nach Referenzprüfung direkt entfernen:

- unreferenzierte große JSON-Traces, Benchmarks, Candidate-/Seed-/Snapshot-/Optimizer-/Selfplay-Dumps;
- generierte Reports, die weder Scriptinput noch aktuelles Gate sind;
- doppelte oder ältere maschinenlesbare Zwischenstände, deren Aussage in aktueller Summary/Rollup/Statusseite enthalten ist.

### `needs-review`

Vor Löschung gesondert prüfen:

- Dateien mit Referenzen aus `docs/codex/CODEX_STATUS.md`, `KI-Wissen-NETGRID/`, `package.json`, `scripts/`, `packages/`, `apps/` oder `data/`;
- Artefakte mit `final`, `gate`, `requirements`, `spec`, `test-matrix`, `contract`, `readiness`, `cutover`, `policy`, `removal`, `decision` oder `statehash` im Namen;
- kleine Markdown-Reviews, deren Inhalt nicht klar in einem aktuellen Rollup enthalten ist.

## Verhältnis zur Entscheidung vom 2026-05-18

Die docs-Zielstruktur bleibt gültig. Diese Entscheidung ersetzt aber die dortige konservative Löschbremse für Version-0-Altstände:

- Keine blinde Masselöschung.
- Aber: keine dauerhafte Arbeitsbaum-Aufbewahrung historischer Einzelartefakte ohne aktuellen Nutzen.
- Rollup, Referenzprüfung und kleine Löschwellen sind der Standardpfad.

## Erste Anwendung

Die erste Anwendung betrifft `docs/reviews/ai/`:

- aktueller AI-/Review-Ist-Stand wird in `docs/reviews/docs-cleanup/current-state-docs-rollup-2026-07-08.md` verdichtet;
- `docs/reviews/ai/README.md` wird zu einem Kurzindex für aktuelle Orientierung und Retention umgestellt;
- unreferenzierte große AI-JSON-Rohartefakte werden inventarisiert und in einer ersten sicheren Welle entfernt.

## Nicht entschieden

- Ob weitere alte Release-Detailpläne später ebenfalls entfernt oder nur archiviert werden.
- Ob `docs/codex/CODEX_STATUS.md` in einem eigenen Paket stark verdichtet wird.
- Ob `docs/activities/done/` nach Monatsrollups vollständig ausgedünnt wird.

## Akzeptanz

Diese Entscheidung ist angenommen, wenn:

- sie versioniert ist;
- `docs/reviews/README.md` und `docs/reviews/ai/README.md` auf diese Retention-Regel verweisen;
- die erste Löschwelle ein maschinenlesbares Inventar und eine Referenzprüfung besitzt.
