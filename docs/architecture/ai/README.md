# AI-Architektur

Stand: 2026-08-12

Dieser Ordner enthält ausschließlich aktuell benötigte Architektur- und Referenzverträge der NETGRID-KI. Abgeschlossene Implementierungs-, Replay-, Remediation-, Audit-, Cutover- und Match-Prozessdokumente gehören nicht in den aktiven Architekturbestand. Git bleibt die Historie.

## Führende Architektur

1. `ai-program-logic-change-compass.md` – verbindliches Agenten-Konzentrat vor Änderungen an produktiver KI-Programmlogik.
2. `ki-zielbild-metaebene-2026-08-02-v6.md` – führendes allgemeines KI-Zielbild und Current-State-Modell.
3. `ai-plan-layer-target-state-wip.md` – detaillierter produktiver Plan-first-, Scheduler-, Ownership- und Ausführungsvertrag.

Diese drei Dokumente bilden den führenden Architekturverbund. Bei Widersprüchen oder Änderungen am gemeinsamen Rahmen sind sie gemeinsam zu prüfen.

## Aktuelle Detail- und Referenzverträge

- `ai-turn-and-campaign-planner-concept-2026-07-29.md` – umgesetzter Detailvertrag des Zug- und Kampagnenplaners.
- `ai-controller-spec.md` – Controller-, LegalAction- und Engine-Autoritätsgrenze.
- `ai-decision-trace-contract-2026-05-22.md` – lokaler Trace-, Redaction- und Debugvertrag.
- `ai-simulation-test-matrix.md` – aktuelle Evidenz- und Simulationsmatrix.
- `taktiksignale-strategieanker-guide-2026-06-02-v3.md` – Fachreferenz für Taktiksignale, Strategieanker, TargetProfiles, Conditions und Constraints.
- `ai-hints-structure-decision-2026-05-15.md` – weiterhin gültige Strukturentscheidung für AI-Hints.

## Retention-Regel

Ein neues Dokument bleibt hier nur, wenn es einen aktuell geltenden Architektur-, Schnittstellen-, Safety-, Semantik- oder Testvertrag beschreibt, der nicht sinnvoll in einen der führenden Verträge integriert werden kann.

Zeitlich begrenzte Arbeits- und Umsetzungspapiere werden nach Abschluss gelöscht oder – falls noch als aktive Review-Evidence benötigt – im dafür vorgesehenen Review-/Activity-Bereich geführt. Historische Prozessdokumente werden nicht vorsorglich konserviert.
