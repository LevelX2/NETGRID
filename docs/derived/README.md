# Abgeleitete Artefakte

`docs/derived/` ist seit der Strukturmigration vom 2026-05-18 nur noch ein Übergangshinweis. Dauerhafte Artefakte liegen jetzt in fachlichen Zielbereichen wie `docs/releases/`, `docs/architecture/`, `docs/reviews/`, `docs/decisions/` oder `docs/archive/`.

Die Strukturentscheidung liegt unter `docs/decisions/docs-structure-target-decision-2026-05-18.md`.

## Regel

Neue Dokumente sollen nicht mehr hier abgelegt werden. Verwende:

- `docs/releases/` für Releasefamilien, Requirements, Specs, Testmatrizen und Reviews.
- `docs/architecture/` für technische Zielbilder und Schichtgrenzen.
- `docs/reviews/` für Audits, Inventare und strukturierte Nachprüfungen.
- `docs/decisions/` für dauerhafte kleine Entscheidungen.
- `docs/activities/` für offene, laufende und erledigte Arbeitspakete.

## Migrationsstand

Die früheren `docs/derived/`-Artefakte wurden schrittweise nach Zielbereichen migriert. Dieser Ordner bleibt vorerst bestehen, damit alte mentale Modelle und Suchen nicht ins Leere laufen; fachlich führend sind aber die neuen Pfade.
