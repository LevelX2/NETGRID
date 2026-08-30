# docs-Zielstruktur-Entscheidung

Status: `accepted_current`
Ursprüngliche Entscheidung: 2026-05-18
Fortgeschriebener Stand: 2026-08-12
Primärer Agent: `architecture-review-agent`

## Zweck

Diese Entscheidung beschreibt die fachliche Zielstruktur unter `docs/`. Die Retention innerhalb dieser Bereiche folgt zusätzlich der neueren Current-State-Entscheidung `docs-retention-current-state-policy-2026-07-08.md`.

## Zielbereiche

| Bereich               | Zweck                                                                            |
| --------------------- | -------------------------------------------------------------------------------- |
| `docs/source/`        | Primärquellen, Regelreferenzen, Spoiler und andere quellennahe Ausgangsdokumente |
| `docs/activities/`    | offenes und laufendes Arbeitsboard; `done/` nur kurzlebiger Abschluss-Slot       |
| `docs/architecture/`  | aktuelle releaseübergreifende Architektur-, Schnittstellen- und Schichtverträge  |
| `docs/releases/`      | aktuell relevante Release-, Requirement-, Gate- und Planungsartefakte            |
| `docs/reviews/`       | aktuell benötigte Querschnittsreviews, Audits und Gate-Evidence                  |
| `docs/decisions/`     | dauerhafte Projekt-, Produkt-, Git- und Dokumentationsentscheidungen             |
| `docs/runbooks/`      | wiederholbare Betriebs-, Diagnose- und Wartungsabläufe                           |
| `docs/codex/`         | aktueller Codex-Status und noch nicht konsolidierte Steuerungsartefakte          |
| `docs/ui-designsets/` | aktive UI-/Branding-Referenzen                                                   |
| `docs/derived/`       | Übergangsbereich ohne neue Dokumente; darf nach Restmigration entfallen          |

Ein separater `docs/archive/`-Zielbereich gehört nicht mehr zur Current-State-Struktur. Historie liegt in Git.

## Strukturregeln

1. Neue Dokumente werden direkt dem fachlich richtigen Zielbereich zugeordnet.
2. `docs/derived/` ist kein Ziel für neue Artefakte.
3. Architekturordner enthalten aktuelle Verträge und Zielbilder, nicht abgeschlossene Implementierungsprotokolle.
4. Reviewordner enthalten aktuelle Evidence, nicht vollständige historische Auditserien.
5. Releaseordner dürfen historische Familien verlieren, sobald kein aktueller Produkt-, Gate- oder Entscheidungsnutzen mehr besteht.
6. Activities sind Arbeitssteuerung, kein dauerhafter Nachweisbestand.
7. Vor Moves oder Löschungen werden aktive Links und Consumer geprüft.
8. Alte Pfade erhalten keine Redirect-Stubs, wenn kein aktueller Consumer sie benötigt.
9. Git-Historie ersetzt die vorsorgliche Aufbewahrung historischer Dateien im Arbeitsbaum.

## Current-State-Pflege

Ein Artefakt soll nicht allein deshalb behalten werden, weil es irgendwann Requirements, Review, Final Review, Plan, Preflight oder Audit hieß. Entscheidend ist seine heutige Funktion.

Bei einem Cleanup wird bevorzugt:

```text
aktuellen Vertrag identifizieren
→ Ergebniswissen dort konsolidieren
→ aktive Referenzen umstellen
→ historischen Rest löschen
```

statt:

```text
alten Bestand verschieben
→ zusätzlich archivieren
→ neue und alte Wahrheit parallel pflegen
```

## Aktueller Migrationsstand

Die frühere breite `docs/derived/`-Sammlung ist weitgehend in fachliche Zielbereiche aufgeteilt. Die nächsten Strukturarbeiten konzentrieren sich nicht mehr auf Moves, sondern auf das Ausdünnen bereits abgeschlossener historischer Bestände in Architektur, Reviews und Releases.

Die frühere Originalset-Spotcheck-Evidence, Docs-Cleanup-Evidence, UI-Explorationen, abgeschlossene Activity-Sammlungen und der Repository-Archivbereich werden nach dem Current-State-Prinzip nicht mehr als aktive Struktur geführt.

## Verhältnis zur Retention-Entscheidung

Bei Konflikten über Aufbewahrung oder Löschung gilt die jüngere Retention-Entscheidung vom 2026-07-08 in ihrem fortgeschriebenen Current-State-Stand. Diese Strukturentscheidung beantwortet primär **wo** aktuelles Wissen liegt; die Retention-Entscheidung beantwortet **ob** ein Artefakt überhaupt noch im Arbeitsbaum bleiben muss.
