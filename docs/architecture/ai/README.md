# AI-Architektur

Stand: 2026-08-12

Dieser Ordner enthält ausschließlich aktuell benötigte Architektur- und Referenzverträge der NETGRID-KI. Abgeschlossene Implementierungs-, Replay-, Remediation-, Audit-, Cutover- und Match-Prozessdokumente gehören nicht in den aktiven Architekturbestand. Git bleibt die Historie.

## Benennung

Lebende Current-State-Dokumente verwenden kurze, versionslose Dateinamen nach dem Muster `<fachlicher-gegenstand>-<dokumenttyp>.md`. Der Ordner `docs/architecture/ai/` liefert den AI-Kontext; ein zusätzliches `ai-`-Präfix ist deshalb redundant. Datum, Version und Reifegrad stehen im Dokument selbst und in der Git-Historie, nicht im Dateinamen.

## Führende Architektur

1. `change-compass.md` – verbindliches Agenten-Konzentrat vor Änderungen an produktiver KI-Programmlogik.
2. `target-architecture.md` – führendes allgemeines KI-Zielbild und Current-State-Modell.
3. `planning-architecture.md` – detaillierter produktiver Plan-first-, Scheduler-, Ownership- und Ausführungsvertrag.

Diese drei Dokumente bilden den führenden Architekturverbund. Bei Widersprüchen oder Änderungen am gemeinsamen Rahmen sind sie gemeinsam zu prüfen.

## Aktuelle Detail- und Referenzverträge

- `turn-campaign-planner.md` – umgesetzter Detailvertrag des Zug- und Kampagnenplaners.
- `controller-contract.md` – Controller-, LegalAction- und Engine-Autoritätsgrenze.
- `decision-trace-contract.md` – lokaler Trace-, Redaction- und Debugvertrag.
- `simulation-test-matrix.md` – aktuelle Evidenz- und Simulationsmatrix.
- `strategy-signals-guide.md` – Fachreferenz für Taktiksignale, Strategieanker, TargetProfiles, Conditions und Constraints.
- `hint-architecture.md` – weiterhin gültige Strukturentscheidung für AI-Hints.

## Retention-Regel

Ein neues Dokument bleibt hier nur, wenn es einen aktuell geltenden Architektur-, Schnittstellen-, Safety-, Semantik- oder Testvertrag beschreibt, der nicht sinnvoll in einen der führenden Verträge integriert werden kann.

Zeitlich begrenzte Arbeits- und Umsetzungspapiere werden nach Abschluss gelöscht oder – falls noch als aktive Review-Evidence benötigt – im dafür vorgesehenen Review-/Activity-Bereich geführt. Historische Prozessdokumente werden nicht vorsorglich konserviert.
