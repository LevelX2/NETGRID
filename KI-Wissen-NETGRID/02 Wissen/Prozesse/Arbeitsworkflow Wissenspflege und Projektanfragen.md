# Arbeitsworkflow Wissenspflege und Projektanfragen

Stand: 2026-08-12

## Kurzfassung

Projektarbeit folgt dem Prinzip: Wissensbasis zuerst lesen, aktuelle Quellen und Workspace nur gezielt prüfen, belastbare Erkenntnisse anschließend in die zuständige dauerhafte Quelle zurückführen.

## Aktivitäten-Pipeline

Kleine konkrete Pakete werden unter `docs/activities/` geführt:

- `inbox/`: noch nicht beansprucht;
- `in-progress/`: aktuell in Arbeit;
- `done/`: kurzlebiger Abschluss-Slot.

Ein abgeschlossenes Activity-Paket ist keine dauerhafte Dokumentationsform. Ergebnis, Checks und wiederverwendbares Wissen werden in Code, Tests, Wissensbasis, Architektur, Review, Decision, Releaseartefakt oder Runbook überführt. Danach darf das Paket nach Referenzprüfung gelöscht werden; Git bleibt die Historie.

Wenn der Nutzer sinngemäß sagt „such dir ein Paket aus“, wird aus `inbox/` nach passender Rolle, Klarheit und Priorität gewählt. Reihenfolge: `hotfix`, `critical`, `high`, `normal`, `low`.

## Dauerhafte Artefakte

Neue dauerhafte Dokumente werden direkt fachlich eingeordnet:

- Architektur/Verträge → `docs/architecture/`;
- Release-/Gate-/Requirement-Artefakte → `docs/releases/`;
- aktuelle Audit-/Review-Evidence → `docs/reviews/`;
- Entscheidungen → `docs/decisions/`;
- wiederholbare Betriebs-/Diagnoseabläufe → `docs/runbooks/`;
- Primärquellen → `docs/source/`.

`docs/derived/` ist kein Ziel für neue Dokumente. Ein Repository-Archiv für historische Arbeitsstände wird nicht aufgebaut.

## Fall 1: Projektfrage beantworten

1. [[../00 Uebersichten/Index]] lesen.
2. Relevante Wissensseiten lesen.
3. `docs/codex/CODEX_STATUS.md` prüfen, wenn aktueller Implementierungs- oder Gate-Stand relevant ist.
4. Nur bei Bedarf aktuelle Architektur-, Release-, Source-, Code- oder Testquellen hinzuziehen.
5. Gesicherten Stand, Annahmen und offene Punkte klar trennen.

## Fall 2: Neue Quelle aufnehmen

1. Quelle unverändert in `docs/source/` oder als klar benannte Rohquellenreferenz erfassen.
2. Quelle vollständig auswerten.
3. Quellenpriorität, Scope und Widersprüche prüfen.
4. Betroffene Wissensseiten und aktuelle Verträge aktualisieren.
5. `docs/codex/CODEX_STATUS.md` nur nachziehen, wenn sich aktueller Stand oder nächste Schritte ändern.
6. Log nur nach Relevanzregel ergänzen.

## Fall 3: Erkenntnisse aus Umsetzung zurückführen

1. Prüfen, ob die Erkenntnis wiederverwendbar oder entscheidungsrelevant ist.
2. Genau eine passende dauerhafte Quelle wählen oder eine bestehende erweitern.
3. Wiederkehrende Abläufe als Runbook/Prozess pflegen.
4. Statuswissen in `Aktueller Projektstatus` verdichten.
5. Relevante Architektur-, Workflow-, Gate- oder Abschlussänderungen im Monatslog dokumentieren.
6. Abgeschlossene Arbeitsartefakte löschen, sobald sie keine eigene aktuelle Funktion mehr besitzen.

## Fall 4: Phase oder Gate wechseln

1. Aktuellen Phasenstand und führende Roadmap prüfen.
2. Gate-Kriterien und aktuelle Evidence prüfen.
3. Fehlende Quellen, Tests, Risiken oder Abweichungen dokumentieren.
4. Erst nach bestandenem oder ausdrücklich akzeptiertem Gate fortfahren.
5. Sichtbare Produktversion und fachlicher Releaseabschluss bleiben getrennte Entscheidungen.

## Fall 5: Abschluss

1. Offene Änderungen und lokale Artefakte prüfen.
2. Wiederverwendbares Wissen an die richtige Stelle übertragen.
3. Historische Zwischenartefakte nicht vorsorglich archivieren.
4. Relevante Änderungen sinnvoll committen.
5. Nicht versionierbare lokale Daten sichtbar benennen.
