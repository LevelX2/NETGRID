# AI-Architektur

`docs/architecture/ai/` bündelt releaseübergreifende KI-Zielbilder, Schnittstellenregeln und side-sichere Architekturgrenzen. Diese Artefakte geben keine Karten frei und ändern keine Engine-Regeln; sie beschreiben, welche Informationen KI-Pfade nutzen dürfen und wie AI-Hints, Coaching, Simulation und Controller an LegalActions, PlayerViews und Redaction gebunden bleiben.

## Enthaltene Artefakte

- `ai-controller-spec.md`: Controller-Schnitt für KI-Entscheidungen.
- `ai-decision-trace-contract-2026-05-22.md`: lokaler Vertrag für versionierte KI-Entscheidungslogs, Trace-Redaction, Meta/Drilldown, Export und Live-Follow.
- `ai-simulation-test-matrix.md`: übergreifende Testmatrix für KI-Simulation.
- `ai-hints-structure-decision-2026-05-15.md`: Strukturentscheidung für aktive AI-Hints.
- `coaching-boundary-spec-2026-05-17.md`: side-sichere Grenze für AI-Coaching und Hinweise.
- `ki-zielbild-metaebene-2026-06-01-v5.md`: Zielbild der künftigen semantischen KI-Kette von Kartensemantik über DeckDoctrine und taktische Zwischenziele bis zu semantisch verstandenen LegalActions.
- `ki-roadmap-neue-ki-spieler-2026-06-02-v1.md`: Roadmap für neue semantische KI-Spieler mit read-only Foundation, Action-Semantik-Brücke, Shadow Mode und bereichsweisem Cutover.
- `taktiksignale-strategieanker-guide-2026-06-02-v3.md`: Leitfaden für Taktiksignale, Strategieanker, Rollen, TargetProfiles, Conditions, Risiken und Constraints.
- `action-semantics-bridge-automation-process-2026-06-04.md`: sequenzieller AI034-bis-AI043-Prozess für die read-only Action-Semantik-Brücke mit Preflight, Szenario-Coverage, erweitertem Candidate-/Gate-Schema, eigenem Arbeits-Worktree, lokalen Merge-nach-`main`-Regeln und Handoff.

## Regel

Konkrete Benchmarks, Regressionen und Diagnoseberichte liegen unter `docs/reviews/ai/`. Abgeschlossene Doctrine- und Deck-Legal-Approval-Spuren liegen unter `docs/releases/ai/`.
