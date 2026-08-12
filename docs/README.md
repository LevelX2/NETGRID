# NETGRID-Dokumentation

Stand: 2026-08-12

`docs/` enthält ausschließlich den aktuell relevanten Dokumentationsstand des Projekts. Historische Arbeitsstände, abgeschlossene Releasepakete und Reviews werden nicht zusätzlich im Arbeitsbaum archiviert; dafür reicht die Git-Historie.

## Bereiche

- `source/`: unveränderte oder quellennahe Primärquellen, Regelreferenzen und Spoiler.
- `activities/`: operatives Arbeitsboard für offene und laufende kleine Pakete. `done/` ist nur ein kurzlebiger Abschluss-Slot, kein Archiv.
- `architecture/`: aktuelle releaseübergreifende Architektur-, Vertrags- und Schichtdokumente.
- `decisions/`: dauerhafte Projekt-, Produkt-, Git- und Dokumentationsentscheidungen.
- `runbooks/`: wiederholbare lokale Betriebs-, Diagnose- und Wartungsabläufe.
- `codex/`: kompakter technischer Current-State-Einstieg.
- `ui-designsets/`: aktive UI-/Branding-Referenzen.
- `derived/`: reiner Übergangsbereich; hier sollen keine neuen Dokumente entstehen.

## Release- und Review-Evidence

Releasepläne, Final Reviews, Audits, Benchmarks und Migrationsnachweise bleiben nur so lange im Arbeitsbaum, wie sie eine aktuelle Steuerungs-, Gate- oder Vertragsfunktion besitzen. Nach Abschluss und Rückführung des Ergebnisses in Code, Tests, Architektur, Entscheidung oder Status werden sie entfernt.

Neue größere Release- oder Migrationsvorhaben dürfen für ihre Laufzeit einen expliziten Plan erhalten. Ein dauerhaftes Releasearchiv oder eine parallele Statuschronik wird daraus nicht aufgebaut.

Große generierte Rohreports und lokale Analyseausgaben gehören nach `data/local/` oder werden reproduzierbar neu erzeugt.

## Current-State-Regel

Ein Dokument bleibt im Arbeitsbaum, wenn es heute mindestens eine konkrete Funktion besitzt:

- aktueller Architektur- oder Schnittstellenvertrag;
- aktive Requirement, Roadmap, Gate- oder Releasegrundlage;
- aktuelle Entscheidungs- oder Removal-Condition-Evidence;
- aktive Quelle oder Runbook;
- offenes oder laufendes Arbeitspaket.

Abgeschlossene Prozess-, Implementierungs-, Audit-, Benchmark-, Replay-, Trace-, Zwischenstands- und Migrationsartefakte werden nach Referenzprüfung entfernt, sobald ihr aktueller Erkenntniswert in führenden Dokumenten, Code, Tests oder Gates steckt. Sie werden nicht vorsorglich in einen Archivordner verschoben.

Führende Retention-Entscheidung: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
