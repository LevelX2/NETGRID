# NETGRID-Dokumentation

Stand: 2026-08-12

`docs/` enthält den aktuell relevanten Dokumentationsstand des Projekts. Historische Arbeitsstände werden nicht zusätzlich im Arbeitsbaum archiviert; dafür reicht die Git-Historie.

## Bereiche

- `source/`: unveränderte oder quellennahe Primärquellen, Regelreferenzen und Spoiler.
- `activities/`: operatives Arbeitsboard für offene und laufende kleine Pakete. `done/` ist nur ein kurzlebiger Abschluss-Slot, kein Archiv.
- `architecture/`: aktuelle releaseübergreifende Architektur-, Vertrags- und Schichtdokumente.
- `releases/`: aktuell noch relevante Release-, Gate- und Planungsartefakte. Historische Familien werden schrittweise nach dem Current-State-Prinzip ausgedünnt.
- `reviews/`: aktuell benötigte Querschnittsreviews, Audits und Gate-Evidence.
- `decisions/`: dauerhafte Projekt-, Produkt-, Git- und Dokumentationsentscheidungen.
- `runbooks/`: wiederholbare lokale Betriebs-, Diagnose- und Wartungsabläufe.
- `codex/`: kompakter technischer Current-State-Einstieg.
- `ui-designsets/`: aktive UI-/Branding-Referenzen.
- `derived/`: reiner Übergangsbereich; hier sollen keine neuen Dokumente entstehen.

## Current-State-Regel

Ein Dokument bleibt im Arbeitsbaum, wenn es heute mindestens eine konkrete Funktion besitzt:

- aktueller Architektur- oder Schnittstellenvertrag;
- aktive Requirement, Roadmap, Gate- oder Releasegrundlage;
- aktuelle Entscheidungs- oder Removal-Condition-Evidence;
- aktive Quelle oder Runbook;
- offenes oder laufendes Arbeitspaket.

Abgeschlossene Prozess-, Implementierungs-, Audit-, Benchmark-, Replay-, Trace-, Zwischenstands- und Migrationsartefakte werden nach Referenzprüfung entfernt, sobald ihr aktueller Erkenntniswert in führenden Dokumenten, Code, Tests oder Gates steckt. Sie werden nicht vorsorglich in einen Archivordner verschoben.

Große generierte Rohreports und lokale Analyseausgaben gehören nicht dauerhaft nach `docs/`. Wenn sie für laufende Arbeit benötigt werden, liegen sie in dafür vorgesehenen Daten-/Local-Bereichen oder werden reproduzierbar neu erzeugt.

Führende Retention-Entscheidung: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
